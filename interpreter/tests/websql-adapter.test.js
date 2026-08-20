'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const websql = require('../maiasql-websql');

function runTransaction(db, callback, readOnly) {
  return new Promise((resolve, reject) => {
    const fn = readOnly ? db.readTransaction.bind(db) : db.transaction.bind(db);
    fn(callback, reject, resolve);
  });
}

describe('MaiaSQL WebSQL adapter', () => {
  it('supports changeVersion and persists schema changes', async () => {
    const db = websql.openDatabase('websql-change-version', '1.0', 'test', 1024);

    await new Promise((resolve, reject) => {
      db.changeVersion('1.0', '2', (tx) => {
        tx.executeSql('CREATE TABLE versioned (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL)');
        tx.executeSql("INSERT INTO versioned (name) VALUES ('Ada')");
      }, reject, resolve);
    });

    assert.equal(db.version, '2');

    await runTransaction(db, (tx) => {
      tx.executeSql('SELECT COUNT(*) AS total FROM versioned', [], (_tx, result) => {
        assert.equal(result.rows.item(0).total, 1);
      });
    });
  });

  it('keeps the previous version when changeVersion rolls back', async () => {
    const db = websql.openDatabase('websql-change-version-rollback', '1.0', 'test', 1024);

    await new Promise((resolve, reject) => {
      db.changeVersion('1.0', '3', (tx) => {
        tx.executeSql('CREATE TABLE stable (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE)');
      }, reject, resolve);
    });

    await assert.rejects(
      new Promise((resolve, reject) => {
        db.changeVersion('3', '4', (tx) => {
          tx.executeSql('CREATE TABLE docs (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE)');
          tx.executeSql("INSERT INTO docs (email) VALUES ('a@example.com')");
          tx.executeSql("INSERT INTO docs (email) VALUES ('a@example.com')");
        }, reject, resolve);
      }),
      /UNIQUE constraint failed/
    );

    assert.equal(db.version, '3');

    await assert.rejects(
      runTransaction(db, (tx) => {
        tx.executeSql('SELECT COUNT(*) AS total FROM docs');
      }),
      /Table or view not found|Table not found/
    );
  });

  it('rejects changeVersion when the expected version does not match', async () => {
    const db = websql.openDatabase('websql-version-mismatch', '1.0', 'test', 1024);

    await assert.rejects(
      new Promise((resolve, reject) => {
        db.changeVersion('9', '10', () => {}, reject, resolve);
      }),
      function (error) {
        assert.equal(error.code, websql.SQLError.VERSION_ERR);
        return /Version mismatch/.test(error.message);
      }
    );

    assert.equal(db.version, '1.0');
  });

  it('continues after statement error when error callback returns true', async () => {
    const db = websql.openDatabase('websql-continue-on-error', '1.0', 'test', 1024);

    await runTransaction(db, (tx) => {
      tx.executeSql('CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE)');
      tx.executeSql("INSERT INTO users (email) VALUES ('a@example.com')");
      tx.executeSql(
        "INSERT INTO users (email) VALUES ('a@example.com')",
        [],
        null,
        function () { return true; }
      );
      tx.executeSql("INSERT INTO users (email) VALUES ('b@example.com')");
    });

    await runTransaction(db, (tx) => {
      tx.executeSql('SELECT COUNT(*) AS total FROM users', [], (_tx, result) => {
        assert.equal(result.rows.item(0).total, 2);
      });
    });
  });

  it('supports bound parameters and exposes insertId in success callbacks', async () => {
    const db = websql.openDatabase('websql-params-insertid', '1.0', 'test', 1024);
    let insertId = null;

    await runTransaction(db, (tx) => {
      tx.executeSql('CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL, age INTEGER)');
      tx.executeSql(
        'INSERT INTO users (email, age) VALUES (?, ?)',
        ['ada@example.com', 36],
        function (_tx, result) {
          insertId = result.insertId;
          assert.equal(result.rowsAffected, 1);
        }
      );
      tx.executeSql(
        'SELECT email, age FROM users WHERE id = ?',
        [1],
        function (_tx, result) {
          assert.equal(result.rows.item(0).email, 'ada@example.com');
          assert.equal(result.rows.item(0).age, 36);
        }
      );
    });

    assert.equal(insertId, 1);
  });

  it('rolls back transaction when statement error is not handled', async () => {
    const db = websql.openDatabase('websql-rollback-on-error', '1.0', 'test', 1024);

    await assert.rejects(
      runTransaction(db, (tx) => {
        tx.executeSql('CREATE TABLE logs (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE)');
        tx.executeSql("INSERT INTO logs (name) VALUES ('first')");
        tx.executeSql("INSERT INTO logs (name) VALUES ('first')");
      }),
      /UNIQUE constraint failed/
    );

    await assert.rejects(
      runTransaction(db, (tx) => {
        tx.executeSql('SELECT COUNT(*) AS total FROM logs');
      }),
      /Table or view not found|Table not found/
    );
  });

  it('rejects writes inside readTransaction', async () => {
    const db = websql.openDatabase('websql-readonly', '1.0', 'test', 1024);

    await runTransaction(db, (tx) => {
      tx.executeSql('CREATE TABLE docs (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL)');
    });

    await assert.rejects(
      runTransaction(db, (tx) => {
        tx.executeSql("INSERT INTO docs (name) VALUES ('forbidden')");
      }, true),
      /read-only|constraint|database/i
    );

    await runTransaction(db, (tx) => {
      tx.executeSql('SELECT COUNT(*) AS total FROM docs', [], (_tx, result) => {
        assert.equal(result.rows.item(0).total, 0);
      });
    });
  });
});

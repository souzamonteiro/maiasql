'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const Parser = require('../sql-parser');
const runtime = require('../maiasql-core');

describe('MaiaSQL prototype runtime', () => {
  it('executes CRUD statements with the memory backend', async () => {
    const db = await runtime.MaiaSQL.open({
      name: 'memory-runtime-test',
      storage: 'memory',
      parser: Parser
    });

    await db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        age INTEGER
      );
      INSERT INTO users (name, age) VALUES ('Ada', 36), ('Grace', 37);
      UPDATE users SET age = age + 1 WHERE name = 'Grace';
    `);

    const result = await db.exec('SELECT id, name, age FROM users ORDER BY id ASC');
    assert.equal(result.rows.length, 2);
    assert.equal(result.rows[1].age, 38);

    const deletion = await db.exec('DELETE FROM users WHERE name = ?', ['Ada']);
    assert.equal(deletion.rowsAffected, 1);
  });

  it('rolls back implicit transaction on failure', async () => {
    const db = await runtime.MaiaSQL.open({
      name: 'memory-rollback-test',
      storage: 'memory',
      parser: Parser
    });

    await db.exec('CREATE TABLE items (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL)');

    await assert.rejects(
      db.exec("INSERT INTO items (name) VALUES ('ok'); INSERT INTO missing_table (name) VALUES ('bad')"),
      /Table not found/
    );

    const result = await db.exec('SELECT COUNT(*) AS total FROM items');
    assert.equal(result.rows[0].total, 0);
  });
});

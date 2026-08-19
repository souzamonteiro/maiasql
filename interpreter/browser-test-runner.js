(function (root) {
  'use strict';

  const suites = [
    {
      name: 'Parser smoke corpus',
      sql: 'tests/smoke-tests.sql',
      mode: 'parser'
    },
    {
      name: 'Runtime schema',
      sql: 'tests/runtime-schema.sql',
      mode: 'native',
      verify: async function (context) {
        const result = await context.db.exec('SELECT COUNT(*) AS total FROM people');
        assertEqual(result.rows[0].total, 3, 'schema seed should create 3 rows');
      }
    },
    {
      name: 'Runtime CRUD',
      sql: 'tests/runtime-crud.sql',
      mode: 'native',
      verify: async function (context) {
        const result = await context.db.exec('SELECT id, name, age FROM people ORDER BY id ASC');
        assertEqual(result.rows.length, 3, 'crud flow should keep 3 rows');
        assertEqual(result.rows[0].name, 'Ada Lovelace', 'first row should remain Ada');
        assertEqual(result.rows[1].age, 38, 'Grace age should have been incremented');
        assertEqual(result.rows[2].name, 'Margaret Hamilton', 'third row should be Margaret');
      }
    },
    {
      name: 'Runtime transactions',
      sql: 'tests/runtime-transactions.sql',
      mode: 'native',
      verify: async function (context) {
        const result = await context.db.exec('SELECT COUNT(*) AS total FROM ledger');
        assertEqual(result.rows[0].total, 1, 'rollback fixture should keep one committed row');
      }
    },
    {
      name: 'WebSQL adapter',
      sql: 'tests/runtime-websql.sql',
      mode: 'websql'
    }
  ];

  async function main() {
    const statusNode = document.querySelector('[data-status]');
    const logNode = document.querySelector('[data-log]');
    const runButton = document.querySelector('[data-run]');
    const resetButton = document.querySelector('[data-reset]');

    const log = function (message, kind) {
      const line = document.createElement('div');
      line.className = `log-line ${kind || 'info'}`;
      line.textContent = message;
      logNode.appendChild(line);
      logNode.scrollTop = logNode.scrollHeight;
    };

    const setStatus = function (message) {
      statusNode.textContent = message;
    };

    resetButton.addEventListener('click', async function () {
      await deleteDatabase('browser-suite-db');
      await deleteDatabase('browser-suite-websql');
      log('IndexedDB state cleared.', 'warn');
    });

    runButton.addEventListener('click', async function () {
      runButton.disabled = true;
      logNode.innerHTML = '';
      try {
        setStatus('Loading parser...');
        const parser = await root.MaiaSQLBrowserLoader.loadParser('./sql-parser.js');
        const runtime = root.MaiaSQLRuntime;
        const websql = root.MaiaSQLWebSQL;
        const db = await runtime.MaiaSQL.open({
          name: 'browser-suite-db',
          version: '1.0',
          storage: 'indexeddb',
          parser: parser
        });
        await db.exec('PRAGMA user_version = 1');

        setStatus('Running suites...');
        for (let i = 0; i < suites.length; i += 1) {
          const suite = suites[i];
          log(`Running: ${suite.name}`);
          const sql = await fetchText(suite.sql);
          if (suite.mode === 'parser') {
            const instance = new parser(sql);
            instance.parse();
            log(`PASS ${suite.name}`, 'pass');
            continue;
          }

          if (suite.mode === 'native') {
            await db.exec(sql);
            if (suite.verify) await suite.verify({ db: db });
            log(`PASS ${suite.name}`, 'pass');
            continue;
          }

          if (suite.mode === 'websql') {
            await runWebSqlSuite(websql, sql, log);
            log(`PASS ${suite.name}`, 'pass');
          }
        }

        setStatus('All browser suites passed.');
      } catch (error) {
        console.error(error);
        log(`FAIL ${error && error.message ? error.message : String(error)}`, 'fail');
        setStatus('Suite failed.');
      } finally {
        runButton.disabled = false;
      }
    });
  }

  async function runWebSqlSuite(websql, sql, log) {
    await deleteDatabase('browser-suite-websql');
    const db = websql.openDatabase('browser-suite-websql', '1.0', 'MaiaSQL WebSQL Suite', 5 * 1024 * 1024);
    const statements = root.MaiaSQLRuntime.splitSqlStatements(sql);

    await new Promise(function (resolve, reject) {
      db.transaction(function (tx) {
        for (let i = 0; i < statements.length; i += 1) {
          const statement = statements[i];
          tx.executeSql(statement, [], function (_tx, result) {
            log(`  statement ${i + 1}: rows=${result.rows.length} affected=${result.rowsAffected}`);
          });
        }
      }, reject, resolve);
    });

    await new Promise(function (resolve, reject) {
      db.readTransaction(function (tx) {
        tx.executeSql(
          'SELECT COUNT(*) AS total FROM web_people',
          [],
          function (_tx, result) {
            try {
              assertEqual(result.rows.item(0).total, 2, 'WebSQL suite should leave 2 rows');
              resolve();
            } catch (error) {
              reject(error);
            }
          },
          function (_tx, error) {
            reject(error);
          }
        );
      }, reject);
    });
  }

  async function fetchText(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    return response.text();
  }

  function assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(`${message}. Expected ${expected}, got ${actual}`);
    }
  }

  async function deleteDatabase(name) {
    if (typeof indexedDB === 'undefined') return;
    await new Promise(function (resolve, reject) {
      const request = indexedDB.deleteDatabase(`maiasql:${name}`);
      request.onsuccess = function () { resolve(); };
      request.onerror = function () { reject(request.error || new Error(`Failed to delete ${name}`)); };
      request.onblocked = function () { resolve(); };
    });
  }

  root.addEventListener('DOMContentLoaded', main);
}(typeof globalThis !== 'undefined' ? globalThis : this));

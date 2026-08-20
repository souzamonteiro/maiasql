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
      name: 'Runtime advanced',
      sql: 'tests/runtime-advanced.sql',
      mode: 'native',
      verify: async function (context) {
        const joinResult = await context.db.exec(`
          SELECT members.name AS member_name, teams.name AS team_name
          FROM members
          LEFT JOIN teams ON members.team_id = teams.id
          WHERE members.team_id IN (
            SELECT id FROM teams WHERE name LIKE 'C%'
          )
          ORDER BY members.id ASC
        `);
        assertEqual(joinResult.rows.length, 2, 'advanced join/subquery fixture should filter to two rows');

        const viewResult = await context.db.exec('SELECT * FROM adult_members ORDER BY id ASC');
        assertEqual(viewResult.rows.length, 3, 'view fixture should expose 3 rows');

        const returningResult = await context.db.exec(`
          UPDATE members
          SET age = age + 1
          WHERE name = 'Grace'
          RETURNING id, name, age
        `);
        assertEqual(returningResult.rows[0].age, 38, 'RETURNING should expose updated age');

        let failed = false;
        try {
          await context.db.exec(`UPDATE members SET age = -1 WHERE name = 'Ada'`);
        } catch (error) {
          failed = /age must be non-negative/.test(error.message);
        }
        assertEqual(failed, true, 'trigger guard should abort invalid update');
      }
    },
    {
      name: 'Runtime analytics',
      sql: 'tests/runtime-analytics.sql',
      mode: 'native',
      verify: async function (context) {
        const grouped = await context.db.exec(`
          SELECT category,
                 COUNT(*) AS total,
                 SUM(amount) AS sum_amount,
                 AVG(amount) AS avg_amount,
                 MIN(amount) AS min_amount,
                 MAX(amount) AS max_amount
          FROM dst
          GROUP BY category
          ORDER BY category ASC
        `);
        assertEqual(grouped.rows.length, 2, 'analytics fixture should produce 2 groups');
        assertEqual(grouped.rows[0].sum_amount, 30, 'group a should sum to 30');
        assertEqual(grouped.rows[1].max_amount, 15, 'group b should max to 15');
      }
    },
    {
      name: 'Runtime distinct',
      sql: 'tests/runtime-distinct.sql',
      mode: 'native',
      verify: async function (context) {
        const distinctResult = await context.db.exec(`
          SELECT DISTINCT category
          FROM inventory
          ORDER BY category ASC
        `);
        assertEqual(distinctResult.rows.length, 2, 'distinct fixture should collapse to 2 categories');

        const havingResult = await context.db.exec(`
          SELECT category,
                 COUNT(qty) AS total_rows,
                 SUM(qty) AS total_qty
          FROM inventory
          GROUP BY category
          HAVING total_qty >= 14
          ORDER BY category ASC
        `);
        assertEqual(havingResult.rows.length, 2, 'having fixture should keep both aggregate groups');
        assertEqual(havingResult.rows[1].total_qty, 19, 'games group should total 19 after replace');

        const replaced = await context.db.exec(`SELECT qty FROM inventory WHERE sku = 'b-1'`);
        assertEqual(replaced.rows[0].qty, 11, 'INSERT OR REPLACE should update conflicting unique row');
      }
    },
    {
      name: 'Runtime case',
      sql: 'tests/runtime-case.sql',
      mode: 'native',
      verify: async function (context) {
        const rows = await context.db.exec(`
          SELECT title,
                 CASE priority
                   WHEN 1 THEN 'high'
                   WHEN 2 THEN 'medium'
                   ELSE 'low'
                 END AS priority_label,
                 CASE
                   WHEN effort >= 7 THEN 'long'
                   WHEN effort >= 4 THEN 'medium'
                   ELSE 'short'
                 END AS effort_band,
                 status
          FROM task_queue
          ORDER BY id ASC
        `);
        assertEqual(rows.rows.length, 3, 'case fixture should keep 3 tasks');
        assertEqual(rows.rows[0].priority_label, 'high', 'simple CASE should map first priority');
        assertEqual(rows.rows[1].effort_band, 'medium', 'searched CASE should classify middle effort');
        assertEqual(rows.rows[2].status, 'queued', 'CASE in UPDATE should fill null status');
      }
    },
    {
      name: 'Runtime pragmas',
      sql: 'tests/runtime-pragmas.sql',
      mode: 'native',
      verify: async function (context) {
        const pragmaVersion = await context.db.exec(`PRAGMA user_version`);
        assertEqual(pragmaVersion.rows[0].user_version, 7, 'user_version pragma should persist assigned value');

        const tableInfo = await context.db.exec(`PRAGMA table_info(tasks)`);
        assertEqual(tableInfo.rows.length, 4, 'table_info should expose four task columns');
        assertEqual(tableInfo.rows[1].name, 'project_code', 'table_info should list the foreign key column');
        assertEqual(tableInfo.rows[1].notnull, 1, 'table_info should expose NOT NULL metadata');

        const indexList = await context.db.exec(`PRAGMA index_list(tasks)`);
        assertEqual(indexList.rows.length, 1, 'index_list should expose one explicit task index');
        assertEqual(indexList.rows[0].partial, 1, 'index_list should mark partial indexes');

        const indexInfo = await context.db.exec(`PRAGMA index_info(idx_projects_code)`);
        assertEqual(indexInfo.rows[0].name, 'code', 'index_info should expose indexed column name');

        const foreignKeys = await context.db.exec(`PRAGMA foreign_key_list(tasks)`);
        assertEqual(foreignKeys.rows.length, 1, 'foreign_key_list should expose one foreign key');
        assertEqual(foreignKeys.rows[0].on_delete, 'CASCADE', 'foreign_key_list should preserve delete action');
        assertEqual(foreignKeys.rows[0].on_update, 'SET NULL', 'foreign_key_list should preserve update action');
      }
    },
    {
      name: 'Runtime ddl',
      sql: 'tests/runtime-ddl.sql',
      mode: 'native',
      verify: async function (context) {
        const existsResult = await context.db.exec(`
          SELECT writers.name
          FROM writers
          WHERE EXISTS (
            SELECT 1
            FROM books
            WHERE books.author_id = writers.id
              AND books.title IS NOT NULL
          )
          ORDER BY writers.name COLLATE nocase ASC
        `);
        assertEqual(existsResult.rows.length, 2, 'exists fixture should keep two writers with books');

        const orderResult = await context.db.exec(`
          SELECT title
          FROM books
          ORDER BY title COLLATE nocase ASC NULLS LAST
        `);
        assertEqual(orderResult.rows[2].title, null, 'null ordering should place null at the end');

        const metadata = await context.db.exec(`SELECT area, note FROM books WHERE id = 1`);
        assertEqual(metadata.rows[0].area, 'general', 'renamed column should preserve default value');
        assertEqual(metadata.rows[0].note, 'pending', 'added column should backfill default');
      }
    },
    {
      name: 'Runtime relational',
      sql: 'tests/runtime-relational.sql',
      mode: 'native',
      verify: async function (context) {
        let foreignKeyFailed = false;
        try {
          await context.db.exec(`INSERT INTO children (parent_id, name) VALUES (999, 'Ghost')`);
        } catch (error) {
          foreignKeyFailed = /FOREIGN KEY constraint failed/.test(error.message);
        }
        assertEqual(foreignKeyFailed, true, 'foreign key fixture should reject orphan child rows');

        const unionResult = await context.db.exec(`
          SELECT name FROM parents WHERE id = 1
          UNION
          SELECT name FROM parents WHERE id = 2
          ORDER BY name ASC
        `);
        assertEqual(unionResult.rows.length, 2, 'union should merge two rows');

        const exceptResult = await context.db.exec(`
          SELECT id FROM parents
          EXCEPT
          SELECT parent_id FROM children
          ORDER BY id ASC
        `);
        assertEqual(exceptResult.rows.length, 1, 'except should leave one unmatched parent');
        assertEqual(exceptResult.rows[0].id, 3, 'remaining parent should be id 3');
      }
    },
    {
      name: 'Runtime fk-actions',
      sql: 'tests/runtime-fk-actions.sql',
      mode: 'native',
      verify: async function (context) {
        await context.db.exec(`UPDATE parent SET code = 'p1-new' WHERE code = 'p1'`);
        const cascaded = await context.db.exec(`SELECT parent_code FROM child_cascade`);
        const nulled = await context.db.exec(`SELECT parent_code FROM child_set_null`);
        assertEqual(cascaded.rows[0].parent_code, 'p1-new', 'cascade update should propagate new key');
        assertEqual(nulled.rows[0].parent_code, null, 'set null update should clear child key');

        let restricted = false;
        try {
          await context.db.exec(`DELETE FROM parent WHERE code = 'p1-new'`);
        } catch (error) {
          restricted = /FOREIGN KEY constraint failed/.test(error.message);
        }
        assertEqual(restricted, true, 'restrict delete should reject referenced parent row');

        await context.db.exec(`DELETE FROM child_restrict WHERE parent_id = 1`);
        await context.db.exec(`DELETE FROM parent WHERE code = 'p1-new'`);
        const cascadeCount = await context.db.exec(`SELECT COUNT(*) AS total FROM child_cascade`);
        assertEqual(cascadeCount.rows[0].total, 0, 'cascade delete should remove dependent rows');

        const funcs = await context.db.exec(`
          SELECT LOWER('MiXeD') AS lower_text,
                 UPPER('MiXeD') AS upper_text,
                 LENGTH('hello') AS text_length,
                 COALESCE(name, 'fallback') AS resolved_name,
                 ABS(amount) AS abs_amount
          FROM metrics
          ORDER BY id ASC
          LIMIT 1
        `);
        assertEqual(funcs.rows[0].lower_text, 'mixed', 'LOWER should normalize text');
        assertEqual(funcs.rows[0].abs_amount, 7, 'ABS should normalize numeric sign');
      }
    },
    {
      name: 'Runtime conflicts-functions',
      sql: 'tests/runtime-conflicts-functions.sql',
      mode: 'native',
      verify: async function (context) {
        let failed = false;
        try {
          await context.db.exec(`INSERT OR FAIL INTO accounts (email, balance) VALUES ('a@example.com', 13.5)`);
        } catch (error) {
          failed = /UNIQUE constraint failed/.test(error.message);
        }
        assertEqual(failed, true, 'OR FAIL should surface unique constraint errors');

        const rows = await context.db.exec(`SELECT email, balance FROM accounts ORDER BY id ASC`);
        assertEqual(rows.rows.length, 2, 'conflict fixture should leave two account rows');
        assertEqual(rows.rows[0].balance, 50.75, 'OR REPLACE should keep replacement balance');

        const funcs = await context.db.exec(`
          SELECT TRIM('  spaced  ') AS trimmed,
                 LTRIM('xxhello', 'x') AS ltrimmed,
                 RTRIM('helloyy', 'y') AS rtrimmed,
                 SUBSTR('abcdef', 2, 3) AS sliced,
                 ROUND(12.3456, 2) AS rounded,
                 IFNULL(NULL, 'fallback') AS fallback_value
        `);
        assertEqual(funcs.rows[0].trimmed, 'spaced', 'TRIM should remove leading/trailing spaces');
        assertEqual(funcs.rows[0].rounded, 12.35, 'ROUND should honor precision');
        assertEqual(funcs.rows[0].fallback_value, 'fallback', 'IFNULL should return the fallback value');
      }
    },
    {
      name: 'WebSQL adapter',
      sql: 'tests/runtime-websql.sql',
      mode: 'websql'
    },
    {
      name: 'WebSQL advanced',
      mode: 'websql-advanced'
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
      await deleteDatabase('browser-suite-websql-advanced');
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
          const sql = suite.sql ? await fetchText(suite.sql) : null;
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
            continue;
          }

          if (suite.mode === 'websql-advanced') {
            await runAdvancedWebSqlSuite(websql, log);
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

  async function runAdvancedWebSqlSuite(websql, log) {
    await deleteDatabase('browser-suite-websql-advanced');
    const db = websql.openDatabase('browser-suite-websql-advanced', '1.0', 'MaiaSQL WebSQL Advanced Suite', 5 * 1024 * 1024);
    let insertedId = null;

    await new Promise(function (resolve, reject) {
      db.changeVersion('1.0', '2', function (tx) {
        tx.executeSql('CREATE TABLE versioned (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE)');
        tx.executeSql("INSERT INTO versioned (email) VALUES ('a@example.com')");
      }, reject, resolve);
    });
    assertEqual(db.version, '2', 'changeVersion should update version');

    await new Promise(function (resolve, reject) {
      db.transaction(function (tx) {
        tx.executeSql(
          "INSERT INTO versioned (email) VALUES ('a@example.com')",
          [],
          null,
          function (_tx, error) {
            assertEqual(error.code, websql.SQLError.CONSTRAINT_ERR, 'duplicate insert should map to constraint error');
            log('  duplicate insert handled and queue continued');
            return true;
          }
        );
        tx.executeSql(
          'INSERT INTO versioned (email) VALUES (?)',
          ['b@example.com'],
          function (_tx, result) {
            insertedId = result.insertId;
          }
        );
      }, reject, resolve);
    });
    if (!(typeof insertedId === 'number' && insertedId >= 2)) {
      throw new Error(`parameterized insert should expose a numeric insertId, got ${insertedId}`);
    }

    await new Promise(function (resolve, reject) {
      db.readTransaction(function (tx) {
        tx.executeSql('SELECT COUNT(*) AS total FROM versioned', [], function (_tx, result) {
          try {
            assertEqual(result.rows.item(0).total, 2, 'advanced WebSQL suite should keep two rows');
            resolve();
          } catch (error) {
            reject(error);
          }
        }, function (_tx, error) {
          reject(error);
        });
      }, reject);
    });

    await new Promise(function (resolve, reject) {
      db.readTransaction(function (tx) {
        tx.executeSql("SELECT id, email FROM versioned WHERE email = 'b@example.com'", [], function (_tx, result) {
          try {
            assertEqual(result.rows.length, 1, 'parameterized insert should persist one b@example.com row');
            assertEqual(result.rows.item(0).email, 'b@example.com', 'parameterized insert should persist the inserted row');
            resolve();
          } catch (error) {
            reject(error);
          }
        }, function (_tx, error) {
          reject(error);
        });
      }, reject);
    });

    await new Promise(function (resolve, reject) {
      db.changeVersion('9', '10', function () {}, function (error) {
        try {
          assertEqual(error.code, websql.SQLError.VERSION_ERR, 'version mismatch should raise VERSION_ERR');
          log(`  version mismatch blocked: ${error.message}`);
          resolve();
        } catch (assertionError) {
          reject(assertionError);
        }
      }, function () {
        reject(new Error('changeVersion should not succeed on version mismatch'));
      });
    });

    await new Promise(function (resolve, reject) {
      db.changeVersion('2', '3', function (tx) {
        tx.executeSql('CREATE TABLE doomed (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE)');
        tx.executeSql("INSERT INTO doomed (email) VALUES ('a@example.com')");
        tx.executeSql("INSERT INTO doomed (email) VALUES ('a@example.com')");
      }, function (error) {
        try {
          const isConstraintLike = error.code === websql.SQLError.CONSTRAINT_ERR
            || /UNIQUE constraint failed|constraint/i.test(error.message);
          assertEqual(isConstraintLike, true, 'failed changeVersion should surface duplicate/constraint failure');
          resolve();
        } catch (assertionError) {
          reject(assertionError);
        }
      }, function () {
        reject(new Error('changeVersion should roll back on duplicate insert'));
      });
    });
    assertEqual(db.version, '2', 'failed changeVersion should preserve previous version');

    await new Promise(function (resolve, reject) {
      db.readTransaction(function (tx) {
        tx.executeSql('SELECT COUNT(*) AS total FROM doomed', [], function () {
          reject(new Error('rolled back changeVersion should not leave doomed table behind'));
        }, function (_tx, error) {
          log(`  failed changeVersion rolled back: ${error.message}`);
          resolve(true);
          return true;
        });
      }, reject);
    });

    await new Promise(function (resolve, reject) {
      db.readTransaction(function (tx) {
        tx.executeSql("INSERT INTO versioned (email) VALUES ('forbidden')", [], null, function (_tx, error) {
          log(`  readTransaction write blocked: ${error.message}`);
          resolve(true);
          return true;
        });
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

(function (root) {
  'use strict';

  const SNIPPETS = {
    starter: [
      'CREATE TABLE IF NOT EXISTS demo_people (',
      '  id INTEGER PRIMARY KEY AUTOINCREMENT,',
      '  name TEXT NOT NULL,',
      '  role TEXT NOT NULL,',
      '  age INTEGER',
      ');',
      '',
      "INSERT INTO demo_people (name, role, age) VALUES ('Ada', 'compiler', 36);",
      "INSERT INTO demo_people (name, role, age) VALUES ('Grace', 'runtime', 37);",
      '',
      'SELECT id, name, role, age',
      'FROM demo_people',
      'ORDER BY id ASC;'
    ].join('\n'),
    analytics: [
      'CREATE TABLE IF NOT EXISTS demo_tasks (',
      '  id INTEGER PRIMARY KEY AUTOINCREMENT,',
      '  area TEXT NOT NULL,',
      '  effort INTEGER NOT NULL',
      ');',
      '',
      "INSERT INTO demo_tasks (area, effort) VALUES ('parser', 2);",
      "INSERT INTO demo_tasks (area, effort) VALUES ('runtime', 5);",
      "INSERT INTO demo_tasks (area, effort) VALUES ('runtime', 8);",
      '',
      'SELECT area,',
      '       COUNT(*) AS total_tasks,',
      '       SUM(effort) AS total_effort,',
      '       CASE',
      "         WHEN SUM(effort) >= 10 THEN 'heavy'",
      "         ELSE 'light'",
      '       END AS load_band',
      'FROM demo_tasks',
      'GROUP BY area',
      'ORDER BY total_effort DESC;'
    ].join('\n'),
    websql: [
      'CREATE TABLE IF NOT EXISTS web_notes (',
      '  id INTEGER PRIMARY KEY AUTOINCREMENT,',
      '  title TEXT NOT NULL,',
      '  status TEXT DEFAULT \'draft\'',
      ');',
      '',
      "INSERT INTO web_notes (title, status) VALUES ('Compatibility layer', 'done');",
      "INSERT INTO web_notes (title) VALUES ('Browser migration');",
      '',
      'SELECT id, title, status',
      'FROM web_notes',
      'ORDER BY id ASC;'
    ].join('\n')
  };

  let parser = null;

  async function main() {
    const modeNode = document.querySelector('[data-mode]');
    const dbNameNode = document.querySelector('[data-db-name]');
    const sqlNode = document.querySelector('[data-sql]');
    const runButton = document.querySelector('[data-run]');
    const loadSeedButton = document.querySelector('[data-load-seed]');
    const clearLogButton = document.querySelector('[data-clear-log]');
    const resetButton = document.querySelector('[data-reset-db]');
    const statusNode = document.querySelector('[data-status]');
    const logNode = document.querySelector('[data-log]');
    const typeMetric = document.querySelector('[data-metric-type]');
    const rowsMetric = document.querySelector('[data-metric-rows]');
    const affectedMetric = document.querySelector('[data-metric-affected]');
    const resultsEmpty = document.querySelector('[data-results-empty]');
    const resultsTable = document.querySelector('[data-results-table]');
    const resultsHead = document.querySelector('[data-results-head]');
    const resultsBody = document.querySelector('[data-results-body]');
    const snippetButtons = Array.prototype.slice.call(document.querySelectorAll('[data-snippet]'));

    sqlNode.value = SNIPPETS.starter;

    function setStatus(message) {
      statusNode.textContent = message;
    }

    function log(message, kind) {
      const line = document.createElement('div');
      line.className = `log-line ${kind || ''}`.trim();
      line.textContent = message;
      logNode.appendChild(line);
      logNode.scrollTop = logNode.scrollHeight;
    }

    function resetResultMetrics() {
      typeMetric.textContent = 'None';
      rowsMetric.textContent = '0';
      affectedMetric.textContent = '0';
    }

    function renderResult(result) {
      const rows = result && Array.isArray(result.rows) ? result.rows : [];
      const columns = result && Array.isArray(result.columns) && result.columns.length
        ? result.columns.map(function (column) { return column.name; })
        : (rows[0] ? Object.keys(rows[0]) : []);

      typeMetric.textContent = result && result.statementType ? result.statementType : 'Unknown';
      rowsMetric.textContent = String(rows.length);
      affectedMetric.textContent = String(result && typeof result.rowsAffected === 'number' ? result.rowsAffected : 0);

      resultsHead.innerHTML = '';
      resultsBody.innerHTML = '';

      if (!columns.length) {
        resultsTable.hidden = true;
        resultsEmpty.hidden = false;
        resultsEmpty.textContent = rows.length
          ? 'Rows are present but have no visible columns.'
          : 'No query rows returned by the last statement.';
        return;
      }

      const headRow = document.createElement('tr');
      for (let i = 0; i < columns.length; i += 1) {
        const th = document.createElement('th');
        th.textContent = columns[i];
        headRow.appendChild(th);
      }
      resultsHead.appendChild(headRow);

      for (let r = 0; r < rows.length; r += 1) {
        const tr = document.createElement('tr');
        for (let c = 0; c < columns.length; c += 1) {
          const td = document.createElement('td');
          const value = rows[r][columns[c]];
          td.textContent = value == null ? 'NULL' : String(value);
          tr.appendChild(td);
        }
        resultsBody.appendChild(tr);
      }

      resultsEmpty.hidden = rows.length > 0;
      if (!rows.length) {
        resultsEmpty.textContent = 'Statement executed successfully but returned no rows.';
      }
      resultsTable.hidden = false;
    }

    async function ensureParserLoaded() {
      if (parser) return parser;
      setStatus('Loading parser...');
      parser = await root.MaiaSQLBrowserLoader.loadParser('./sql-parser.js');
      log('Parser loaded.', 'success');
      return parser;
    }

    async function runNativeSql(name, sql) {
      const loadedParser = await ensureParserLoaded();
      const db = await root.MaiaSQLRuntime.MaiaSQL.open({
        name: name,
        version: '1.0',
        storage: 'indexeddb',
        parser: loadedParser
      });
      return db.exec(sql);
    }

    async function runWebSql(name, sql) {
      const db = root.MaiaSQLWebSQL.openDatabase(name, '1.0', 'MaiaSQL demo', 5 * 1024 * 1024);
      const statements = root.MaiaSQLRuntime.splitSqlStatements(sql);
      let lastResult = {
        statementType: 'EMPTY',
        rows: [],
        rowsAffected: 0,
        columns: []
      };

      await new Promise(function (resolve, reject) {
        db.transaction(function (tx) {
          for (let i = 0; i < statements.length; i += 1) {
            const statement = statements[i];
            tx.executeSql(statement, [], function (_tx, result) {
              const rows = [];
              for (let rowIndex = 0; rowIndex < result.rows.length; rowIndex += 1) {
                rows.push(result.rows.item(rowIndex));
              }
              lastResult = {
                statementType: inferStatementType(statement),
                rows: rows,
                rowsAffected: result.rowsAffected,
                insertId: result.insertId,
                columns: rows[0]
                  ? Object.keys(rows[0]).map(function (name) { return { name: name }; })
                  : []
              };
              log(`statement ${i + 1}: ${lastResult.statementType} rows=${rows.length} affected=${result.rowsAffected}`);
            }, function (_tx, error) {
              reject(error);
            });
          }
        }, reject, resolve);
      });

      return lastResult;
    }

    runButton.addEventListener('click', async function () {
      const sql = sqlNode.value.trim();
      const name = dbNameNode.value.trim() || 'maiasql-demo';
      if (!sql) {
        setStatus('Nothing to run.');
        log('The SQL editor is empty.', 'warn');
        return;
      }

      runButton.disabled = true;
      setStatus('Executing SQL...');
      try {
        const result = modeNode.value === 'websql'
          ? await runWebSql(name, sql)
          : await runNativeSql(name, sql);
        renderResult(result);
        setStatus(`Done via ${modeNode.value === 'websql' ? 'WebSQL adapter' : 'native API'}.`);
        log(`Execution completed with ${result.statementType || 'unknown'} result.`, 'success');
      } catch (error) {
        setStatus('Execution failed.');
        log(error && error.message ? error.message : String(error), 'error');
      } finally {
        runButton.disabled = false;
      }
    });

    loadSeedButton.addEventListener('click', function () {
      sqlNode.value = SNIPPETS.starter;
      setStatus('Starter script loaded.');
    });

    clearLogButton.addEventListener('click', function () {
      logNode.innerHTML = '';
      resetResultMetrics();
      resultsTable.hidden = true;
      resultsEmpty.hidden = false;
      resultsEmpty.textContent = 'No query results yet.';
      setStatus('Log cleared.');
    });

    resetButton.addEventListener('click', async function () {
      const name = dbNameNode.value.trim() || 'maiasql-demo';
      try {
        await deleteDatabase(name);
        setStatus(`Database "${name}" reset.`);
        log(`Deleted IndexedDB database for ${name}.`, 'warn');
      } catch (error) {
        setStatus('Reset failed.');
        log(error && error.message ? error.message : String(error), 'error');
      }
    });

    for (let i = 0; i < snippetButtons.length; i += 1) {
      snippetButtons[i].addEventListener('click', function () {
        const key = snippetButtons[i].getAttribute('data-snippet');
        sqlNode.value = SNIPPETS[key] || SNIPPETS.starter;
        if (key === 'websql') modeNode.value = 'websql';
        setStatus(`Loaded snippet: ${key}.`);
      });
    }

    resetResultMetrics();
    log('MaiaSQL demo ready. Choose a snippet or write your own SQL.', 'success');
  }

  function inferStatementType(sql) {
    const text = String(sql || '').trim().toUpperCase();
    const first = text.split(/\s+/)[0] || 'UNKNOWN';
    return first;
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

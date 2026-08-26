(function () {
  'use strict';

  const state = {
    db: null,
    tableNames: ['users', 'orders', 'tasks'],
    tableMeta: {
      users: ['id', 'name', 'role', 'active'],
      orders: ['id', 'user_id', 'total', 'status'],
      tasks: ['id', 'title', 'priority', 'done']
    }
  };

  const statusPill = document.getElementById('status-pill');
  const dbNameInput = document.getElementById('db-name');
  const dbNameSelect = document.getElementById('db-name-select');
  const dbCurrentLabel = document.getElementById('db-current-label');
  const refreshDbListButton = document.getElementById('refresh-db-list');
  const newDbButton = document.getElementById('new-db');
  const deleteDbButton = document.getElementById('delete-db');
  const seedDemoButton = document.getElementById('seed-demo');
  const resetDbButton = document.getElementById('reset-db');
  const runQueryButton = document.getElementById('run-query');
  const newQueryButton = document.getElementById('new-query');
  const clearOutputButton = document.getElementById('clear-output');
  const sqlEditor = document.getElementById('sql-editor');
  const sqlEditorHighlight = document.getElementById('sql-editor-highlight');
  const sqlSuggestions = document.getElementById('sql-suggestions');
  const queryHistory = document.getElementById('query-history');
  const clearHistoryButton = document.getElementById('clear-history');
  const queryNameInput = document.getElementById('query-name');
  const saveQueryButton = document.getElementById('save-query');
  const savedQueryList = document.getElementById('saved-query-list');
  const tableList = document.getElementById('table-list');
  const schemaPanel = document.getElementById('schema-panel');
  const logPanel = document.getElementById('log-panel');
  const resultsTable = document.getElementById('results-table');
  const resultsHead = document.getElementById('results-head');
  const resultsBody = document.getElementById('results-body');
  const outputEmpty = document.getElementById('output-empty');
  const resultType = document.getElementById('result-type');
  const resultRows = document.getElementById('result-rows');
  const resultChanged = document.getElementById('result-changed');
  const exportCsvButton = document.getElementById('export-csv');

  function setStatus(message) {
    statusPill.textContent = message;
  }

  function log(message, kind) {
    const entry = document.createElement('div');
    entry.className = 'log-entry' + (kind ? ' ' + kind : '');
    entry.textContent = message;
    logPanel.appendChild(entry);
    logPanel.scrollTop = logPanel.scrollHeight;
  }

  const SQL_KEYWORDS = /^(SELECT|FROM|WHERE|INSERT|INTO|UPDATE|DELETE|CREATE|TABLE|IF|NOT|NULL|VALUES|AS|JOIN|LEFT|RIGHT|INNER|OUTER|ON|ORDER|BY|GROUP|HAVING|LIMIT|CASE|WHEN|THEN|ELSE|END|AND|OR|IS|LIKE|IN|BETWEEN|EXISTS|UNION|ALL|ANY|DISTINCT|PRIMARY|KEY|AUTOINCREMENT|DEFAULT|CHECK|REFERENCES|FOREIGN|INDEX|VIEW|TRIGGER|DROP|ALTER|RENAME|ADD|COLUMN|PRAGMA|BEGIN|COMMIT|ROLLBACK|TRANSACTION|SET|RETURNING|USING|WITH|RECURSIVE)$/i;
  const SQL_FUNCTIONS = /^(COUNT|SUM|AVG|MIN|MAX|LOWER|UPPER|LENGTH|ABS|COALESCE|NULLIF|IFNULL|ROUND|CAST|CURRENT_DATE|CURRENT_TIME|CURRENT_TIMESTAMP|DATE|TIME|DATETIME|RANDOM)$/i;

  function appendTextNode(fragment, text) {
    if (!text) {
      return;
    }
    const node = document.createTextNode(text);
    fragment.appendChild(node);
  }

  function makeTokenNode(token) {
    const span = document.createElement('span');
    if (token.match(/^--/)) {
      span.className = 'sql-comment';
    } else if (token.match(/^['"`]/) || token.match(/^\d/)) {
      if (token.startsWith("'") || token.startsWith('"') || token.startsWith('`')) {
        span.className = 'sql-string';
      } else {
        span.className = 'sql-number';
      }
    } else if (SQL_KEYWORDS.test(token)) {
      span.className = 'sql-keyword';
    } else if (SQL_FUNCTIONS.test(token)) {
      span.className = 'sql-function';
    } else if (/^[+\-*\/=<>!|&(),.;]+$/.test(token)) {
      span.className = 'sql-operator';
    }
    span.textContent = token;
    return span;
  }

  function buildHighlightedSql(sql) {
    const fragment = document.createDocumentFragment();
    const text = sql || '';
    const pattern = /(\s+|--.*$|'.*?'|".*?"|`.*?`|\b(?:SELECT|FROM|WHERE|INSERT|INTO|UPDATE|DELETE|CREATE|TABLE|IF|NOT|NULL|VALUES|AS|JOIN|LEFT|RIGHT|INNER|OUTER|ON|ORDER|BY|GROUP|HAVING|LIMIT|CASE|WHEN|THEN|ELSE|END|AND|OR|IS|LIKE|IN|BETWEEN|EXISTS|UNION|ALL|ANY|DISTINCT|PRIMARY|KEY|AUTOINCREMENT|DEFAULT|CHECK|REFERENCES|FOREIGN|INDEX|VIEW|TRIGGER|DROP|ALTER|RENAME|ADD|COLUMN|PRAGMA|BEGIN|COMMIT|ROLLBACK|TRANSACTION|SET|RETURNING|USING|WITH|RECURSIVE|COUNT|SUM|AVG|MIN|MAX|LOWER|UPPER|LENGTH|ABS|COALESCE|NULLIF|IFNULL|ROUND|CAST|CURRENT_DATE|CURRENT_TIME|CURRENT_TIMESTAMP|DATE|TIME|DATETIME|RANDOM)\b|\b\d+(?:\.\d+)?\b|[+\-*\/=<>!|&(),.;]+)/gim;

    let lastIndex = 0;
    let match;

    while ((match = pattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        appendTextNode(fragment, text.slice(lastIndex, match.index));
      }

      const token = match[0];
      if (token.trim() === '') {
        appendTextNode(fragment, token);
      } else {
        fragment.appendChild(makeTokenNode(token));
      }

      lastIndex = match.index + token.length;
    }

    if (lastIndex < text.length) {
      appendTextNode(fragment, text.slice(lastIndex));
    }

    return fragment;
  }

  function renderSqlHighlight() {
    sqlEditorHighlight.replaceChildren(buildHighlightedSql(sqlEditor.value));
  }

  function getSchemaTokens() {
    const names = new Set();
    state.tableNames.forEach(function (tableName) {
      names.add(tableName);
      if (Array.isArray(state.tableMeta[tableName])) {
        state.tableMeta[tableName].forEach(function (columnName) {
          names.add(columnName);
        });
      }
    });
    return Array.from(names).filter(Boolean);
  }

  function getCurrentCompletionToken() {
    const value = sqlEditor.value;
    const caretIndex = sqlEditor.selectionStart;
    const beforeCursor = value.slice(0, caretIndex);
    const match = beforeCursor.match(/([A-Za-z_][A-Za-z0-9_]*)$/);
    return match ? match[1] : '';
  }

  function getCompletionContext() {
    const value = sqlEditor.value;
    const caretIndex = sqlEditor.selectionStart;
    const beforeCursor = value.slice(0, caretIndex);
    const trimmedBefore = beforeCursor.trimEnd();
    const tableContext = trimmedBefore.match(/(?:^|\s)(?:FROM|JOIN|UPDATE|INTO)\s+([A-Za-z_][A-Za-z0-9_]*)?$/i);
    const columnContext = trimmedBefore.match(/(?:^|\s)(?:SELECT|WHERE|ORDER\s+BY|GROUP\s+BY|HAVING|SET|VALUES)\s+([A-Za-z_][A-Za-z0-9_]*)?$/i);

    if (tableContext) {
      return 'table';
    }
    if (columnContext) {
      return 'column';
    }
    return 'general';
  }

  function getContextualSuggestions() {
    const token = getCurrentCompletionToken();
    const query = token.trim().toLowerCase();
    const schemaTokens = getSchemaTokens();
    const keywordSuggestions = [
      'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'UPDATE', 'DELETE', 'CREATE', 'TABLE', 'VALUES',
      'ORDER BY', 'GROUP BY', 'JOIN', 'LEFT JOIN', 'INNER JOIN', 'LIMIT', 'CASE', 'WHEN', 'THEN',
      'ELSE', 'END', 'AND', 'OR', 'IS NULL', 'IS NOT NULL', 'LIKE', 'IN', 'BETWEEN', 'EXISTS',
      'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'DISTINCT', 'AS', 'ON', 'PRIMARY KEY', 'AUTOINCREMENT'
    ];

    const context = getCompletionContext();
    let contextual = [];

    if (context === 'table') {
      contextual = state.tableNames.slice();
    } else if (context === 'column') {
      const preferredTable = state.tableNames[0];
      if (preferredTable && Array.isArray(state.tableMeta[preferredTable])) {
        contextual = state.tableMeta[preferredTable].slice();
      }
    }

    const candidates = Array.from(new Set([
      ...keywordSuggestions,
      ...contextual,
      ...schemaTokens
    ].filter(function (entry) {
      if (!query) {
        return true;
      }
      return String(entry).toLowerCase().indexOf(query) !== -1;
    }))).slice(0, 8);

    return candidates;
  }

  function updateSuggestions() {
    const candidates = getContextualSuggestions();

    if (!candidates.length) {
      sqlSuggestions.classList.add('hidden');
      sqlSuggestions.innerHTML = '';
      return;
    }

    sqlSuggestions.innerHTML = '';
    candidates.forEach(function (entry, index) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'sql-suggestion' + (index === 0 ? ' active' : '');
      button.textContent = entry;
      button.addEventListener('click', function () {
        applySuggestion(entry);
      });
      sqlSuggestions.appendChild(button);
    });

    sqlSuggestions.classList.remove('hidden');
  }

  function applySuggestion(suggestion) {
    const value = sqlEditor.value;
    const caretIndex = sqlEditor.selectionStart;
    const beforeCursor = value.slice(0, caretIndex);
    const afterCursor = value.slice(caretIndex);
    const match = beforeCursor.match(/([A-Za-z_][A-Za-z0-9_]*)$/);
    const replacementStart = match ? caretIndex - match[1].length : caretIndex;
    const nextValue = value.slice(0, replacementStart) + suggestion + value.slice(caretIndex);
    sqlEditor.value = nextValue;
    const newCaret = replacementStart + suggestion.length;
    sqlEditor.selectionStart = newCaret;
    sqlEditor.selectionEnd = newCaret;
    sqlEditor.focus();
    renderSqlHighlight();
    updateSuggestions();
    sqlEditor.dispatchEvent(new Event('input', { bubbles: true }));
  }

  const QUERY_HISTORY_KEY = 'maiasql-admin-query-history';
  const SAVED_QUERIES_KEY = 'maiasql-admin-saved-queries';

  function readQueryHistory() {
    try {
      const raw = localStorage.getItem(QUERY_HISTORY_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(function (value) { return typeof value === 'string' && value.trim(); }) : [];
    } catch (error) {
      return [];
    }
  }

  function writeQueryHistory(entries) {
    try {
      localStorage.setItem(QUERY_HISTORY_KEY, JSON.stringify(entries));
    } catch (error) {
      // Ignore storage failures in local-only browser shells.
    }
  }

  function renderQueryHistory() {
    const entries = readQueryHistory();
    queryHistory.innerHTML = '';

    if (!entries.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-item';
      empty.textContent = 'No recent queries yet.';
      queryHistory.appendChild(empty);
      return;
    }

    entries.forEach(function (entry) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'query-history-item';
      button.textContent = entry;
      button.title = entry;
      button.addEventListener('click', function () {
        sqlEditor.value = entry;
        renderSqlHighlight();
        sqlEditor.focus();
        setStatus('Loaded');
      });
      queryHistory.appendChild(button);
    });
  }

  function addQueryToHistory(sqlText) {
    const trimmed = (sqlText || '').trim();
    if (!trimmed) {
      return;
    }

    const entries = readQueryHistory();
    const next = [trimmed].concat(entries.filter(function (entry) { return entry !== trimmed; })).slice(0, 8);
    writeQueryHistory(next);
    renderQueryHistory();
  }

  function readSavedQueries() {
    try {
      const raw = localStorage.getItem(SAVED_QUERIES_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(function (entry) {
        return entry && typeof entry.name === 'string' && typeof entry.sql === 'string';
      }) : [];
    } catch (error) {
      return [];
    }
  }

  function writeSavedQueries(entries) {
    try {
      localStorage.setItem(SAVED_QUERIES_KEY, JSON.stringify(entries));
    } catch (error) {
      // Ignore storage failures in local-only browser shells.
    }
  }

  function renderSavedQueries() {
    const entries = readSavedQueries();
    savedQueryList.innerHTML = '';

    if (!entries.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-item';
      empty.textContent = 'No saved queries.';
      savedQueryList.appendChild(empty);
      return;
    }

    entries.forEach(function (entry) {
      const wrapper = document.createElement('div');
      wrapper.className = 'saved-query-item';

      const nameButton = document.createElement('button');
      nameButton.type = 'button';
      nameButton.className = 'query-history-item';
      nameButton.textContent = entry.name;
      nameButton.title = entry.sql;
      nameButton.addEventListener('click', function () {
        sqlEditor.value = entry.sql;
        renderSqlHighlight();
        sqlEditor.focus();
        setStatus('Saved query loaded');
      });

      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'remove';
      deleteButton.textContent = 'Remove';
      deleteButton.addEventListener('click', function () {
        const next = readSavedQueries().filter(function (item) {
          return item.name !== entry.name || item.sql !== entry.sql;
        });
        writeSavedQueries(next);
        renderSavedQueries();
      });

      wrapper.appendChild(nameButton);
      wrapper.appendChild(deleteButton);
      savedQueryList.appendChild(wrapper);
    });
  }

  function saveCurrentQuery() {
    const sqlText = (sqlEditor.value || '').trim();
    const name = (queryNameInput.value || '').trim() || 'Saved query';
    if (!sqlText) {
      setStatus('Empty query');
      return;
    }

    const entries = readSavedQueries();
    const nextEntries = [{ name, sql: sqlText }].concat(entries.filter(function (item) {
      return !(item.name === name && item.sql === sqlText);
    })).slice(0, 8);
    writeSavedQueries(nextEntries);
    renderSavedQueries();
    queryNameInput.value = '';
    setStatus('Saved');
  }

  function insertAtCursor(text) {
    const value = sqlEditor.value;
    const start = sqlEditor.selectionStart;
    const end = sqlEditor.selectionEnd;
    const nextValue = value.slice(0, start) + text + value.slice(end);
    sqlEditor.value = nextValue;
    const newPos = start + text.length;
    sqlEditor.selectionStart = newPos;
    sqlEditor.selectionEnd = newPos;
    sqlEditor.focus();
    renderSqlHighlight();
    updateSuggestions();
  }

  function getColumnTypeLabel(columnInfo) {
    if (!columnInfo) {
      return 'unknown';
    }
    if (typeof columnInfo === 'string') {
      return columnInfo;
    }
    if (typeof columnInfo === 'object') {
      if (columnInfo.type) {
        return String(columnInfo.type);
      }
      if (columnInfo.kind) {
        return String(columnInfo.kind);
      }
    }
    return 'unknown';
  }

  function buildSchemaTree() {
    const container = document.createElement('div');
    container.className = 'schema-tree';

    state.tableNames.forEach(function (tableName) {
      const node = document.createElement('div');
      node.className = 'schema-node';

      const tableButton = document.createElement('button');
      tableButton.type = 'button';
      tableButton.className = 'schema-table-button';
      tableButton.textContent = tableName;

      const columnList = document.createElement('div');
      columnList.className = 'schema-column-list hidden';

      const columns = Array.isArray(state.tableMeta[tableName]) ? state.tableMeta[tableName] : [];
      if (columns.length) {
        columns.forEach(function (columnInfo) {
          const columnName = typeof columnInfo === 'string' ? columnInfo : (columnInfo && columnInfo.name ? columnInfo.name : String(columnInfo));
          const typeLabel = getColumnTypeLabel(columnInfo);
          const columnButton = document.createElement('button');
          columnButton.type = 'button';
          columnButton.className = 'schema-column-button';

          const nameSpan = document.createElement('span');
          nameSpan.className = 'column-name';
          nameSpan.textContent = columnName;

          const typeSpan = document.createElement('span');
          typeSpan.className = 'column-type';
          typeSpan.textContent = typeLabel;

          columnButton.appendChild(nameSpan);
          columnButton.appendChild(typeSpan);
          columnButton.addEventListener('click', function () {
            insertAtCursor(columnName);
            setStatus('Column inserted');
          });
          columnList.appendChild(columnButton);
        });
      } else {
        const emptyColumn = document.createElement('div');
        emptyColumn.className = 'schema-column-button';
        emptyColumn.textContent = 'No columns';
        columnList.appendChild(emptyColumn);
      }

      tableButton.addEventListener('click', function () {
        columnList.classList.toggle('hidden');
      });

      node.appendChild(tableButton);
      node.appendChild(columnList);
      container.appendChild(node);
    });

    return container;
  }

  function renderTableList() {
    tableList.innerHTML = '';
    if (!state.tableNames.length) {
      tableList.innerHTML = '<li class="empty-item">No tables in this database.</li>';
      schemaPanel.classList.add('empty');
      schemaPanel.textContent = 'Select a table to inspect its fields.';
      return;
    }

    state.tableNames.forEach(function (tableName) {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = tableName;
      button.addEventListener('click', function () {
        schemaPanel.classList.remove('empty');
        schemaPanel.innerHTML = '';
        schemaPanel.appendChild(buildSchemaTree());
      });
      item.appendChild(button);
      tableList.appendChild(item);
    });

    schemaPanel.classList.remove('empty');
    schemaPanel.innerHTML = '';
    schemaPanel.appendChild(buildSchemaTree());
  }

  async function refreshDatabaseSchema(db) {
    const targetDb = db || state.db;
    if (!targetDb || typeof targetDb.getCatalog !== 'function') {
      state.tableNames = [];
      state.tableMeta = {};
      renderTableList();
      return;
    }

    const catalog = await targetDb.getCatalog();
    const tableNames = Object.keys(catalog && catalog.tables ? catalog.tables : {});
    const tableMeta = {};
    tableNames.forEach(function (tableName) {
      const table = catalog.tables[tableName];
      if (table && Array.isArray(table.columns)) {
        tableMeta[tableName] = table.columns.map(function (column) { return column && column.name ? column.name : String(column); });
      } else {
        tableMeta[tableName] = [];
      }
    });

    state.tableNames = tableNames;
    state.tableMeta = tableMeta;
    renderTableList();
    const currentName = (dbNameInput.value || '').trim() || 'maiasql-admin-demo';
    if (!tableNames.length) {
      schemaPanel.classList.add('empty');
      schemaPanel.textContent = 'No tables in ' + currentName + ' yet.';
    } else {
      schemaPanel.classList.add('empty');
      schemaPanel.textContent = 'Select a table to inspect its fields.';
    }
  }

  const KNOWN_DATABASES_KEY = 'maiasql-admin-known-databases';

  function readKnownDatabases() {
    try {
      const raw = localStorage.getItem(KNOWN_DATABASES_KEY);
      if (!raw) {
        return ['maiasql-admin-demo'];
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || !parsed.length) {
        return ['maiasql-admin-demo'];
      }
      return parsed.filter(function (name) { return typeof name === 'string' && name.trim(); });
    } catch (error) {
      return ['maiasql-admin-demo'];
    }
  }

  function writeKnownDatabases(names) {
    try {
      const uniqueNames = Array.from(new Set(names.filter(function (name) { return typeof name === 'string' && name.trim(); }))).sort();
      localStorage.setItem(KNOWN_DATABASES_KEY, JSON.stringify(uniqueNames));
      return uniqueNames;
    } catch (error) {
      return names;
    }
  }

  function normalizeDatabaseName(name) {
    return String(name || '').replace(/^maiasql:/i, '').trim();
  }

  function refreshDatabaseSelector() {
    const names = writeKnownDatabases(readKnownDatabases());
    dbNameSelect.innerHTML = '';
    names.forEach(function (name) {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      dbNameSelect.appendChild(option);
    });
    if (names.indexOf(dbNameInput.value.trim()) === -1) {
      dbNameInput.value = names[0] || 'maiasql-admin-demo';
    }
    dbNameSelect.value = dbNameInput.value.trim() || names[0] || 'maiasql-admin-demo';
    dbCurrentLabel.textContent = 'Current: ' + (dbNameInput.value.trim() || 'maiasql-admin-demo');
  }

  async function refreshKnownDatabases() {
    const names = new Set(readKnownDatabases());

    if (window.indexedDB && typeof window.indexedDB.databases === 'function') {
      try {
        const entries = await window.indexedDB.databases();
        entries.forEach(function (entry) {
          const normalizedName = normalizeDatabaseName(entry && entry.name ? entry.name : '');
          if (normalizedName) {
            names.add(normalizedName);
          }
        });
      } catch (error) {
        log('Could not enumerate browser IndexedDB databases: ' + (error && error.message ? error.message : String(error)), 'warn');
      }
    }

    const orderedNames = Array.from(names).sort();
    writeKnownDatabases(orderedNames);
    refreshDatabaseSelector();
    return orderedNames;
  }

  function rememberDatabaseName(name) {
    const trimmed = (name || '').trim();
    if (!trimmed) {
      return;
    }
    const names = readKnownDatabases();
    names.push(trimmed);
    writeKnownDatabases(names);
    refreshDatabaseSelector();
    dbNameInput.value = trimmed;
    dbNameSelect.value = trimmed;
  }

  function removeDatabaseName(name) {
    const trimmed = (name || '').trim();
    if (!trimmed) {
      return;
    }
    const names = readKnownDatabases().filter(function (item) { return item !== trimmed; });
    writeKnownDatabases(names);
    refreshDatabaseSelector();
  }

  function clearResults() {
    resultsHead.innerHTML = '';
    resultsBody.innerHTML = '';
    resultsTable.hidden = true;
    outputEmpty.hidden = false;
    outputEmpty.textContent = 'No query rows yet.';
    resultType.textContent = '-';
    resultRows.textContent = '0';
    resultChanged.textContent = '0';
  }

  function exportCsv() {
    const rows = resultsBody.querySelectorAll('tr');
    if (!rows.length) {
      setStatus('No data to export');
      return;
    }

    const headers = Array.from(resultsHead.querySelectorAll('th')).map(function (th) {
      return th.textContent.trim();
    });
    const lines = [headers.join(',')];

    rows.forEach(function (row) {
      const cells = Array.from(row.querySelectorAll('td')).map(function (cell) {
        const value = (cell.textContent || '').replace(/"/g, '""');
        return '"' + value + '"';
      });
      lines.push(cells.join(','));
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'maiasql-results.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatus('CSV exported');
  }

  function renderResult(result) {
    const rows = result && Array.isArray(result.rows) ? result.rows : [];
    const columns = result && Array.isArray(result.columns) && result.columns.length
      ? result.columns.map(function (column) { return column.name; })
      : (rows[0] ? Object.keys(rows[0]) : []);

    resultType.textContent = result && result.statementType ? result.statementType : 'UNKNOWN';
    resultRows.textContent = String(rows.length);
    resultChanged.textContent = String(result && typeof result.rowsAffected === 'number' ? result.rowsAffected : 0);

    resultsHead.innerHTML = '';
    resultsBody.innerHTML = '';

    if (!columns.length) {
      resultsTable.hidden = true;
      outputEmpty.hidden = false;
      outputEmpty.textContent = 'Statement executed successfully but returned no visible columns.';
      return;
    }

    const headRow = document.createElement('tr');
    columns.forEach(function (columnName) {
      const th = document.createElement('th');
      th.textContent = columnName;
      headRow.appendChild(th);
    });
    resultsHead.appendChild(headRow);

    rows.forEach(function (row) {
      const tr = document.createElement('tr');
      columns.forEach(function (columnName) {
        const td = document.createElement('td');
        const value = row[columnName];
        td.textContent = value == null ? 'NULL' : String(value);
        tr.appendChild(td);
      });
      resultsBody.appendChild(tr);
    });

    resultsTable.hidden = false;
    outputEmpty.hidden = rows.length > 0;
    if (!rows.length) {
      outputEmpty.textContent = 'Statement executed successfully but returned no rows.';
    }
  }

  function collectParserCandidates() {
    if (window.MaiaSQLAdminPathResolver && typeof window.MaiaSQLAdminPathResolver.buildParserCandidates === 'function') {
      return window.MaiaSQLAdminPathResolver.buildParserCandidates(window.location.href);
    }

    const candidates = new Set();
    const current = new URL(window.location.href);
    const origin = current.origin;
    const pathname = current.pathname.replace(/\/+$/, '');
    const segments = pathname && pathname !== '/' ? pathname.split('/').filter(Boolean) : [];

    function addRelative(relativePath) {
      try {
        candidates.add(new URL(relativePath, current).href);
      } catch (error) {
        // Ignore invalid relative URLs.
      }
    }

    function addAbsolute(prefixSegments) {
      const normalized = prefixSegments.filter(Boolean);
      const path = normalized.length ? '/' + normalized.join('/') + '/sql-parser.js' : '/sql-parser.js';
      try {
        candidates.add(new URL(path, origin).href);
      } catch (error) {
        // Ignore invalid absolute URLs.
      }
    }

    [
      '../sql-parser.js',
      './sql-parser.js',
      './interpreter/sql-parser.js',
      '../interpreter/sql-parser.js',
      '/interpreter/sql-parser.js',
      '/sql-parser.js'
    ].forEach(addRelative);

    for (let i = 0; i <= segments.length; i += 1) {
      addAbsolute(segments.slice(0, i));
    }

    return Array.from(candidates);
  }

  async function openDatabase() {
    const requestedName = (dbNameInput.value || '').trim() || 'maiasql-admin-demo';
    dbNameInput.value = requestedName;
    dbNameSelect.value = requestedName;

    if (state.db && state.db.name === requestedName) {
      return state.db;
    }

    let parser = window.MaiaSQLParser;
    if (!parser && window.MaiaSQLBrowserLoader && typeof window.MaiaSQLBrowserLoader.loadParser === 'function') {
      const candidates = collectParserCandidates();

      let lastError = null;
      for (let i = 0; i < candidates.length; i += 1) {
        try {
          parser = await window.MaiaSQLBrowserLoader.loadParser(candidates[i]);
          break;
        } catch (error) {
          lastError = error;
        }
      }
      if (!parser) {
        throw lastError || new Error('MaiaSQL parser was not loaded in the browser.');
      }
    }

    if (!parser) {
      throw new Error('MaiaSQL parser was not loaded in the browser.');
    }

    const dbName = requestedName;
    state.db = await window.MaiaSQLRuntime.MaiaSQL.open({
      name: dbName,
      storage: 'indexeddb',
      parser: parser
    });

    rememberDatabaseName(dbName);
    await refreshDatabaseSchema(state.db);
    return state.db;
  }

  async function seedDemoDatabase() {
    const db = await openDatabase();
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        active INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        total INTEGER NOT NULL,
        status TEXT DEFAULT 'pending'
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        priority INTEGER DEFAULT 1,
        done INTEGER DEFAULT 0
      );

      INSERT OR IGNORE INTO users (id, name, role, active) VALUES
        (1, 'Ada', 'compiler', 1),
        (2, 'Grace', 'runtime', 1),
        (3, 'Linus', 'maintainer', 0);

      INSERT OR IGNORE INTO orders (id, user_id, total, status) VALUES
        (1, 1, 125, 'paid'),
        (2, 2, 50, 'pending');

      INSERT OR IGNORE INTO tasks (id, title, priority, done) VALUES
        (1, 'parser pass', 2, 1),
        (2, 'runtime fix', 3, 0);
    `);

    state.tableNames = ['users', 'orders', 'tasks'];
    state.tableMeta = {
      users: ['id', 'name', 'role', 'active'],
      orders: ['id', 'user_id', 'total', 'status'],
      tasks: ['id', 'title', 'priority', 'done']
    };
    await refreshDatabaseSchema(db);
    log('Demo seed loaded.', 'success');
    setStatus('Seeded');
  }

  async function runCurrentQuery() {
    const sql = sqlEditor.value.trim();
    if (!sql) {
      log('SQL editor is empty.', 'warn');
      setStatus('Empty');
      return;
    }

    setStatus('Running');
    runQueryButton.disabled = true;

    try {
      const db = await openDatabase();
      const result = await db.exec(sql);
      addQueryToHistory(sql);
      await refreshDatabaseSchema(db);
      renderResult(result);
      log('Query executed successfully.', 'success');
      setStatus('Ready');
    } catch (error) {
      clearResults();
      log(error && error.message ? error.message : String(error), 'error');
      setStatus('Error');
    } finally {
      runQueryButton.disabled = false;
    }
  }

  function loadStarterQuery() {
    sqlEditor.value = [
      'SELECT id, name, role, active',
      'FROM users',
      'ORDER BY id ASC;'
    ].join('\n');
    renderSqlHighlight();
    log('Starter query loaded.', 'success');
    setStatus('Ready');
  }

  async function switchDatabase(nextName) {
    const name = (nextName || '').trim() || 'maiasql-admin-demo';
    dbNameInput.value = name;
    dbNameSelect.value = name;
    dbCurrentLabel.textContent = 'Current: ' + name;

    if (state.db && state.db.name === name) {
      await refreshDatabaseSchema(state.db);
      return state.db;
    }

    state.db = null;
    try {
      const db = await openDatabase();
      await refreshDatabaseSchema(db);
      return db;
    } catch (error) {
      log(error && error.message ? error.message : String(error), 'error');
      setStatus('Database error');
      return null;
    }
  }

  sqlEditor.addEventListener('input', function () {
    renderSqlHighlight();
    updateSuggestions();
  });
  sqlEditor.addEventListener('keyup', function () {
    renderSqlHighlight();
    updateSuggestions();
  });
  sqlEditor.addEventListener('click', updateSuggestions);
  sqlEditor.addEventListener('focus', updateSuggestions);
  sqlEditor.addEventListener('blur', function () {
    sqlSuggestions.classList.add('hidden');
  });
  sqlEditor.addEventListener('keydown', function (event) {
    const suggestions = sqlSuggestions.querySelectorAll('.sql-suggestion');
    if (!suggestions.length) {
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const currentIndex = Array.from(suggestions).findIndex(function (item) {
        return item.classList.contains('active');
      });
      const nextIndex = event.key === 'ArrowDown'
        ? (currentIndex + 1) % suggestions.length
        : (currentIndex <= 0 ? suggestions.length - 1 : currentIndex - 1);

      suggestions.forEach(function (item, index) {
        item.classList.toggle('active', index === nextIndex);
      });
      return;
    }

    if (event.key === 'Enter' || event.key === 'Tab') {
      const active = Array.from(suggestions).find(function (item) {
        return item.classList.contains('active');
      });
      if (active) {
        event.preventDefault();
        applySuggestion(active.textContent.trim());
      }
    }
  });
  sqlEditor.addEventListener('scroll', function () {
    sqlEditorHighlight.scrollTop = sqlEditor.scrollTop;
    sqlEditorHighlight.scrollLeft = sqlEditor.scrollLeft;
  });

  dbNameInput.addEventListener('change', function () {
    switchDatabase(dbNameInput.value);
  });

  dbNameSelect.addEventListener('change', function () {
    switchDatabase(dbNameSelect.value);
  });

  refreshDbListButton.addEventListener('click', function () {
    refreshKnownDatabases();
    setStatus('Database list refreshed');
  });

  newDbButton.addEventListener('click', function () {
    const name = (dbNameInput.value || '').trim() || 'maiasql-admin-demo';
    dbNameInput.value = name;
    rememberDatabaseName(name);
    switchDatabase(name);
    setStatus('New DB ready');
  });

  runQueryButton.addEventListener('click', runCurrentQuery);
  newQueryButton.addEventListener('click', loadStarterQuery);
  seedDemoButton.addEventListener('click', seedDemoDatabase);
  clearOutputButton.addEventListener('click', function () {
    sqlEditor.value = '';
    renderSqlHighlight();
    logPanel.innerHTML = '';
    clearResults();
    setStatus('Cleared');
  });

  clearHistoryButton.addEventListener('click', function () {
    writeQueryHistory([]);
    renderQueryHistory();
    setStatus('History cleared');
  });

  exportCsvButton.addEventListener('click', exportCsv);

  saveQueryButton.addEventListener('click', saveCurrentQuery);
  queryNameInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      saveCurrentQuery();
    }
  });

  async function deleteSelectedDatabase() {
    const name = dbNameInput.value.trim() || 'maiasql-admin-demo';
    setStatus('Deleting');
    try {
      if (window.indexedDB) {
        await new Promise(function (resolve, reject) {
          const request = window.indexedDB.deleteDatabase('maiasql:' + name);
          request.onsuccess = resolve;
          request.onerror = reject;
          request.onblocked = function () { reject(new Error('IndexedDB delete was blocked.')); };
        });
      }
      state.db = null;
      removeDatabaseName(name);
      await refreshKnownDatabases();
      await refreshDatabaseSchema(null);
      log('Database deleted.', 'warn');
      setStatus('Deleted');
    } catch (error) {
      log(error && error.message ? error.message : String(error), 'error');
      setStatus('Delete error');
    }
  }

  resetDbButton.addEventListener('click', deleteSelectedDatabase);
  deleteDbButton.addEventListener('click', deleteSelectedDatabase);

  renderSqlHighlight();
  renderQueryHistory();
  renderSavedQueries();
  refreshKnownDatabases().catch(function (error) {
    log(error && error.message ? error.message : String(error), 'warn');
  });
  renderTableList();
  clearResults();
  setStatus('Ready');
  log('Admin shell ready.', 'success');
})();

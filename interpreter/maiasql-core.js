(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./sql-parser'));
  } else {
    root.MaiaSQLRuntime = factory(root.MaiaSQLParser || null);
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function (DefaultParser) {
  'use strict';

  const DIALECT = 'MaiaSQL';

  class MaiaSQLError extends Error {
    constructor(message, code, details) {
      super(message);
      this.name = 'MaiaSQLError';
      this.code = code || 'MAIASQL_ERROR';
      this.details = details || null;
    }
  }

  class MaiaResult {
    constructor(options) {
      this.columns = options.columns || [];
      this.rows = options.rows || [];
      this.rowsAffected = options.rowsAffected || 0;
      this.insertId = Object.prototype.hasOwnProperty.call(options, 'insertId')
        ? options.insertId
        : null;
      this.statementType = options.statementType || 'UNKNOWN';
      this.warnings = options.warnings || [];
    }
  }

  class MemoryStorageEngine {
    constructor() {
      this.state = createEmptyState();
    }

    async open() {}
    async close() {}

    async load() {
      return deepClone(this.state);
    }

    async save(state) {
      this.state = deepClone(state);
    }
  }

  class IndexedDbStorageEngine {
    constructor(name) {
      this.name = `maiasql:${name}`;
      this.db = null;
    }

    async open() {
      if (typeof indexedDB === 'undefined') {
        throw new MaiaSQLError('IndexedDB is not available in this environment', 'NO_INDEXEDDB');
      }

      this.db = await new Promise((resolve, reject) => {
        const request = indexedDB.open(this.name, 1);
        request.onupgradeneeded = function () {
          const db = request.result;
          if (!db.objectStoreNames.contains('state')) {
            db.createObjectStore('state');
          }
        };
        request.onsuccess = function () { resolve(request.result); };
        request.onerror = function () { reject(request.error || new Error('Failed to open IndexedDB')); };
      });
    }

    async close() {
      if (this.db) {
        this.db.close();
        this.db = null;
      }
    }

    async load() {
      const record = await idbRequest(this.db, 'readonly', 'state', function (store, resolve, reject) {
        const request = store.get('state');
        request.onsuccess = function () { resolve(request.result || null); };
        request.onerror = function () { reject(request.error || new Error('Failed to read database state')); };
      });

      return record ? deepClone(record) : createEmptyState();
    }

    async save(state) {
      await idbRequest(this.db, 'readwrite', 'state', function (store, resolve, reject) {
        const request = store.put(deepClone(state), 'state');
        request.onsuccess = function () { resolve(); };
        request.onerror = function () { reject(request.error || new Error('Failed to save database state')); };
      });
    }
  }

  class MaiaTransaction {
    constructor(database, options) {
      this.database = database;
      this.id = `${database.name}:${Date.now()}:${Math.random().toString(16).slice(2)}`;
      this.mode = options && options.readOnly ? 'readonly' : 'readwrite';
      this.readOnly = this.mode === 'readonly';
      this.state = null;
      this.active = false;
      this.completed = false;
      this.controlFrames = [];
    }

    async begin() {
      if (this.active) return this;
      this.state = await this.database.storage.load();
      this.active = true;
      this.controlFrames = [];
      return this;
    }

    async exec(sql, params, options) {
      ensureActiveTransaction(this);
      return this.database._execInternal(sql, params, options, this);
    }

    async commit() {
      ensureActiveTransaction(this);
      if (!this.readOnly) {
        await this.database.storage.save(this.state);
      }
      this.completed = true;
      this.active = false;
    }

    async rollback() {
      ensureActiveTransaction(this);
      this.completed = true;
      this.active = false;
      this.controlFrames = [];
    }
  }

  class MaiaDatabase {
    constructor(options) {
      this.name = options.name || 'database';
      this.version = options.version == null ? '1.0' : String(options.version);
      this.displayName = options.displayName || this.name;
      this.estimatedSize = options.estimatedSize || 0;
      this.parser = options.parser || DefaultParser || null;
      this.storageType = options.storage || inferDefaultStorage();
      this.storage = createStorageEngine(this.storageType, this.name);
      this.ready = this.storage.open().then(() => this._initializeMetadata());
    }

    async _initializeMetadata() {
      const state = await this.storage.load();
      if (!state.meta.version) state.meta.version = this.version;
      await this.storage.save(state);
      this.version = state.meta.version;
    }

    async exec(sql, params, options) {
      await this.ready;
      return this._execInternal(sql, params, options || null, null);
    }

    async _execInternal(sql, params, options, externalTransaction) {
      const source = String(sql || '').trim();
      if (!source) {
        return new MaiaResult({ statementType: 'EMPTY' });
      }

      validateSqlWithParser(this.parser, source);
      const statements = splitSqlStatements(source);
      let lastResult = new MaiaResult({ statementType: 'EMPTY' });
      const tx = externalTransaction || await this._openImplicitTransaction(options);

      try {
        for (let i = 0; i < statements.length; i += 1) {
          lastResult = executeStatement(statements[i], tx, normalizeParams(params || []));
        }

        if (!externalTransaction) {
          await tx.commit();
        }

        if (lastResult.statementType === 'PRAGMA' && typeof lastResult.version === 'string') {
          this.version = lastResult.version;
        }

        const stateVersion = tx.state && tx.state.meta ? tx.state.meta.version : null;
        if (stateVersion) this.version = stateVersion;
        return lastResult;
      } catch (error) {
        if (!externalTransaction) {
          await tx.rollback();
        }
        throw adaptError(error);
      }
    }

    async _openImplicitTransaction(options) {
      const tx = new MaiaTransaction(this, options || null);
      await tx.begin();
      return tx;
    }

    async transaction(callback, options) {
      await this.ready;
      const tx = new MaiaTransaction(this, options || null);
      await tx.begin();
      try {
        const result = await callback(tx);
        if (!tx.completed) await tx.commit();
        return result;
      } catch (error) {
        if (!tx.completed) await tx.rollback();
        throw adaptError(error);
      }
    }

    async readTransaction(callback, options) {
      return this.transaction(callback, Object.assign({}, options, { readOnly: true }));
    }

    async getCatalog() {
      await this.ready;
      const state = await this.storage.load();
      return deepClone(state.catalog);
    }

    async close() {
      await this.storage.close();
    }
  }

  const MaiaSQL = {
    version: '0.1.0-prototype',
    async open(options) {
      const database = new MaiaDatabase(options || {});
      await database.ready;
      return database;
    },
    async openMemory(options) {
      return MaiaSQL.open(Object.assign({}, options, { storage: 'memory' }));
    }
  };

  function inferDefaultStorage() {
    return typeof indexedDB !== 'undefined' ? 'indexeddb' : 'memory';
  }

  function createStorageEngine(storage, name) {
    if (storage === 'memory') return new MemoryStorageEngine();
    if (storage === 'indexeddb') return new IndexedDbStorageEngine(name);
    throw new MaiaSQLError(`Unsupported storage backend: ${storage}`, 'UNSUPPORTED_STORAGE');
  }

  function ensureActiveTransaction(tx) {
    if (!tx || !tx.active || tx.completed) {
      throw new MaiaSQLError('Transaction is not active', 'INVALID_TRANSACTION');
    }
  }

  function idbRequest(db, mode, storeName, action) {
    return new Promise(function (resolve, reject) {
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      transaction.onabort = function () {
        reject(transaction.error || new Error('IndexedDB transaction aborted'));
      };
      transaction.onerror = function () {
        reject(transaction.error || new Error('IndexedDB transaction failed'));
      };
      action(store, resolve, reject);
    });
  }

  function createEmptyState() {
    return {
      meta: {
        version: '1.0',
        lastInsertId: 0,
        pragmas: {
          foreign_keys: false,
          user_version: 0
        }
      },
      catalog: {
        tables: {},
        indexes: {},
        views: {},
        triggers: {}
      }
    };
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function adaptError(error) {
    if (error instanceof MaiaSQLError) return error;
    return new MaiaSQLError(error && error.message ? error.message : String(error), 'EXECUTION_ERROR');
  }

  function normalizeParams(params) {
    if (Array.isArray(params)) return params.slice();
    return [];
  }

  function validateSqlWithParser(ParserCtor, sql) {
    if (!ParserCtor) return;
    const parser = new ParserCtor(sql);
    parser.parse();
  }

  function splitSqlStatements(sql) {
    const statements = [];
    let start = 0;
    let index = 0;
    let inString = false;
    let inLineComment = false;
    let inBlockComment = false;

    while (index < sql.length) {
      const current = sql[index];
      const next = sql[index + 1];

      if (inLineComment) {
        if (current === '\n') inLineComment = false;
        index += 1;
        continue;
      }

      if (inBlockComment) {
        if (current === '*' && next === '/') {
          inBlockComment = false;
          index += 2;
          continue;
        }
        index += 1;
        continue;
      }

      if (inString) {
        if (current === '\'' && next === '\'') {
          index += 2;
          continue;
        }
        if (current === '\'') {
          inString = false;
        }
        index += 1;
        continue;
      }

      if (current === '\'' ) {
        inString = true;
        index += 1;
        continue;
      }

      if (current === '-' && next === '-') {
        inLineComment = true;
        index += 2;
        continue;
      }

      if (current === '/' && next === '*') {
        inBlockComment = true;
        index += 2;
        continue;
      }

      if (current === ';') {
        const part = sql.slice(start, index).trim();
        if (part) statements.push(part);
        start = index + 1;
      }

      index += 1;
    }

    const tail = sql.slice(start).trim();
    if (tail) statements.push(tail);
    return statements;
  }

  function stripComments(sql) {
    return sql
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/--.*$/gm, ' ')
      .trim();
  }

  function executeStatement(statement, tx, params) {
    const normalized = stripComments(statement);
    const upper = normalized.toUpperCase();

    if (upper.startsWith('CREATE TABLE')) return executeCreateTable(normalized, tx);
    if (upper.startsWith('CREATE INDEX')) return executeCreateIndex(normalized, tx);
    if (upper.startsWith('CREATE VIEW')) return executeCreateView(normalized, tx);
    if (upper.startsWith('CREATE TRIGGER')) return executeCreateTrigger(normalized, tx);
    if (upper.startsWith('INSERT')) return executeInsert(normalized, tx, params);
    if (upper.startsWith('SELECT')) return executeSelect(normalized, tx, params);
    if (upper.startsWith('UPDATE')) return executeUpdate(normalized, tx, params);
    if (upper.startsWith('DELETE')) return executeDelete(normalized, tx, params);
    if (upper.startsWith('BEGIN')) return executeBegin(tx);
    if (upper.startsWith('COMMIT') || upper.startsWith('END')) return executeCommit(tx);
    if (upper.startsWith('ROLLBACK')) return executeRollback(normalized, tx);
    if (upper.startsWith('SAVEPOINT')) return executeSavepoint(normalized, tx);
    if (upper.startsWith('RELEASE')) return executeRelease(normalized, tx);
    if (upper.startsWith('VACUUM')) {
      return new MaiaResult({ statementType: 'VACUUM', warnings: ['VACUUM is a metadata no-op in this prototype'] });
    }
    if (upper.startsWith('PRAGMA')) return executePragma(normalized, tx);

    throw new MaiaSQLError(`Unsupported SQL statement: ${statement}`, 'UNSUPPORTED_STATEMENT');
  }

  function executeCreateTable(sql, tx) {
    ensureWritable(tx);
    const match = sql.match(/^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?((?:[A-Za-z_][\w$]*|"(?:[^"]|"")+"?)(?:\s*\.\s*(?:[A-Za-z_][\w$]*|"(?:[^"]|"")+"?))?)\s*\(([\s\S]+)\)\s*(STRICT)?$/i);
    if (!match) {
      throw new MaiaSQLError(`Could not parse CREATE TABLE statement: ${sql}`, 'INVALID_CREATE_TABLE');
    }

    const tableName = normalizeQualifiedName(match[1]).name;
    const strict = Boolean(match[3]);
    const parts = splitTopLevel(match[2], ',');
    const table = {
      name: tableName,
      strict: strict,
      columns: [],
      primaryKey: null,
      autoIncrement: 1,
      rows: []
    };

    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i].trim();
      if (!part) continue;
      if (/^(CONSTRAINT|PRIMARY|UNIQUE|CHECK|FOREIGN)\b/i.test(part)) {
        continue;
      }
      const column = parseColumnDefinition(part);
      table.columns.push(column);
      if (column.primaryKey) table.primaryKey = column.name;
    }

    if (!table.columns.length) {
      throw new MaiaSQLError(`Table ${tableName} must define at least one column`, 'EMPTY_TABLE');
    }

    tx.state.catalog.tables[tableName] = table;
    return new MaiaResult({ statementType: 'CREATE_TABLE' });
  }

  function executeCreateIndex(sql, tx) {
    ensureWritable(tx);
    const match = sql.match(/^CREATE\s+(UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([A-Za-z_][\w$"]*)\s+ON\s+([A-Za-z_][\w$"]*)\s*\(([\s\S]+?)\)(?:\s+WHERE\s+([\s\S]+))?$/i);
    if (!match) {
      throw new MaiaSQLError(`Could not parse CREATE INDEX statement: ${sql}`, 'INVALID_CREATE_INDEX');
    }
    tx.state.catalog.indexes[normalizeIdentifier(match[2])] = {
      name: normalizeIdentifier(match[2]),
      table: normalizeIdentifier(match[3]),
      unique: Boolean(match[1]),
      columns: splitTopLevel(match[4], ',').map(function (entry) {
        return normalizeIdentifier(entry.trim().split(/\s+/)[0]);
      }),
      where: match[5] ? match[5].trim() : null
    };
    return new MaiaResult({ statementType: 'CREATE_INDEX' });
  }

  function executeCreateView(sql, tx) {
    ensureWritable(tx);
    const match = sql.match(/^CREATE\s+VIEW\s+([A-Za-z_][\w$"]*)\s*(?:\(([\s\S]+?)\))?\s+AS\s+([\s\S]+)$/i);
    if (!match) throw new MaiaSQLError(`Could not parse CREATE VIEW statement: ${sql}`, 'INVALID_CREATE_VIEW');
    tx.state.catalog.views[normalizeIdentifier(match[1])] = {
      name: normalizeIdentifier(match[1]),
      columns: match[2] ? splitTopLevel(match[2], ',').map(function (item) { return normalizeIdentifier(item.trim()); }) : [],
      sql: match[3].trim()
    };
    return new MaiaResult({ statementType: 'CREATE_VIEW', warnings: ['Views are stored as metadata only in this prototype'] });
  }

  function executeCreateTrigger(sql, tx) {
    ensureWritable(tx);
    const match = sql.match(/^CREATE\s+TRIGGER\s+([A-Za-z_][\w$"]*)/i);
    if (!match) throw new MaiaSQLError(`Could not parse CREATE TRIGGER statement: ${sql}`, 'INVALID_CREATE_TRIGGER');
    tx.state.catalog.triggers[normalizeIdentifier(match[1])] = { name: normalizeIdentifier(match[1]), sql: sql };
    return new MaiaResult({ statementType: 'CREATE_TRIGGER', warnings: ['Triggers are stored as metadata only in this prototype'] });
  }

  function executeInsert(sql, tx, params) {
    ensureWritable(tx);
    const match = sql.match(/^INSERT\s+INTO\s+((?:[A-Za-z_][\w$]*|"(?:[^"]|"")+"?)(?:\s*\.\s*(?:[A-Za-z_][\w$]*|"(?:[^"]|"")+"?))?)\s*(?:\(([\s\S]+?)\))?\s+VALUES\s+([\s\S]+?)(?:\s+RETURNING\s+([\s\S]+))?$/i);
    if (!match) throw new MaiaSQLError(`Could not parse INSERT statement: ${sql}`, 'INVALID_INSERT');

    const table = getTable(tx, normalizeQualifiedName(match[1]).name);
    const columns = match[2]
      ? splitTopLevel(match[2], ',').map(function (item) { return normalizeIdentifier(item.trim()); })
      : table.columns.map(function (column) { return column.name; });
    const tuples = parseValueTuples(match[3]);
    const paramState = { values: params, index: 0 };
    const insertedRows = [];
    let lastInsertId = null;

    for (let i = 0; i < tuples.length; i += 1) {
      const row = buildDefaultRow(table);
      const values = splitTopLevel(tuples[i], ',').map(function (item) { return item.trim(); });
      if (values.length !== columns.length) {
        throw new MaiaSQLError(`INSERT column/value count mismatch on ${table.name}`, 'INSERT_ARITY');
      }

      for (let valueIndex = 0; valueIndex < values.length; valueIndex += 1) {
        const columnName = columns[valueIndex];
        const expression = compileExpression(values[valueIndex]);
        row[columnName] = expression(row, paramState);
      }

      applyInsertDefaultsAndConstraints(table, row, tx.state.meta);
      table.rows.push(row);
      insertedRows.push(deepClone(row));
      if (table.primaryKey && row[table.primaryKey] != null) {
        lastInsertId = row[table.primaryKey];
      }
    }

    if (match[4]) {
      return projectReturningRows(match[4], insertedRows, params, 'INSERT', lastInsertId);
    }

    return new MaiaResult({
      statementType: 'INSERT',
      rowsAffected: insertedRows.length,
      insertId: lastInsertId
    });
  }

  function executeSelect(sql, tx, params) {
    const parsed = parseSelectStatement(sql);
    const paramState = { values: params, index: 0 };
    const rows = materializeSourceRows(parsed, tx, paramState);
    const result = projectSelectRows(parsed, rows, paramState);
    return new MaiaResult({
      statementType: 'SELECT',
      columns: result.columns,
      rows: result.rows,
      rowsAffected: 0
    });
  }

  function executeUpdate(sql, tx, params) {
    ensureWritable(tx);
    const parsed = parseUpdateStatement(sql);
    const table = getTable(tx, parsed.table);
    const paramState = { values: params, index: 0 };
    const predicate = parsed.where ? compileExpression(parsed.where) : function () { return true; };
    const assignments = parsed.assignments.map(function (item) {
      return {
        column: normalizeIdentifier(item.column),
        evaluate: compileExpression(item.expression)
      };
    });
    const affectedRows = [];

    for (let i = 0; i < table.rows.length; i += 1) {
      const row = table.rows[i];
      if (!predicate(row, paramState)) continue;
      const nextRow = deepClone(row);
      for (let a = 0; a < assignments.length; a += 1) {
        nextRow[assignments[a].column] = assignments[a].evaluate(nextRow, paramState);
      }
      enforceRowConstraints(table, nextRow);
      table.rows[i] = nextRow;
      affectedRows.push(deepClone(nextRow));
    }

    if (parsed.returning) {
      return projectReturningRows(parsed.returning, affectedRows, params, 'UPDATE', null);
    }

    return new MaiaResult({
      statementType: 'UPDATE',
      rowsAffected: affectedRows.length
    });
  }

  function executeDelete(sql, tx, params) {
    ensureWritable(tx);
    const parsed = parseDeleteStatement(sql);
    const table = getTable(tx, parsed.table);
    const paramState = { values: params, index: 0 };
    const predicate = parsed.where ? compileExpression(parsed.where) : function () { return true; };
    const remaining = [];
    const removed = [];

    for (let i = 0; i < table.rows.length; i += 1) {
      const row = table.rows[i];
      if (predicate(row, paramState)) {
        removed.push(deepClone(row));
      } else {
        remaining.push(row);
      }
    }

    table.rows = remaining;

    if (parsed.returning) {
      return projectReturningRows(parsed.returning, removed, params, 'DELETE', null);
    }

    return new MaiaResult({
      statementType: 'DELETE',
      rowsAffected: removed.length
    });
  }

  function executePragma(sql, tx) {
    const match = sql.match(/^PRAGMA\s+([A-Za-z_][\w$]*)(?:\s*=\s*([\s\S]+)|\s*\(\s*([\s\S]+)\s*\))?$/i);
    if (!match) throw new MaiaSQLError(`Could not parse PRAGMA statement: ${sql}`, 'INVALID_PRAGMA');
    const key = normalizeIdentifier(match[1]).toLowerCase();
    const rawValue = match[2] || match[3];

    if (!rawValue) {
      return new MaiaResult({
        statementType: 'PRAGMA',
        columns: [{ name: key }],
        rows: [{ [key]: tx.state.meta.pragmas[key] }]
      });
    }

    ensureWritable(tx);
    const value = literalValue(rawValue.trim());
    tx.state.meta.pragmas[key] = value;
    if (key === 'user_version') {
      tx.state.meta.version = String(value);
    }
    return new MaiaResult({
      statementType: 'PRAGMA',
      rowsAffected: 0,
      warnings: [],
      insertId: null,
      version: tx.state.meta.version
    });
  }

  function executeBegin(tx) {
    tx.controlFrames.push({
      type: 'transaction',
      name: null,
      snapshot: deepClone(tx.state)
    });
    return new MaiaResult({ statementType: 'BEGIN' });
  }

  function executeCommit(tx) {
    for (let i = tx.controlFrames.length - 1; i >= 0; i -= 1) {
      if (tx.controlFrames[i].type === 'transaction') {
        tx.controlFrames.splice(i, 1);
        break;
      }
    }
    return new MaiaResult({ statementType: 'COMMIT' });
  }

  function executeSavepoint(sql, tx) {
    const match = sql.match(/^SAVEPOINT\s+([A-Za-z_][\w$"]*)$/i);
    if (!match) throw new MaiaSQLError(`Could not parse SAVEPOINT statement: ${sql}`, 'INVALID_SAVEPOINT');
    tx.controlFrames.push({
      type: 'savepoint',
      name: normalizeIdentifier(match[1]),
      snapshot: deepClone(tx.state)
    });
    return new MaiaResult({ statementType: 'SAVEPOINT' });
  }

  function executeRelease(sql, tx) {
    const match = sql.match(/^RELEASE\s+(?:SAVEPOINT\s+)?([A-Za-z_][\w$"]*)$/i);
    if (!match) throw new MaiaSQLError(`Could not parse RELEASE statement: ${sql}`, 'INVALID_RELEASE');
    const target = normalizeIdentifier(match[1]);
    const index = findControlFrameIndex(tx, 'savepoint', target);
    if (index < 0) throw new MaiaSQLError(`Unknown savepoint: ${target}`, 'UNKNOWN_SAVEPOINT');
    tx.controlFrames.splice(index, 1);
    return new MaiaResult({ statementType: 'RELEASE' });
  }

  function executeRollback(sql, tx) {
    const savepointMatch = sql.match(/^ROLLBACK\s+(?:TRANSACTION\s+)?TO\s+(?:SAVEPOINT\s+)?([A-Za-z_][\w$"]*)$/i);
    if (savepointMatch) {
      const target = normalizeIdentifier(savepointMatch[1]);
      const index = findControlFrameIndex(tx, 'savepoint', target);
      if (index < 0) throw new MaiaSQLError(`Unknown savepoint: ${target}`, 'UNKNOWN_SAVEPOINT');
      tx.state = deepClone(tx.controlFrames[index].snapshot);
      tx.controlFrames = tx.controlFrames.slice(0, index + 1);
      return new MaiaResult({ statementType: 'ROLLBACK' });
    }

    const transactionIndex = findLastTransactionFrameIndex(tx);
    if (transactionIndex >= 0) {
      tx.state = deepClone(tx.controlFrames[transactionIndex].snapshot);
      tx.controlFrames = tx.controlFrames.slice(0, transactionIndex);
    }
    return new MaiaResult({ statementType: 'ROLLBACK' });
  }

  function findControlFrameIndex(tx, type, name) {
    for (let i = tx.controlFrames.length - 1; i >= 0; i -= 1) {
      const frame = tx.controlFrames[i];
      if (frame.type === type && frame.name === name) return i;
    }
    return -1;
  }

  function findLastTransactionFrameIndex(tx) {
    for (let i = tx.controlFrames.length - 1; i >= 0; i -= 1) {
      if (tx.controlFrames[i].type === 'transaction') return i;
    }
    return -1;
  }

  function ensureWritable(tx) {
    if (tx.readOnly) {
      throw new MaiaSQLError('Write statement attempted inside read-only transaction', 'READ_ONLY');
    }
  }

  function getTable(tx, name) {
    const table = tx.state.catalog.tables[name];
    if (!table) throw new MaiaSQLError(`Table not found: ${name}`, 'UNKNOWN_TABLE');
    return table;
  }

  function parseColumnDefinition(part) {
    const tokens = part.match(/"[^"]+"|`[^`]+`|\[[^\]]+\]|[^\s]+/g) || [];
    if (tokens.length < 2) throw new MaiaSQLError(`Invalid column definition: ${part}`, 'INVALID_COLUMN');
    const name = normalizeIdentifier(tokens.shift());
    const upper = part.toUpperCase();
    const typeParts = [];

    while (tokens.length > 0 && !/^(PRIMARY|NOT|DEFAULT|CHECK|COLLATE|REFERENCES|UNIQUE|CONSTRAINT)$/i.test(tokens[0])) {
      typeParts.push(tokens.shift());
    }

    let defaultValue = null;
    const defaultMatch = part.match(/\bDEFAULT\b\s+(.+)$/i);
    if (defaultMatch) {
      const tail = defaultMatch[1];
      const cut = tail.match(/^(.*?)(?:\s+(?:PRIMARY|NOT|CHECK|COLLATE|REFERENCES|UNIQUE)\b|$)/i);
      defaultValue = cut ? cut[1].trim() : tail.trim();
    }

    return {
      name: name,
      type: typeParts.join(' ') || 'TEXT',
      primaryKey: /\bPRIMARY\s+KEY\b/i.test(upper),
      autoIncrement: /\bAUTOINCREMENT\b/i.test(upper),
      notNull: /\bNOT\s+NULL\b/i.test(upper),
      defaultValue: defaultValue
    };
  }

  function normalizeQualifiedName(name) {
    const parts = name.split('.').map(function (item) { return normalizeIdentifier(item.trim()); });
    return {
      schema: parts.length > 1 ? parts[0] : null,
      name: parts[parts.length - 1]
    };
  }

  function normalizeIdentifier(name) {
    const value = String(name || '').trim();
    if (!value) return value;
    if ((value[0] === '"' && value[value.length - 1] === '"')
      || (value[0] === '`' && value[value.length - 1] === '`')
      || (value[0] === '[' && value[value.length - 1] === ']')) {
      return value.slice(1, -1).replace(/""/g, '"').replace(/``/g, '`');
    }
    return value;
  }

  function buildDefaultRow(table) {
    const row = {};
    for (let i = 0; i < table.columns.length; i += 1) {
      const column = table.columns[i];
      row[column.name] = column.defaultValue == null ? null : literalValue(column.defaultValue);
    }
    return row;
  }

  function applyInsertDefaultsAndConstraints(table, row, meta) {
    for (let i = 0; i < table.columns.length; i += 1) {
      const column = table.columns[i];
      if (row[column.name] == null && column.primaryKey && column.autoIncrement) {
        row[column.name] = table.autoIncrement;
        table.autoIncrement += 1;
        meta.lastInsertId = row[column.name];
      }
      if (row[column.name] == null && column.defaultValue != null) {
        row[column.name] = literalValue(column.defaultValue);
      }
      if (column.notNull && row[column.name] == null) {
        throw new MaiaSQLError(`Column ${column.name} cannot be NULL`, 'NOT_NULL');
      }
    }

    if (table.primaryKey) {
      const pk = table.primaryKey;
      const seen = table.rows.some(function (existing) {
        return existing[pk] === row[pk];
      });
      if (seen) {
        throw new MaiaSQLError(`PRIMARY KEY constraint failed: ${table.name}.${pk}`, 'PRIMARY_KEY');
      }
    }
  }

  function enforceRowConstraints(table, row) {
    for (let i = 0; i < table.columns.length; i += 1) {
      const column = table.columns[i];
      if (column.notNull && row[column.name] == null) {
        throw new MaiaSQLError(`Column ${column.name} cannot be NULL`, 'NOT_NULL');
      }
    }
  }

  function parseValueTuples(source) {
    const tuples = [];
    let depth = 0;
    let inString = false;
    let current = '';

    for (let i = 0; i < source.length; i += 1) {
      const ch = source[i];
      const next = source[i + 1];
      current += ch;

      if (inString) {
        if (ch === '\'' && next === '\'') {
          current += next;
          i += 1;
          continue;
        }
        if (ch === '\'') inString = false;
        continue;
      }

      if (ch === '\'') {
        inString = true;
        continue;
      }

      if (ch === '(') depth += 1;
      if (ch === ')') {
        depth -= 1;
        if (depth === 0) {
          tuples.push(current.trim().replace(/^\(/, '').replace(/\)$/, ''));
          current = '';
          while (source[i + 1] === ',' || /\s/.test(source[i + 1] || '')) i += 1;
        }
      }
    }

    return tuples.filter(Boolean);
  }

  function splitTopLevel(source, delimiter) {
    const parts = [];
    let current = '';
    let depth = 0;
    let inString = false;

    for (let i = 0; i < source.length; i += 1) {
      const ch = source[i];
      const next = source[i + 1];

      if (inString) {
        current += ch;
        if (ch === '\'' && next === '\'') {
          current += next;
          i += 1;
          continue;
        }
        if (ch === '\'') inString = false;
        continue;
      }

      if (ch === '\'') {
        inString = true;
        current += ch;
        continue;
      }

      if (ch === '(') depth += 1;
      if (ch === ')') depth -= 1;

      if (ch === delimiter && depth === 0) {
        parts.push(current);
        current = '';
        continue;
      }

      current += ch;
    }

    if (current) parts.push(current);
    return parts;
  }

  function parseSelectStatement(sql) {
    const upper = sql.toUpperCase();
    const selectIndex = upper.indexOf('SELECT ');
    const fromIndex = findClauseIndex(upper, ' FROM ');
    const whereIndex = findClauseIndex(upper, ' WHERE ');
    const orderIndex = findClauseIndex(upper, ' ORDER BY ');
    const limitIndex = findClauseIndex(upper, ' LIMIT ');
    const offsetIndex = findClauseIndex(upper, ' OFFSET ');

    const columnsText = sql.slice(selectIndex + 7, fromIndex >= 0 ? fromIndex : sql.length).trim();
    const fromText = fromIndex >= 0
      ? sql.slice(fromIndex + 6, nearestPositive([whereIndex, orderIndex, limitIndex, offsetIndex], sql.length)).trim()
      : null;
    const whereText = whereIndex >= 0
      ? sql.slice(whereIndex + 7, nearestPositive([orderIndex, limitIndex, offsetIndex], sql.length)).trim()
      : null;
    const orderText = orderIndex >= 0
      ? sql.slice(orderIndex + 10, nearestPositive([limitIndex, offsetIndex], sql.length)).trim()
      : null;
    const limitText = limitIndex >= 0
      ? sql.slice(limitIndex + 7, nearestPositive([offsetIndex], sql.length)).trim()
      : null;
    const offsetText = offsetIndex >= 0
      ? sql.slice(offsetIndex + 8).trim()
      : null;

    return {
      columns: splitTopLevel(columnsText, ',').map(parseProjection),
      from: fromText ? normalizeQualifiedName(fromText.split(/\s+/)[0]).name : null,
      where: whereText,
      orderBy: orderText ? splitTopLevel(orderText, ',').map(parseOrderingTerm) : [],
      limit: limitText,
      offset: offsetText
    };
  }

  function parseProjection(source) {
    const text = source.trim();
    if (text === '*') {
      return { kind: 'star' };
    }
    const countMatch = text.match(/^COUNT\s*\(\s*\*\s*\)(?:\s+AS\s+([A-Za-z_][\w$"]*))?$/i);
    if (countMatch) {
      return { kind: 'count', alias: countMatch[1] ? normalizeIdentifier(countMatch[1]) : 'count(*)' };
    }
    const aliasMatch = text.match(/^(.*?)(?:\s+AS\s+|\s+)([A-Za-z_][\w$"]*)$/i);
    if (aliasMatch && aliasMatch[1].indexOf('(') === -1) {
      return {
        kind: 'expression',
        expression: aliasMatch[1].trim(),
        alias: normalizeIdentifier(aliasMatch[2])
      };
    }
    return {
      kind: 'expression',
      expression: text,
      alias: inferAliasFromExpression(text)
    };
  }

  function parseOrderingTerm(source) {
    const match = source.trim().match(/^(.*?)(?:\s+(ASC|DESC))?$/i);
    return {
      expression: match[1].trim(),
      direction: (match[2] || 'ASC').toUpperCase()
    };
  }

  function parseUpdateStatement(sql) {
    const match = sql.match(/^UPDATE\s+([A-Za-z_][\w$"]*)\s+SET\s+([\s\S]+?)(?:\s+WHERE\s+([\s\S]+?))?(?:\s+RETURNING\s+([\s\S]+))?$/i);
    if (!match) throw new MaiaSQLError(`Could not parse UPDATE statement: ${sql}`, 'INVALID_UPDATE');
    return {
      table: normalizeIdentifier(match[1]),
      assignments: splitTopLevel(match[2], ',').map(function (entry) {
        const pair = entry.split('=');
        if (pair.length < 2) throw new MaiaSQLError(`Invalid assignment: ${entry}`, 'INVALID_ASSIGNMENT');
        return {
          column: pair[0].trim(),
          expression: pair.slice(1).join('=').trim()
        };
      }),
      where: match[3] ? match[3].trim() : null,
      returning: match[4] ? match[4].trim() : null
    };
  }

  function parseDeleteStatement(sql) {
    const match = sql.match(/^DELETE\s+FROM\s+([A-Za-z_][\w$"]*)(?:\s+WHERE\s+([\s\S]+?))?(?:\s+RETURNING\s+([\s\S]+))?$/i);
    if (!match) throw new MaiaSQLError(`Could not parse DELETE statement: ${sql}`, 'INVALID_DELETE');
    return {
      table: normalizeIdentifier(match[1]),
      where: match[2] ? match[2].trim() : null,
      returning: match[3] ? match[3].trim() : null
    };
  }

  function materializeSourceRows(parsed, tx, paramState) {
    let rows;
    if (parsed.from) {
      rows = getTable(tx, parsed.from).rows.map(function (row) { return deepClone(row); });
    } else {
      rows = [{}];
    }

    if (parsed.where) {
      const predicate = compileExpression(parsed.where);
      rows = rows.filter(function (row) {
        return Boolean(predicate(row, paramState));
      });
    }

    if (parsed.orderBy.length > 0) {
      rows.sort(function (left, right) {
        for (let i = 0; i < parsed.orderBy.length; i += 1) {
          const term = parsed.orderBy[i];
          const evaluate = compileExpression(term.expression);
          const a = evaluate(left, paramState);
          const b = evaluate(right, paramState);
          if (a === b) continue;
          const cmp = a < b ? -1 : 1;
          return term.direction === 'DESC' ? -cmp : cmp;
        }
        return 0;
      });
    }

    const offset = parsed.offset ? Number(compileExpression(parsed.offset)({}, paramState)) : 0;
    const limit = parsed.limit ? Number(compileExpression(parsed.limit)({}, paramState)) : null;

    if (offset) rows = rows.slice(offset);
    if (limit != null && !Number.isNaN(limit)) rows = rows.slice(0, limit);
    return rows;
  }

  function projectSelectRows(parsed, rows, paramState) {
    const hasAggregate = parsed.columns.some(function (column) { return column.kind === 'count'; });
    if (hasAggregate) {
      const row = {};
      const columns = [];
      for (let i = 0; i < parsed.columns.length; i += 1) {
        const projection = parsed.columns[i];
        if (projection.kind === 'count') {
          row[projection.alias] = rows.length;
          columns.push({ name: projection.alias });
        }
      }
      return {
        columns: columns,
        rows: [row]
      };
    }

    const outputRows = [];
    let columns = null;
    for (let i = 0; i < rows.length; i += 1) {
      const projected = {};
      const orderedColumns = [];
      for (let p = 0; p < parsed.columns.length; p += 1) {
        const projection = parsed.columns[p];
        if (projection.kind === 'star') {
          const names = Object.keys(rows[i]);
          for (let n = 0; n < names.length; n += 1) {
            projected[names[n]] = rows[i][names[n]];
            orderedColumns.push(names[n]);
          }
        } else {
          const value = compileExpression(projection.expression)(rows[i], paramState);
          projected[projection.alias] = value;
          orderedColumns.push(projection.alias);
        }
      }
      if (!columns) {
        columns = orderedColumns.map(function (name) { return { name: name }; });
      }
      outputRows.push(projected);
    }

    return {
      columns: columns || [],
      rows: outputRows
    };
  }

  function projectReturningRows(returning, rows, params, statementType, insertId) {
    const parsed = {
      columns: splitTopLevel(returning, ',').map(parseProjection)
    };
    const projected = projectSelectRows(parsed, rows, { values: params, index: 0 });
    return new MaiaResult({
      statementType: statementType,
      columns: projected.columns,
      rows: projected.rows,
      rowsAffected: rows.length,
      insertId: insertId
    });
  }

  function inferAliasFromExpression(expression) {
    const trimmed = expression.trim();
    if (/^[A-Za-z_][\w$]*$/.test(trimmed)) return normalizeIdentifier(trimmed);
    return trimmed;
  }

  function nearestPositive(values, fallback) {
    let best = fallback;
    for (let i = 0; i < values.length; i += 1) {
      const value = values[i];
      if (value >= 0 && value < best) best = value;
    }
    return best;
  }

  function findClauseIndex(upperSql, needle) {
    let depth = 0;
    let inString = false;
    for (let i = 0; i <= upperSql.length - needle.length; i += 1) {
      const ch = upperSql[i];
      const next = upperSql[i + 1];
      if (inString) {
        if (ch === '\'' && next === '\'') {
          i += 1;
          continue;
        }
        if (ch === '\'') inString = false;
        continue;
      }
      if (ch === '\'') {
        inString = true;
        continue;
      }
      if (ch === '(') depth += 1;
      if (ch === ')') depth -= 1;
      if (depth === 0 && upperSql.slice(i, i + needle.length) === needle) return i;
    }
    return -1;
  }

  function literalValue(source) {
    const trimmed = String(source || '').trim();
    if (/^null$/i.test(trimmed)) return null;
    if (/^(true|on|yes)$/i.test(trimmed)) return true;
    if (/^(false|off|no)$/i.test(trimmed)) return false;
    if (/^CURRENT_TIMESTAMP$/i.test(trimmed)) return new Date().toISOString();
    if (/^CURRENT_DATE$/i.test(trimmed)) return new Date().toISOString().slice(0, 10);
    if (/^CURRENT_TIME$/i.test(trimmed)) return new Date().toISOString().slice(11, 19);
    if (/^'.*'$/.test(trimmed)) return trimmed.slice(1, -1).replace(/''/g, '\'');
    if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) return Number(trimmed);
    return normalizeIdentifier(trimmed);
  }

  function compileExpression(source) {
    const tokens = tokenizeExpression(source);
    let index = 0;

    function peek(offset) {
      return tokens[index + (offset || 0)] || null;
    }

    function consume(type, value) {
      const token = peek();
      if (!token || token.type !== type || (value && token.valueUpper !== value)) {
        throw new MaiaSQLError(`Unexpected token in expression: ${source}`, 'INVALID_EXPRESSION');
      }
      index += 1;
      return token;
    }

    function match(type, value) {
      const token = peek();
      if (!token || token.type !== type) return false;
      if (value && token.valueUpper !== value) return false;
      index += 1;
      return token;
    }

    function parsePrimary() {
      const token = peek();
      if (!token) {
        throw new MaiaSQLError(`Unexpected end of expression: ${source}`, 'INVALID_EXPRESSION');
      }

      if (match('LPAREN')) {
        const expr = parseOr();
        consume('RPAREN');
        return expr;
      }

      if (match('PARAM')) {
        return function (_row, paramState) {
          return paramState.values[paramState.index++];
        };
      }

      if (match('NUMBER')) {
        const value = Number(token.value);
        return function () { return value; };
      }

      if (match('STRING')) {
        const value = token.value.slice(1, -1).replace(/''/g, '\'');
        return function () { return value; };
      }

      if (match('KEYWORD', 'NULL')) return function () { return null; };
      if (match('KEYWORD', 'TRUE')) return function () { return true; };
      if (match('KEYWORD', 'FALSE')) return function () { return false; };
      if (match('KEYWORD', 'CURRENT_TIMESTAMP')) return function () { return new Date().toISOString(); };
      if (match('KEYWORD', 'CURRENT_DATE')) return function () { return new Date().toISOString().slice(0, 10); };
      if (match('KEYWORD', 'CURRENT_TIME')) return function () { return new Date().toISOString().slice(11, 19); };

      if (match('IDENTIFIER')) {
        const name = normalizeIdentifier(token.value);
        return function (row) { return row[name]; };
      }

      throw new MaiaSQLError(`Invalid expression: ${source}`, 'INVALID_EXPRESSION');
    }

    function parseUnary() {
      if (match('OPERATOR', '+')) {
        const expr = parseUnary();
        return function (row, params) { return +expr(row, params); };
      }
      if (match('OPERATOR', '-')) {
        const expr = parseUnary();
        return function (row, params) { return -expr(row, params); };
      }
      if (match('KEYWORD', 'NOT')) {
        const expr = parseUnary();
        return function (row, params) { return !expr(row, params); };
      }
      return parsePrimary();
    }

    function parseMultiplicative() {
      let left = parseUnary();
      while (true) {
        const operator = match('OPERATOR', '*') || match('OPERATOR', '/') || match('OPERATOR', '%');
        if (!operator) break;
        const right = parseUnary();
        left = makeBinaryEvaluator(left, right, operator.value);
      }
      return left;
    }

    function parseAdditive() {
      let left = parseMultiplicative();
      while (true) {
        const operator = match('OPERATOR', '+') || match('OPERATOR', '-');
        if (!operator) break;
        const right = parseMultiplicative();
        left = makeBinaryEvaluator(left, right, operator.value);
      }
      return left;
    }

    function parseComparison() {
      let left = parseAdditive();

      if (match('KEYWORD', 'IS')) {
        const not = Boolean(match('KEYWORD', 'NOT'));
        if (match('KEYWORD', 'NULL')) {
          return function (row, params) {
            const value = left(row, params);
            return not ? value != null : value == null;
          };
        }
      }

      if (match('KEYWORD', 'BETWEEN')) {
        const lower = parseAdditive();
        consume('KEYWORD', 'AND');
        const upper = parseAdditive();
        return function (row, params) {
          const value = left(row, params);
          return value >= lower(row, params) && value <= upper(row, params);
        };
      }

      if (match('KEYWORD', 'IN')) {
        consume('LPAREN');
        const candidates = [];
        while (!match('RPAREN')) {
          candidates.push(parseOr());
          match('COMMA');
        }
        return function (row, params) {
          const value = left(row, params);
          for (let i = 0; i < candidates.length; i += 1) {
            if (value === candidates[i](row, params)) return true;
          }
          return false;
        };
      }

      if (match('KEYWORD', 'LIKE')) {
        const right = parseAdditive();
        return function (row, params) {
          const value = left(row, params);
          return likeCompare(value, right(row, params));
        };
      }

      const operator = match('OPERATOR', '=') || match('OPERATOR', '==') || match('OPERATOR', '!=')
        || match('OPERATOR', '<>') || match('OPERATOR', '<') || match('OPERATOR', '<=')
        || match('OPERATOR', '>') || match('OPERATOR', '>=');
      if (operator) {
        const right = parseAdditive();
        return makeBinaryEvaluator(left, right, operator.value);
      }

      return left;
    }

    function parseAnd() {
      let left = parseComparison();
      while (match('KEYWORD', 'AND')) {
        const right = parseComparison();
        const previous = left;
        left = function (row, params) {
          return Boolean(previous(row, params) && right(row, params));
        };
      }
      return left;
    }

    function parseOr() {
      let left = parseAnd();
      while (match('KEYWORD', 'OR')) {
        const right = parseAnd();
        const previous = left;
        left = function (row, params) {
          return Boolean(previous(row, params) || right(row, params));
        };
      }
      return left;
    }

    const expression = parseOr();
    return expression;
  }

  function makeBinaryEvaluator(left, right, operator) {
    return function (row, params) {
      const a = left(row, params);
      const b = right(row, params);
      switch (operator) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': return a / b;
        case '%': return a % b;
        case '=':
        case '==': return a === b;
        case '!=':
        case '<>': return a !== b;
        case '<': return a < b;
        case '<=': return a <= b;
        case '>': return a > b;
        case '>=': return a >= b;
        default:
          throw new MaiaSQLError(`Unsupported operator: ${operator}`, 'UNSUPPORTED_OPERATOR');
      }
    };
  }

  function likeCompare(value, pattern) {
    const escaped = String(pattern)
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/%/g, '.*')
      .replace(/_/g, '.');
    return new RegExp(`^${escaped}$`, 'i').test(String(value));
  }

  function tokenizeExpression(source) {
    const tokens = [];
    let index = 0;
    while (index < source.length) {
      const fragment = source.slice(index);
      const whitespace = fragment.match(/^\s+/);
      if (whitespace) {
        index += whitespace[0].length;
        continue;
      }

      const stringMatch = fragment.match(/^'(?:''|[^'])*'/);
      if (stringMatch) {
        tokens.push({ type: 'STRING', value: stringMatch[0], valueUpper: stringMatch[0].toUpperCase() });
        index += stringMatch[0].length;
        continue;
      }

      const numberMatch = fragment.match(/^-?\d+(?:\.\d+)?/);
      if (numberMatch) {
        tokens.push({ type: 'NUMBER', value: numberMatch[0], valueUpper: numberMatch[0] });
        index += numberMatch[0].length;
        continue;
      }

      const identifierMatch = fragment.match(/^(?:[A-Za-z_][\w$]*|"(?:[^"]|"")+"?|\[[^\]]+\]|`[^`]+`)/);
      if (identifierMatch) {
        const value = identifierMatch[0];
        const upper = normalizeIdentifier(value).toUpperCase();
        const type = isExpressionKeyword(upper) ? 'KEYWORD' : 'IDENTIFIER';
        tokens.push({ type: type, value: value, valueUpper: upper });
        index += value.length;
        continue;
      }

      const operatorMatch = fragment.match(/^(<=|>=|<>|!=|==|=|<|>|\+|-|\*|\/|%)/);
      if (operatorMatch) {
        tokens.push({ type: 'OPERATOR', value: operatorMatch[0], valueUpper: operatorMatch[0] });
        index += operatorMatch[0].length;
        continue;
      }

      if (fragment[0] === '?') {
        tokens.push({ type: 'PARAM', value: '?', valueUpper: '?' });
        index += 1;
        continue;
      }
      if (fragment[0] === '(') {
        tokens.push({ type: 'LPAREN', value: '(', valueUpper: '(' });
        index += 1;
        continue;
      }
      if (fragment[0] === ')') {
        tokens.push({ type: 'RPAREN', value: ')', valueUpper: ')' });
        index += 1;
        continue;
      }
      if (fragment[0] === ',') {
        tokens.push({ type: 'COMMA', value: ',', valueUpper: ',' });
        index += 1;
        continue;
      }

      throw new MaiaSQLError(`Could not tokenize expression: ${source}`, 'INVALID_EXPRESSION');
    }
    return tokens;
  }

  function isExpressionKeyword(value) {
    return /^(AND|OR|NOT|NULL|TRUE|FALSE|IS|BETWEEN|IN|LIKE|CURRENT_TIMESTAMP|CURRENT_DATE|CURRENT_TIME)$/.test(value);
  }

  return {
    DIALECT: DIALECT,
    MaiaSQL: MaiaSQL,
    MaiaDatabase: MaiaDatabase,
    MaiaTransaction: MaiaTransaction,
    MaiaResult: MaiaResult,
    MaiaSQLError: MaiaSQLError,
    splitSqlStatements: splitSqlStatements,
    compileExpression: compileExpression
  };
}));

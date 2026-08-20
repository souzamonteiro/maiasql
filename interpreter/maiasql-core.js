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

  class RaiseSignal extends Error {
    constructor(action, message) {
      super(message);
      this.name = 'RaiseSignal';
      this.action = action;
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
    let triggerDepth = 0;

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

      if (current === ';' && triggerDepth === 0) {
        const part = sql.slice(start, index).trim();
        if (part) statements.push(part);
        start = index + 1;
      }

      if (!inString && isKeywordBoundary(sql, index, 'BEGIN') && isInsideCreateTrigger(sql, start, index)) {
        triggerDepth += 1;
        index += 5;
        continue;
      }

      if (!inString && triggerDepth > 0 && isKeywordBoundary(sql, index, 'END')) {
        triggerDepth = Math.max(0, triggerDepth - 1);
        index += 3;
        continue;
      }

      index += 1;
    }

    const tail = sql.slice(start).trim();
    if (tail) statements.push(tail);
    return statements;
  }

  function isInsideCreateTrigger(sql, statementStart, index) {
    const snippet = sql.slice(statementStart, index).toUpperCase();
    return /\bCREATE\s+TRIGGER\b/.test(snippet);
  }

  function isKeywordBoundary(sql, index, keyword) {
    const slice = sql.slice(index, index + keyword.length);
    if (slice.toUpperCase() !== keyword) return false;
    const before = index === 0 ? ' ' : sql[index - 1];
    const after = index + keyword.length >= sql.length ? ' ' : sql[index + keyword.length];
    return !/[A-Za-z0-9_]/.test(before) && !/[A-Za-z0-9_]/.test(after);
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

    if (upper.startsWith('ALTER TABLE')) return executeAlterTable(normalized, tx);
    if (upper.startsWith('CREATE TABLE')) return executeCreateTable(normalized, tx);
    if (upper.startsWith('CREATE INDEX') || upper.startsWith('CREATE UNIQUE INDEX')) return executeCreateIndex(normalized, tx);
    if (upper.startsWith('CREATE VIEW')) return executeCreateView(normalized, tx);
    if (upper.startsWith('CREATE TRIGGER')) return executeCreateTrigger(normalized, tx);
    if (upper.startsWith('DROP TABLE')) return executeDropTable(normalized, tx);
    if (upper.startsWith('DROP VIEW')) return executeDropView(normalized, tx);
    if (upper.startsWith('DROP INDEX')) return executeDropIndex(normalized, tx);
    if (upper.startsWith('DROP TRIGGER')) return executeDropTrigger(normalized, tx);
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
      uniqueKeys: [],
      foreignKeys: [],
      autoIncrement: 1,
      rows: []
    };

    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i].trim();
      if (!part) continue;
      if (/^(CONSTRAINT|PRIMARY|UNIQUE|CHECK|FOREIGN)\b/i.test(part)) {
        const tableConstraint = parseTableConstraint(part);
        if (tableConstraint && tableConstraint.kind === 'unique') {
          table.uniqueKeys.push(tableConstraint.columns);
        }
        if (tableConstraint && tableConstraint.kind === 'foreignKey') {
          table.foreignKeys.push(tableConstraint);
        }
        continue;
      }
      const column = parseColumnDefinition(part);
      table.columns.push(column);
      if (column.primaryKey) table.primaryKey = column.name;
      if (column.unique) table.uniqueKeys.push([column.name]);
      if (column.references) {
        table.foreignKeys.push({
          kind: 'foreignKey',
          columns: [column.name],
          referencesTable: column.references.table,
          referencesColumns: [column.references.column || 'id'],
          onDelete: column.references.onDelete || 'NO ACTION',
          onUpdate: column.references.onUpdate || 'NO ACTION'
        });
      }
    }

    if (!table.columns.length) {
      throw new MaiaSQLError(`Table ${tableName} must define at least one column`, 'EMPTY_TABLE');
    }

    tx.state.catalog.tables[tableName] = table;
    return new MaiaResult({ statementType: 'CREATE_TABLE' });
  }

  function executeAlterTable(sql, tx) {
    ensureWritable(tx);
    const renameTable = sql.match(/^ALTER\s+TABLE\s+([A-Za-z_][\w$"]*)\s+RENAME\s+TO\s+([A-Za-z_][\w$"]*)$/i);
    if (renameTable) {
      const oldName = normalizeIdentifier(renameTable[1]);
      const newName = normalizeIdentifier(renameTable[2]);
      const table = getTable(tx, oldName);
      delete tx.state.catalog.tables[oldName];
      table.name = newName;
      tx.state.catalog.tables[newName] = table;
      rewriteCatalogReferences(tx.state.catalog, oldName, newName);
      return new MaiaResult({ statementType: 'ALTER_TABLE' });
    }

    const renameColumn = sql.match(/^ALTER\s+TABLE\s+([A-Za-z_][\w$"]*)\s+RENAME\s+COLUMN\s+([A-Za-z_][\w$"]*)\s+TO\s+([A-Za-z_][\w$"]*)$/i);
    if (renameColumn) {
      const table = getTable(tx, normalizeIdentifier(renameColumn[1]));
      renameTableColumn(table, normalizeIdentifier(renameColumn[2]), normalizeIdentifier(renameColumn[3]));
      return new MaiaResult({ statementType: 'ALTER_TABLE' });
    }

    const addColumn = sql.match(/^ALTER\s+TABLE\s+([A-Za-z_][\w$"]*)\s+ADD\s+COLUMN\s+([\s\S]+)$/i);
    if (addColumn) {
      const table = getTable(tx, normalizeIdentifier(addColumn[1]));
      const column = parseColumnDefinition(addColumn[2].trim());
      table.columns.push(column);
      if (column.primaryKey) table.primaryKey = column.name;
      if (column.unique) table.uniqueKeys.push([column.name]);
      for (let i = 0; i < table.rows.length; i += 1) {
        table.rows[i][column.name] = column.defaultValue == null ? null : literalValue(column.defaultValue);
      }
      return new MaiaResult({ statementType: 'ALTER_TABLE' });
    }

    throw new MaiaSQLError(`Unsupported ALTER TABLE statement: ${sql}`, 'INVALID_ALTER_TABLE');
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
    return new MaiaResult({ statementType: 'CREATE_VIEW' });
  }

  function executeDropTable(sql, tx) {
    ensureWritable(tx);
    const match = sql.match(/^DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?([A-Za-z_][\w$"]*)$/i);
    if (!match) throw new MaiaSQLError(`Could not parse DROP TABLE statement: ${sql}`, 'INVALID_DROP_TABLE');
    const name = normalizeIdentifier(match[1]);
    delete tx.state.catalog.tables[name];
    removeDependentCatalogObjects(tx.state.catalog, name);
    return new MaiaResult({ statementType: 'DROP_TABLE' });
  }

  function executeDropView(sql, tx) {
    ensureWritable(tx);
    const match = sql.match(/^DROP\s+VIEW\s+(?:IF\s+EXISTS\s+)?([A-Za-z_][\w$"]*)$/i);
    if (!match) throw new MaiaSQLError(`Could not parse DROP VIEW statement: ${sql}`, 'INVALID_DROP_VIEW');
    delete tx.state.catalog.views[normalizeIdentifier(match[1])];
    return new MaiaResult({ statementType: 'DROP_VIEW' });
  }

  function executeDropIndex(sql, tx) {
    ensureWritable(tx);
    const match = sql.match(/^DROP\s+INDEX\s+(?:IF\s+EXISTS\s+)?([A-Za-z_][\w$"]*)$/i);
    if (!match) throw new MaiaSQLError(`Could not parse DROP INDEX statement: ${sql}`, 'INVALID_DROP_INDEX');
    delete tx.state.catalog.indexes[normalizeIdentifier(match[1])];
    return new MaiaResult({ statementType: 'DROP_INDEX' });
  }

  function executeDropTrigger(sql, tx) {
    ensureWritable(tx);
    const match = sql.match(/^DROP\s+TRIGGER\s+(?:IF\s+EXISTS\s+)?([A-Za-z_][\w$"]*)$/i);
    if (!match) throw new MaiaSQLError(`Could not parse DROP TRIGGER statement: ${sql}`, 'INVALID_DROP_TRIGGER');
    delete tx.state.catalog.triggers[normalizeIdentifier(match[1])];
    return new MaiaResult({ statementType: 'DROP_TRIGGER' });
  }

  function executeCreateTrigger(sql, tx) {
    ensureWritable(tx);
    const trigger = parseTriggerDefinition(sql);
    tx.state.catalog.triggers[trigger.name] = trigger;
    return new MaiaResult({ statementType: 'CREATE_TRIGGER' });
  }

  function executeInsert(sql, tx, params) {
    ensureWritable(tx);
    const parsed = parseInsertStatement(sql);
    const table = getTable(tx, normalizeQualifiedName(parsed.target).name);
    const columns = parsed.columns
      ? splitTopLevel(parsed.columns, ',').map(function (item) { return normalizeIdentifier(item.trim()); })
      : table.columns.map(function (column) { return column.name; });
    const paramState = { values: params, index: 0 };
    const insertedRows = [];
    let lastInsertId = null;
    const sourceRows = parsed.valuesTuples
      ? parsed.valuesTuples.map(function (tuple) {
          return splitTopLevel(tuple, ',').map(function (item) { return item.trim(); });
        })
      : materializeInsertSelectRows(parsed.selectSql, tx, params, columns.length);

    for (let i = 0; i < sourceRows.length; i += 1) {
      const row = buildDefaultRow(table);
      const values = sourceRows[i];
      if (values.length !== columns.length) {
        throw new MaiaSQLError(`INSERT column/value count mismatch on ${table.name}`, 'INSERT_ARITY');
      }

      for (let valueIndex = 0; valueIndex < values.length; valueIndex += 1) {
        const columnName = columns[valueIndex];
        if (parsed.valuesTuples) {
          const expression = compileExpression(values[valueIndex], tx);
          row[columnName] = expression(row, paramState);
        } else {
          row[columnName] = values[valueIndex];
        }
      }

      try {
        if (parsed.orReplace) {
          removeConflictingRowsForReplace(table, row);
        }
        applyInsertDefaultsAndConstraints(table, row, tx.state.meta, tx);
        fireTriggers(tx, table.name, 'INSERT', 'BEFORE', null, row);
        table.rows.push(row);
        fireTriggers(tx, table.name, 'INSERT', 'AFTER', null, row);
        insertedRows.push(deepClone(row));
        if (table.primaryKey && row[table.primaryKey] != null) {
          lastInsertId = row[table.primaryKey];
        }
      } catch (error) {
        if (parsed.onConflictDoNothing && isConstraintError(error)) {
          continue;
        }
        if (parsed.orIgnore && isConstraintError(error)) {
          continue;
        }
        throw error;
      }
    }

    if (parsed.returning) {
      return projectReturningRows(parsed.returning, insertedRows, params, 'INSERT', lastInsertId);
    }

    return new MaiaResult({
      statementType: 'INSERT',
      rowsAffected: insertedRows.length,
      insertId: lastInsertId
    });
  }

  function executeSelect(sql, tx, params, outerContextRow) {
    const compound = parseCompoundSelect(sql);
    if (compound) {
      return executeCompoundSelect(compound, tx, params, outerContextRow);
    }
    const parsed = parseSelectStatement(sql);
    const paramState = { values: params, index: 0 };
    const rows = materializeSourceRows(parsed, tx, paramState, outerContextRow);
    const result = projectSelectRows(parsed, rows, paramState, tx);
    return new MaiaResult({
      statementType: 'SELECT',
      columns: result.columns,
      rows: result.rows,
      rowsAffected: 0
    });
  }

  function executeCompoundSelect(compound, tx, params, outerContextRow) {
    let result = executeSelect(compound.parts[0].sql, tx, params, outerContextRow);
    const baseColumnNames = result.columns.map(function (column) { return column.name; });
    for (let i = 1; i < compound.parts.length; i += 1) {
      const rightRaw = executeSelect(compound.parts[i].sql, tx, params, outerContextRow);
      const right = {
        columns: result.columns,
        rows: rightRaw.rows.map(function (row) { return normalizeRowShape(row, baseColumnNames); })
      };
      const operator = compound.parts[i].operator;
      if (operator === 'UNION') {
        result = new MaiaResult({
          statementType: 'SELECT',
          columns: result.columns,
          rows: dedupeResultRows(result.rows.concat(right.rows)),
          rowsAffected: 0
        });
      } else if (operator === 'UNION ALL') {
        result = new MaiaResult({
          statementType: 'SELECT',
          columns: result.columns,
          rows: result.rows.concat(right.rows),
          rowsAffected: 0
        });
      } else if (operator === 'INTERSECT') {
        const rightKeys = new Set(right.rows.map(function (row) { return JSON.stringify(row); }));
        result = new MaiaResult({
          statementType: 'SELECT',
          columns: result.columns,
          rows: dedupeResultRows(result.rows.filter(function (row) { return rightKeys.has(JSON.stringify(row)); })),
          rowsAffected: 0
        });
      } else if (operator === 'EXCEPT') {
        const rightKeys = new Set(right.rows.map(function (row) { return JSON.stringify(row); }));
        result = new MaiaResult({
          statementType: 'SELECT',
          columns: result.columns,
          rows: result.rows.filter(function (row) { return !rightKeys.has(JSON.stringify(row)); }),
          rowsAffected: 0
        });
      }
    }
    if (compound.orderBy && compound.orderBy.length > 0) {
      result.rows = sortResultRows(result.rows, compound.orderBy, tx);
    }
    if (compound.offset) {
      result.rows = result.rows.slice(compound.offset);
    }
    if (compound.limit != null) {
      result.rows = result.rows.slice(0, compound.limit);
    }
    return result;
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
      fireTriggers(tx, table.name, 'UPDATE', 'BEFORE', row, nextRow);
      enforceRowConstraints(table, nextRow);
      table.rows[i] = nextRow;
      applyReferentialActionsOnParentUpdate(tx, table.name, row, nextRow);
      fireTriggers(tx, table.name, 'UPDATE', 'AFTER', row, nextRow);
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
        fireTriggers(tx, table.name, 'DELETE', 'BEFORE', row, null);
        applyReferentialActionsOnParentDelete(tx, table.name, row);
        removed.push(deepClone(row));
        fireTriggers(tx, table.name, 'DELETE', 'AFTER', row, null);
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

    if (!rawValue && key === 'index_list') {
      throw new MaiaSQLError('PRAGMA index_list requires a table name', 'INVALID_PRAGMA');
    }
    if (!rawValue && key === 'index_info') {
      throw new MaiaSQLError('PRAGMA index_info requires an index name', 'INVALID_PRAGMA');
    }
    if (!rawValue && key === 'table_info') {
      throw new MaiaSQLError('PRAGMA table_info requires a table name', 'INVALID_PRAGMA');
    }
    if (!rawValue && key === 'foreign_key_list') {
      throw new MaiaSQLError('PRAGMA foreign_key_list requires a table name', 'INVALID_PRAGMA');
    }

    if (rawValue && key === 'table_info') {
      return buildPragmaTableInfoResult(tx, rawValue);
    }
    if (rawValue && key === 'index_list') {
      return buildPragmaIndexListResult(tx, rawValue);
    }
    if (rawValue && key === 'index_info') {
      return buildPragmaIndexInfoResult(tx, rawValue);
    }
    if (rawValue && key === 'foreign_key_list') {
      return buildPragmaForeignKeyListResult(tx, rawValue);
    }

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

  function buildPragmaTableInfoResult(tx, rawValue) {
    const table = getTable(tx, normalizeIdentifier(stripQuotedLiteral(rawValue)));
    const rows = table.columns.map(function (column, index) {
      return {
        cid: index,
        name: column.name,
        type: column.type,
        notnull: column.notNull ? 1 : 0,
        dflt_value: column.defaultValue,
        pk: column.primaryKey ? 1 : 0
      };
    });
    return new MaiaResult({
      statementType: 'PRAGMA',
      columns: [
        { name: 'cid' },
        { name: 'name' },
        { name: 'type' },
        { name: 'notnull' },
        { name: 'dflt_value' },
        { name: 'pk' }
      ],
      rows: rows
    });
  }

  function buildPragmaIndexListResult(tx, rawValue) {
    const tableName = normalizeIdentifier(stripQuotedLiteral(rawValue));
    getTable(tx, tableName);
    const rows = Object.keys(tx.state.catalog.indexes)
      .map(function (name) { return tx.state.catalog.indexes[name]; })
      .filter(function (index) { return index.table === tableName; })
      .map(function (index, seq) {
        return {
          seq: seq,
          name: index.name,
          unique: index.unique ? 1 : 0,
          origin: 'c',
          partial: index.where ? 1 : 0
        };
      });
    return new MaiaResult({
      statementType: 'PRAGMA',
      columns: [
        { name: 'seq' },
        { name: 'name' },
        { name: 'unique' },
        { name: 'origin' },
        { name: 'partial' }
      ],
      rows: rows
    });
  }

  function buildPragmaIndexInfoResult(tx, rawValue) {
    const indexName = normalizeIdentifier(stripQuotedLiteral(rawValue));
    const index = tx.state.catalog.indexes[indexName];
    if (!index) throw new MaiaSQLError(`Index not found: ${indexName}`, 'UNKNOWN_INDEX');
    const rows = index.columns.map(function (columnName, seqno) {
      return {
        seqno: seqno,
        cid: findTableColumnIndex(getTable(tx, index.table), columnName),
        name: columnName
      };
    });
    return new MaiaResult({
      statementType: 'PRAGMA',
      columns: [
        { name: 'seqno' },
        { name: 'cid' },
        { name: 'name' }
      ],
      rows: rows
    });
  }

  function buildPragmaForeignKeyListResult(tx, rawValue) {
    const table = getTable(tx, normalizeIdentifier(stripQuotedLiteral(rawValue)));
    const rows = [];
    for (let i = 0; i < table.foreignKeys.length; i += 1) {
      const foreignKey = table.foreignKeys[i];
      for (let j = 0; j < foreignKey.columns.length; j += 1) {
        rows.push({
          id: i,
          seq: j,
          table: foreignKey.referencesTable,
          from: foreignKey.columns[j],
          to: foreignKey.referencesColumns[j] || null,
          on_update: foreignKey.onUpdate || 'NO ACTION',
          on_delete: foreignKey.onDelete || 'NO ACTION',
          match: 'NONE'
        });
      }
    }
    return new MaiaResult({
      statementType: 'PRAGMA',
      columns: [
        { name: 'id' },
        { name: 'seq' },
        { name: 'table' },
        { name: 'from' },
        { name: 'to' },
        { name: 'on_update' },
        { name: 'on_delete' },
        { name: 'match' }
      ],
      rows: rows
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

  function findTableColumnIndex(table, columnName) {
    for (let i = 0; i < table.columns.length; i += 1) {
      if (table.columns[i].name === columnName) return i;
    }
    return -1;
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
      unique: /\bUNIQUE\b/i.test(upper),
      check: extractCheckExpression(part),
      references: extractReferences(part),
      defaultValue: defaultValue
    };
  }

  function parseTableConstraint(part) {
    const uniqueMatch = part.match(/^(?:CONSTRAINT\s+[A-Za-z_][\w$"]*\s+)?UNIQUE\s*\(([\s\S]+)\)$/i);
    if (uniqueMatch) {
      return {
        kind: 'unique',
        columns: splitTopLevel(uniqueMatch[1], ',').map(function (name) {
          return normalizeIdentifier(name.trim());
        })
      };
    }
    const foreignKeyMatch = part.match(/^(?:CONSTRAINT\s+[A-Za-z_][\w$"]*\s+)?FOREIGN\s+KEY\s*\(([\s\S]+?)\)\s+REFERENCES\s+([A-Za-z_][\w$"]*)(?:\s*\(([\s\S]+?)\))?$/i);
    if (foreignKeyMatch) {
      return {
        kind: 'foreignKey',
        columns: splitTopLevel(foreignKeyMatch[1], ',').map(function (name) { return normalizeIdentifier(name.trim()); }),
        referencesTable: normalizeIdentifier(foreignKeyMatch[2]),
        referencesColumns: foreignKeyMatch[3]
          ? splitTopLevel(foreignKeyMatch[3], ',').map(function (name) { return normalizeIdentifier(name.trim()); })
          : ['id'],
        onDelete: extractReferenceAction(part, 'DELETE'),
        onUpdate: extractReferenceAction(part, 'UPDATE')
      };
    }
    return null;
  }

  function extractReferences(part) {
    const match = part.match(/\bREFERENCES\s+([A-Za-z_][\w$"]*)(?:\s*\(([\s\S]+?)\))?/i);
    if (!match) return null;
    return {
      table: normalizeIdentifier(match[1]),
      column: match[2] ? normalizeIdentifier(match[2].trim()) : 'id',
      onDelete: extractReferenceAction(part, 'DELETE'),
      onUpdate: extractReferenceAction(part, 'UPDATE')
    };
  }

  function extractReferenceAction(part, kind) {
    const match = new RegExp(`\\bON\\s+${kind}\\s+(CASCADE|SET\\s+NULL|RESTRICT|NO\\s+ACTION)\\b`, 'i').exec(part);
    return match ? match[1].replace(/\s+/g, ' ').toUpperCase() : 'NO ACTION';
  }

  function renameTableColumn(table, oldName, newName) {
    const column = table.columns.find(function (item) { return item.name === oldName; });
    if (!column) throw new MaiaSQLError(`Column not found: ${oldName}`, 'UNKNOWN_COLUMN');
    column.name = newName;
    if (table.primaryKey === oldName) table.primaryKey = newName;
    for (let i = 0; i < table.uniqueKeys.length; i += 1) {
      table.uniqueKeys[i] = table.uniqueKeys[i].map(function (name) {
        return name === oldName ? newName : name;
      });
    }
    if (table.foreignKeys) {
      for (let f = 0; f < table.foreignKeys.length; f += 1) {
        table.foreignKeys[f].columns = table.foreignKeys[f].columns.map(function (name) {
          return name === oldName ? newName : name;
        });
        table.foreignKeys[f].referencesColumns = table.foreignKeys[f].referencesColumns.map(function (name) {
          return name === oldName ? newName : name;
        });
      }
    }
    for (let r = 0; r < table.rows.length; r += 1) {
      table.rows[r][newName] = table.rows[r][oldName];
      delete table.rows[r][oldName];
    }
  }

  function rewriteCatalogReferences(catalog, oldName, newName) {
    const indexNames = Object.keys(catalog.indexes);
    for (let i = 0; i < indexNames.length; i += 1) {
      if (catalog.indexes[indexNames[i]].table === oldName) {
        catalog.indexes[indexNames[i]].table = newName;
      }
    }

    const viewNames = Object.keys(catalog.views);
    for (let v = 0; v < viewNames.length; v += 1) {
      const view = catalog.views[viewNames[v]];
      view.sql = replaceIdentifierReference(view.sql, oldName, newName);
    }

    const triggerNames = Object.keys(catalog.triggers);
    for (let t = 0; t < triggerNames.length; t += 1) {
      const trigger = catalog.triggers[triggerNames[t]];
      if (trigger.table === oldName) trigger.table = newName;
      trigger.when = trigger.when ? replaceIdentifierReference(trigger.when, oldName, newName) : trigger.when;
      trigger.statements = trigger.statements.map(function (statement) {
        return replaceIdentifierReference(statement, oldName, newName);
      });
    }

    const tableNames = Object.keys(catalog.tables);
    for (let t = 0; t < tableNames.length; t += 1) {
      const table = catalog.tables[tableNames[t]];
      if (!table.foreignKeys) continue;
      for (let f = 0; f < table.foreignKeys.length; f += 1) {
        if (table.foreignKeys[f].referencesTable === oldName) {
          table.foreignKeys[f].referencesTable = newName;
        }
      }
    }
  }

  function removeDependentCatalogObjects(catalog, tableName) {
    const indexNames = Object.keys(catalog.indexes);
    for (let i = 0; i < indexNames.length; i += 1) {
      if (catalog.indexes[indexNames[i]].table === tableName) {
        delete catalog.indexes[indexNames[i]];
      }
    }
    const triggerNames = Object.keys(catalog.triggers);
    for (let t = 0; t < triggerNames.length; t += 1) {
      if (catalog.triggers[triggerNames[t]].table === tableName) {
        delete catalog.triggers[triggerNames[t]];
      }
    }
  }

  function replaceIdentifierReference(sql, oldName, newName) {
    return String(sql).replace(new RegExp(`\\b${escapeRegExp(oldName)}\\b`, 'g'), newName);
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

  function stripQuotedLiteral(value) {
    const text = String(value || '').trim();
    if ((text[0] === '\'' && text[text.length - 1] === '\'')
      || (text[0] === '"' && text[text.length - 1] === '"')) {
      return text.slice(1, -1).replace(/''/g, '\'').replace(/""/g, '"');
    }
    return text;
  }

  function buildDefaultRow(table) {
    const row = {};
    for (let i = 0; i < table.columns.length; i += 1) {
      const column = table.columns[i];
      row[column.name] = column.defaultValue == null ? null : literalValue(column.defaultValue);
    }
    return row;
  }

  function applyInsertDefaultsAndConstraints(table, row, meta, tx) {
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
      if (column.check) {
        const passed = compileExpression(column.check, tx)(row, createParamState([]));
        if (!passed) {
          throw new MaiaSQLError(`CHECK constraint failed: ${table.name}.${column.name}`, 'CHECK');
        }
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

    enforceUniqueConstraints(table, row, null);
    enforceForeignKeys(table, row, tx);
  }

  function enforceRowConstraints(table, row, previousRow, tx) {
    for (let i = 0; i < table.columns.length; i += 1) {
      const column = table.columns[i];
      if (column.notNull && row[column.name] == null) {
        throw new MaiaSQLError(`Column ${column.name} cannot be NULL`, 'NOT_NULL');
      }
      if (column.check) {
        const passed = compileExpression(column.check, tx)(row, createParamState([]));
        if (!passed) {
          throw new MaiaSQLError(`CHECK constraint failed: ${table.name}.${column.name}`, 'CHECK');
        }
      }
    }
    enforceUniqueConstraints(table, row, previousRow);
    enforceForeignKeys(table, row, tx);
  }

  function enforceUniqueConstraints(table, row, previousRow) {
    for (let i = 0; i < table.uniqueKeys.length; i += 1) {
      const columns = table.uniqueKeys[i];
      const conflict = table.rows.some(function (existing) {
        if (previousRow && existing === previousRow) return false;
        for (let c = 0; c < columns.length; c += 1) {
          if (existing[columns[c]] !== row[columns[c]]) return false;
        }
        return true;
      });
      if (conflict) {
        throw new MaiaSQLError(`UNIQUE constraint failed: ${table.name}.${columns.join(',')}`, 'UNIQUE');
      }
    }
  }

  function enforceForeignKeys(table, row, tx) {
    const foreignKeys = table.foreignKeys || [];
    for (let i = 0; i < foreignKeys.length; i += 1) {
      const fk = foreignKeys[i];
      const localValues = fk.columns.map(function (column) { return row[column]; });
      if (localValues.some(function (value) { return value == null; })) continue;
      const referencedTable = getTable(tx, fk.referencesTable);
      const exists = referencedTable.rows.some(function (candidate) {
        for (let c = 0; c < fk.referencesColumns.length; c += 1) {
          if (candidate[fk.referencesColumns[c]] !== localValues[c]) return false;
        }
        return true;
      });
      if (!exists) {
        throw new MaiaSQLError(
          `FOREIGN KEY constraint failed: ${table.name}.${fk.columns.join(',')}`,
          'FOREIGN_KEY'
        );
      }
    }
  }

  function applyReferentialActionsOnParentDelete(tx, parentTableName, parentRow) {
    const tableNames = Object.keys(tx.state.catalog.tables);
    for (let i = 0; i < tableNames.length; i += 1) {
      const childTable = tx.state.catalog.tables[tableNames[i]];
      const foreignKeys = childTable.foreignKeys || [];
      for (let f = 0; f < foreignKeys.length; f += 1) {
        const fk = foreignKeys[f];
        if (fk.referencesTable !== parentTableName) continue;
        applyForeignKeyActionToChildren(tx, childTable, fk, parentRow, null, fk.onDelete || 'NO ACTION');
      }
    }
  }

  function applyReferentialActionsOnParentUpdate(tx, parentTableName, oldRow, newRow) {
    const tableNames = Object.keys(tx.state.catalog.tables);
    for (let i = 0; i < tableNames.length; i += 1) {
      const childTable = tx.state.catalog.tables[tableNames[i]];
      const foreignKeys = childTable.foreignKeys || [];
      for (let f = 0; f < foreignKeys.length; f += 1) {
        const fk = foreignKeys[f];
        if (fk.referencesTable !== parentTableName) continue;
        const changed = fk.referencesColumns.some(function (column) {
          return oldRow[column] !== newRow[column];
        });
        if (!changed) continue;
        applyForeignKeyActionToChildren(tx, childTable, fk, oldRow, newRow, fk.onUpdate || 'NO ACTION');
      }
    }
  }

  function applyForeignKeyActionToChildren(tx, childTable, fk, oldParentRow, newParentRow, action) {
    const matches = [];
    for (let i = 0; i < childTable.rows.length; i += 1) {
      const childRow = childTable.rows[i];
      let match = true;
      for (let c = 0; c < fk.columns.length; c += 1) {
        if (childRow[fk.columns[c]] !== oldParentRow[fk.referencesColumns[c]]) {
          match = false;
          break;
        }
      }
      if (match) matches.push({ index: i, row: childRow });
    }
    if (matches.length === 0) return;

    const normalizedAction = String(action || 'NO ACTION').toUpperCase();
    if (normalizedAction === 'RESTRICT' || normalizedAction === 'NO ACTION') {
      throw new MaiaSQLError(
        `FOREIGN KEY constraint failed: ${childTable.name}.${fk.columns.join(',')}`,
        'FOREIGN_KEY'
      );
    }

    if (normalizedAction === 'SET NULL') {
      for (let i = 0; i < matches.length; i += 1) {
        const nextRow = deepClone(matches[i].row);
        for (let c = 0; c < fk.columns.length; c += 1) {
          nextRow[fk.columns[c]] = null;
        }
        enforceRowConstraints(childTable, nextRow, matches[i].row, tx);
        childTable.rows[matches[i].index] = nextRow;
      }
      return;
    }

    if (normalizedAction === 'CASCADE') {
      if (newParentRow == null) {
        const removal = new Set(matches.map(function (item) { return item.index; }));
        childTable.rows = childTable.rows.filter(function (_row, index) { return !removal.has(index); });
      } else {
        for (let i = 0; i < matches.length; i += 1) {
          const nextRow = deepClone(matches[i].row);
          for (let c = 0; c < fk.columns.length; c += 1) {
            nextRow[fk.columns[c]] = newParentRow[fk.referencesColumns[c]];
          }
          enforceRowConstraints(childTable, nextRow, matches[i].row, tx);
          childTable.rows[matches[i].index] = nextRow;
        }
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
    const canonicalSql = canonicalizeSqlWhitespace(sql);
    const upper = canonicalSql.toUpperCase();
    const distinct = /^SELECT\s+DISTINCT\b/i.test(canonicalSql);
    const selectPrefixLength = distinct ? canonicalSql.match(/^SELECT\s+DISTINCT\s+/i)[0].length : 7;
    const fromIndex = findClauseIndex(upper, ' FROM ');
    const whereIndex = findClauseIndex(upper, ' WHERE ');
    const groupIndex = findClauseIndex(upper, ' GROUP BY ');
    const havingIndex = findClauseIndex(upper, ' HAVING ');
    const orderIndex = findClauseIndex(upper, ' ORDER BY ');
    const limitIndex = findClauseIndex(upper, ' LIMIT ');
    const offsetIndex = findClauseIndex(upper, ' OFFSET ');

    const columnsText = canonicalSql.slice(selectPrefixLength, fromIndex >= 0 ? fromIndex : canonicalSql.length).trim();
    const fromText = fromIndex >= 0
      ? canonicalSql.slice(fromIndex + 6, nearestPositive([whereIndex, groupIndex, havingIndex, orderIndex, limitIndex, offsetIndex], canonicalSql.length)).trim()
      : null;
    const whereText = whereIndex >= 0
      ? canonicalSql.slice(whereIndex + 7, nearestPositive([groupIndex, havingIndex, orderIndex, limitIndex, offsetIndex], canonicalSql.length)).trim()
      : null;
    const groupText = groupIndex >= 0
      ? canonicalSql.slice(groupIndex + 10, nearestPositive([havingIndex, orderIndex, limitIndex, offsetIndex], canonicalSql.length)).trim()
      : null;
    const havingText = havingIndex >= 0
      ? canonicalSql.slice(havingIndex + 8, nearestPositive([orderIndex, limitIndex, offsetIndex], canonicalSql.length)).trim()
      : null;
    const orderText = orderIndex >= 0
      ? canonicalSql.slice(orderIndex + 10, nearestPositive([limitIndex, offsetIndex], canonicalSql.length)).trim()
      : null;
    const limitText = limitIndex >= 0
      ? canonicalSql.slice(limitIndex + 7, nearestPositive([offsetIndex], canonicalSql.length)).trim()
      : null;
    const offsetText = offsetIndex >= 0
      ? canonicalSql.slice(offsetIndex + 8).trim()
      : null;

    return {
      distinct: distinct,
      columns: splitTopLevel(columnsText, ',').map(parseProjection),
      from: fromText ? parseFromClause(fromText) : null,
      where: whereText,
      groupBy: groupText ? splitTopLevel(groupText, ',').map(function (item) { return item.trim(); }) : [],
      having: havingText,
      orderBy: orderText ? splitTopLevel(orderText, ',').map(parseOrderingTerm) : [],
      limit: limitText,
      offset: offsetText
    };
  }

  function parseCompoundSelect(sql) {
    const canonicalSql = canonicalizeSqlWhitespace(sql);
    const suffix = extractCompoundTail(canonicalSql);
    const querySql = suffix.head;
    let depth = 0;
    let inString = false;
    let start = 0;
    const parts = [{ sql: querySql, operator: null }];
    for (let i = 0; i < querySql.length; i += 1) {
      const ch = querySql[i];
      const next = querySql[i + 1];
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
      if (depth !== 0) continue;
      const op = detectCompoundOperator(querySql, i);
      if (!op) continue;
      parts[parts.length - 1].sql = querySql.slice(start, i).trim();
      start = i + op.length;
      parts.push({ operator: op, sql: null });
      i += op.length - 1;
    }
    if (parts.length === 1) return null;
    parts[parts.length - 1].sql = querySql.slice(start).trim();
    return {
      parts: parts,
      orderBy: suffix.orderBy,
      limit: suffix.limit,
      offset: suffix.offset
    };
  }

  function detectCompoundOperator(sql, index) {
    const operators = ['UNION ALL', 'UNION', 'INTERSECT', 'EXCEPT'];
    for (let i = 0; i < operators.length; i += 1) {
      const operator = operators[i];
      const slice = sql.slice(index, index + operator.length);
      if (slice.toUpperCase() !== operator) continue;
      const before = index === 0 ? ' ' : sql[index - 1];
      const after = index + operator.length >= sql.length ? ' ' : sql[index + operator.length];
      if (!/[A-Za-z0-9_]/.test(before) && !/[A-Za-z0-9_]/.test(after)) {
        return operator;
      }
    }
    return null;
  }

  function extractCompoundTail(sql) {
    const upper = sql.toUpperCase();
    const orderIndex = findClauseIndex(upper, ' ORDER BY ');
    const limitIndex = findClauseIndex(upper, ' LIMIT ');
    const offsetIndex = findClauseIndex(upper, ' OFFSET ');
    const tailStart = nearestPositive([orderIndex, limitIndex, offsetIndex], sql.length);
    const head = sql.slice(0, tailStart).trim();
    const orderText = orderIndex >= 0 ? sql.slice(orderIndex + 10, nearestPositive([limitIndex, offsetIndex], sql.length)).trim() : null;
    const limitText = limitIndex >= 0 ? sql.slice(limitIndex + 7, nearestPositive([offsetIndex], sql.length)).trim() : null;
    const offsetText = offsetIndex >= 0 ? sql.slice(offsetIndex + 8).trim() : null;
    return {
      head: head,
      orderBy: orderText ? splitTopLevel(orderText, ',').map(parseOrderingTerm) : [],
      limit: limitText ? Number(limitText) : null,
      offset: offsetText ? Number(offsetText) : 0
    };
  }

  function normalizeRowShape(row, columnNames) {
    const values = Object.keys(row).map(function (key) { return row[key]; });
    const normalized = {};
    for (let i = 0; i < columnNames.length; i += 1) {
      normalized[columnNames[i]] = values[i];
    }
    return normalized;
  }

  function sortResultRows(rows, orderBy, tx) {
    const copy = rows.slice();
    copy.sort(function (left, right) {
      const paramState = createParamState([]);
      for (let i = 0; i < orderBy.length; i += 1) {
        const term = orderBy[i];
        const evaluate = compileExpression(term.expression, tx);
        const a = evaluate(left, paramState);
        const b = evaluate(right, paramState);
        if (a == null || b == null) {
          if (a == null && b == null) continue;
          const nulls = term.nulls || (term.direction === 'DESC' ? 'LAST' : 'FIRST');
          if (a == null) return nulls === 'FIRST' ? -1 : 1;
          if (b == null) return nulls === 'FIRST' ? 1 : -1;
        }
        const leftValue = term.collate === 'nocase' && typeof a === 'string' ? a.toLowerCase() : a;
        const rightValue = term.collate === 'nocase' && typeof b === 'string' ? b.toLowerCase() : b;
        if (leftValue === rightValue) continue;
        const cmp = leftValue < rightValue ? -1 : 1;
        return term.direction === 'DESC' ? -cmp : cmp;
      }
      return 0;
    });
    return copy;
  }

  function canonicalizeSqlWhitespace(sql) {
    let result = '';
    let inString = false;
    let pendingSpace = false;
    for (let i = 0; i < sql.length; i += 1) {
      const ch = sql[i];
      const next = sql[i + 1];
      if (inString) {
        result += ch;
        if (ch === '\'' && next === '\'') {
          result += next;
          i += 1;
          continue;
        }
        if (ch === '\'') inString = false;
        continue;
      }

      if (ch === '\'') {
        if (pendingSpace && result && result[result.length - 1] !== ' ') result += ' ';
        pendingSpace = false;
        inString = true;
        result += ch;
        continue;
      }

      if (/\s/.test(ch)) {
        pendingSpace = true;
        continue;
      }

      if (pendingSpace && result && result[result.length - 1] !== ' ') {
        result += ' ';
      }
      pendingSpace = false;
      result += ch;
    }
    return result.trim();
  }

  function parseProjection(source) {
    const text = source.trim();
    if (text === '*') {
      return { kind: 'star' };
    }
    const qualifiedStarMatch = text.match(/^((?:[A-Za-z_][\w$]*|"(?:[^"]|"")+"?))\.\*$/);
    if (qualifiedStarMatch) {
      return { kind: 'qualifiedStar', qualifier: normalizeIdentifier(qualifiedStarMatch[1]) };
    }
    const countMatch = text.match(/^COUNT\s*\(\s*\*\s*\)(?:\s+AS\s+([A-Za-z_][\w$"]*))?$/i);
    if (countMatch) {
      return { kind: 'count', alias: countMatch[1] ? normalizeIdentifier(countMatch[1]) : 'count(*)' };
    }
    const aggregateMatch = text.match(/^(COUNT|SUM|AVG|MIN|MAX)\s*\(\s*(\*|[\s\S]+?)\s*\)(?:\s+AS\s+([A-Za-z_][\w$"]*))?$/i);
    if (aggregateMatch) {
      const func = aggregateMatch[1].toUpperCase();
      const expr = aggregateMatch[2].trim();
      return {
        kind: 'aggregate',
        aggregate: func,
        expression: expr,
        alias: aggregateMatch[3]
          ? normalizeIdentifier(aggregateMatch[3])
          : `${func.toLowerCase()}(${expr})`
      };
    }
    const aliasMatch = text.match(/^(.*?)(?:\s+AS\s+|\s+)([A-Za-z_][\w$"]*)$/i);
    if (aliasMatch) {
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
    let text = source.trim();
    let nulls = null;
    let direction = 'ASC';
    let collate = null;

    const nullsMatch = text.match(/\s+NULLS\s+(FIRST|LAST)\s*$/i);
    if (nullsMatch) {
      nulls = nullsMatch[1].toUpperCase();
      text = text.slice(0, nullsMatch.index).trim();
    }

    const directionMatch = text.match(/\s+(ASC|DESC)\s*$/i);
    if (directionMatch) {
      direction = directionMatch[1].toUpperCase();
      text = text.slice(0, directionMatch.index).trim();
    }

    const collateMatch = text.match(/\s+COLLATE\s+([A-Za-z_][\w$"]*)\s*$/i);
    if (collateMatch) {
      collate = normalizeIdentifier(collateMatch[1]).toLowerCase();
      text = text.slice(0, collateMatch.index).trim();
    }

    return {
      expression: text,
      direction: direction,
      collate: collate,
      nulls: nulls
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

  function materializeSourceRows(parsed, tx, paramState, outerContextRow) {
    let rows = parsed.from ? materializeFromClause(parsed.from, tx, paramState, outerContextRow) : [createScopedRow({})];

    if (parsed.where) {
      const predicate = compileExpression(parsed.where, tx);
      rows = rows.filter(function (row) {
        return Boolean(predicate(row, paramState));
      });
    }

    if (parsed.orderBy.length > 0) {
      rows.sort(function (left, right) {
        for (let i = 0; i < parsed.orderBy.length; i += 1) {
          const term = parsed.orderBy[i];
          const evaluate = compileExpression(term.expression, tx);
          const a = evaluate(left, paramState);
          const b = evaluate(right, paramState);
          if (a == null || b == null) {
            if (a == null && b == null) continue;
            const nulls = term.nulls || (term.direction === 'DESC' ? 'LAST' : 'FIRST');
            if (a == null) return nulls === 'FIRST' ? -1 : 1;
            if (b == null) return nulls === 'FIRST' ? 1 : -1;
          }
          const leftValue = term.collate === 'nocase' && typeof a === 'string' ? a.toLowerCase() : a;
          const rightValue = term.collate === 'nocase' && typeof b === 'string' ? b.toLowerCase() : b;
          if (leftValue === rightValue) continue;
          const cmp = leftValue < rightValue ? -1 : 1;
          return term.direction === 'DESC' ? -cmp : cmp;
        }
        return 0;
      });
    }

    const offset = parsed.offset ? Number(compileExpression(parsed.offset, tx)(createScopedRow({}), paramState)) : 0;
    const limit = parsed.limit ? Number(compileExpression(parsed.limit, tx)(createScopedRow({}), paramState)) : null;

    if (offset) rows = rows.slice(offset);
    if (limit != null && !Number.isNaN(limit)) rows = rows.slice(0, limit);
    return rows;
  }

  function projectSelectRows(parsed, rows, paramState, tx) {
    const hasAggregate = parsed.columns.some(function (column) {
      return column.kind === 'count' || column.kind === 'aggregate';
    });
    if (hasAggregate || parsed.groupBy.length > 0) {
      return projectAggregateRows(parsed, rows, paramState, tx);
    }

    const outputRows = [];
    let columns = null;
    for (let i = 0; i < rows.length; i += 1) {
      const projected = {};
      const orderedColumns = [];
      for (let p = 0; p < parsed.columns.length; p += 1) {
        const projection = parsed.columns[p];
        if (projection.kind === 'star') {
          const names = rows[i].__visibleColumns || Object.keys(rows[i]).filter(function (name) { return name.indexOf('.') === -1 && name.slice(0, 2) !== '__'; });
          for (let n = 0; n < names.length; n += 1) {
            projected[names[n]] = rows[i][names[n]];
            orderedColumns.push(names[n]);
          }
        } else if (projection.kind === 'qualifiedStar') {
          const names = rows[i].__sources && rows[i].__sources[projection.qualifier]
            ? Object.keys(rows[i].__sources[projection.qualifier])
            : [];
          for (let q = 0; q < names.length; q += 1) {
            projected[names[q]] = rows[i].__sources[projection.qualifier][names[q]];
            orderedColumns.push(names[q]);
          }
        } else {
          const value = compileExpression(projection.expression, tx)(rows[i], paramState);
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
      rows: parsed.distinct ? dedupeResultRows(outputRows) : outputRows
    };
  }

  function projectReturningRows(returning, rows, params, statementType, insertId) {
    const parsed = {
      distinct: false,
      columns: splitTopLevel(returning, ',').map(parseProjection),
      groupBy: [],
      having: null,
      orderBy: []
    };
    const wrappedRows = rows.map(function (row) { return createScopedRow(row); });
    const projected = projectSelectRows(parsed, wrappedRows, { values: params, index: 0 }, null);
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
    if (/^(?:[A-Za-z_][\w$]*)(?:\.(?:[A-Za-z_][\w$]*))*$/.test(trimmed)) {
      const parts = trimmed.split('.');
      return normalizeIdentifier(parts[parts.length - 1]);
    }
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

  function compileExpression(source, tx) {
    const specialExists = detectExistsExpression(source);
    if (specialExists) {
      return function (row, paramState) {
        const rows = executeSelectSubquery(specialExists.subquery, tx, paramState, row);
        return rows.length > 0;
      };
    }
    const specialInSelect = detectInSelectExpression(source);
    if (specialInSelect) {
      const leftEvaluator = compileExpression(specialInSelect.left, tx);
      return function (row, paramState) {
        const leftValue = leftEvaluator(row, paramState);
        const rows = executeSelectSubquery(specialInSelect.subquery, tx, paramState, row);
        for (let i = 0; i < rows.length; i += 1) {
          const keys = Object.keys(rows[i]);
          if (keys.length > 0 && leftValue === rows[i][keys[0]]) return true;
        }
        return false;
      };
    }

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

      if (match('KEYWORD', 'CASE')) {
        return parseCaseExpression();
      }

      if (match('LPAREN')) {
        const expr = parseOr();
        consume('RPAREN');
        return expr;
      }

      if (match('PARAM')) {
        return function (_row, paramState) {
          return nextParameterValue(paramState);
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
        const parts = [normalizeIdentifier(token.value)];
        if (peek() && peek().type === 'LPAREN') {
          const functionName = parts[0].toUpperCase();
          consume('LPAREN');
          const args = [];
          if (!match('RPAREN')) {
            do {
              args.push(parseOr());
            } while (match('COMMA'));
            consume('RPAREN');
          }
          return makeFunctionEvaluator(functionName, args);
        }
        while (match('DOT')) {
          const segment = consume('IDENTIFIER');
          parts.push(normalizeIdentifier(segment.value));
        }
        const name = parts.join('.');
        return function (row) {
          if (Object.prototype.hasOwnProperty.call(row, name)) return row[name];
          return row[parts[parts.length - 1]];
        };
      }

      throw new MaiaSQLError(`Invalid expression: ${source}`, 'INVALID_EXPRESSION');
    }

    function parseCaseExpression() {
      const baseExpression = peek() && !(peek().type === 'KEYWORD' && peek().valueUpper === 'WHEN')
        ? parseOr()
        : null;
      const branches = [];
      while (match('KEYWORD', 'WHEN')) {
        const whenExpression = parseOr();
        consume('KEYWORD', 'THEN');
        const thenExpression = parseOr();
        branches.push({
          when: whenExpression,
          then: thenExpression
        });
      }
      const elseExpression = match('KEYWORD', 'ELSE') ? parseOr() : null;
      consume('KEYWORD', 'END');
      return function (row, params) {
        const baseValue = baseExpression ? baseExpression(row, params) : null;
        for (let i = 0; i < branches.length; i += 1) {
          const branch = branches[i];
          const condition = baseExpression
            ? baseValue === branch.when(row, params)
            : Boolean(branch.when(row, params));
          if (condition) {
            return branch.then(row, params);
          }
        }
        return elseExpression ? elseExpression(row, params) : null;
      };
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
        if (peek() && peek().type === 'KEYWORD' && peek().valueUpper === 'SELECT') {
          const subquerySql = collectParenthesizedSql(tokens, index);
          consumeSubqueryTokens(tokens, function (count) { index += count; });
          consume('RPAREN');
          return function (row, params) {
            const value = left(row, params);
            const rows = executeSelectSubquery(subquerySql, tx, params);
            for (let i = 0; i < rows.length; i += 1) {
              const candidate = rows[i][Object.keys(rows[i])[0]];
              if (value === candidate) return true;
            }
            return false;
          };
        }

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

  function makeFunctionEvaluator(name, argEvaluators) {
    return function (row, params) {
      const values = argEvaluators.map(function (evaluate) {
        return evaluate(row, params);
      });
      switch (name) {
        case 'LOWER':
          return values[0] == null ? null : String(values[0]).toLowerCase();
        case 'UPPER':
          return values[0] == null ? null : String(values[0]).toUpperCase();
        case 'LENGTH':
          return values[0] == null ? null : String(values[0]).length;
        case 'COALESCE':
          for (let i = 0; i < values.length; i += 1) {
            if (values[i] != null) return values[i];
          }
          return null;
        case 'IFNULL':
          return values[0] != null ? values[0] : (values.length > 1 ? values[1] : null);
        case 'ABS':
          return values[0] == null ? null : Math.abs(Number(values[0]));
        case 'TRIM':
          if (values[0] == null) return null;
          return trimWithChars(String(values[0]), values.length > 1 ? String(values[1]) : ' ', 'both');
        case 'LTRIM':
          if (values[0] == null) return null;
          return trimWithChars(String(values[0]), values.length > 1 ? String(values[1]) : ' ', 'left');
        case 'RTRIM':
          if (values[0] == null) return null;
          return trimWithChars(String(values[0]), values.length > 1 ? String(values[1]) : ' ', 'right');
        case 'SUBSTR':
        case 'SUBSTRING':
          return sqlSubstr(values[0], values[1], values[2]);
        case 'ROUND':
          return sqlRound(values[0], values[1]);
        default:
          throw new MaiaSQLError(`Unsupported function: ${name}`, 'UNSUPPORTED_FUNCTION');
      }
    };
  }

  function trimWithChars(value, chars, mode) {
    const charSet = new Set(String(chars).split(''));
    let start = 0;
    let end = value.length - 1;
    if (mode === 'both' || mode === 'left') {
      while (start <= end && charSet.has(value[start])) start += 1;
    }
    if (mode === 'both' || mode === 'right') {
      while (end >= start && charSet.has(value[end])) end -= 1;
    }
    return value.slice(start, end + 1);
  }

  function sqlSubstr(value, start, length) {
    if (value == null || start == null) return null;
    const text = String(value);
    let begin = Number(start);
    if (Number.isNaN(begin)) return '';
    begin = begin > 0 ? begin - 1 : Math.max(text.length + begin, 0);
    if (length == null) return text.slice(begin);
    const size = Number(length);
    if (Number.isNaN(size)) return '';
    return text.slice(begin, begin + size);
  }

  function sqlRound(value, precision) {
    if (value == null) return null;
    const number = Number(value);
    if (Number.isNaN(number)) return null;
    const digits = precision == null ? 0 : Number(precision);
    if (Number.isNaN(digits)) return Math.round(number);
    const factor = Math.pow(10, digits);
    return Math.round(number * factor) / factor;
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
      if (fragment[0] === '.') {
        tokens.push({ type: 'DOT', value: '.', valueUpper: '.' });
        index += 1;
        continue;
      }

      throw new MaiaSQLError(`Could not tokenize expression: ${source}`, 'INVALID_EXPRESSION');
    }
    return tokens;
  }

  function isExpressionKeyword(value) {
    return /^(AND|OR|NOT|NULL|TRUE|FALSE|IS|BETWEEN|IN|LIKE|EXISTS|CURRENT_TIMESTAMP|CURRENT_DATE|CURRENT_TIME|CASE|WHEN|THEN|ELSE|END)$/.test(value);
  }

  function detectExistsExpression(source) {
    const text = String(source || '').trim();
    const match = text.match(/^EXISTS\s*\(\s*(SELECT[\s\S]+)\)$/i);
    return match ? { subquery: match[1].trim() } : null;
  }

  function detectInSelectExpression(source) {
    const text = String(source || '').trim();
    const upper = text.toUpperCase();
    let depth = 0;
    let inString = false;
    for (let i = 0; i < upper.length; i += 1) {
      const ch = text[i];
      const next = text[i + 1];
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
      if (depth === 0 && upper.slice(i, i + 4) === ' IN ') {
        const left = text.slice(0, i).trim();
        const right = text.slice(i + 4).trim();
        const subqueryMatch = right.match(/^\(\s*(SELECT[\s\S]+)\)$/i);
        if (subqueryMatch) {
          return {
            left: left,
            subquery: subqueryMatch[1].trim()
          };
        }
      }
    }
    return null;
  }

  function parseInsertStatement(sql) {
    const returningIndex = findClauseIndex(sql.toUpperCase(), ' RETURNING ');
    const returning = returningIndex >= 0 ? sql.slice(returningIndex + 11).trim() : null;
    const body = returningIndex >= 0 ? sql.slice(0, returningIndex).trim() : sql.trim();
    const targetMatch = body.match(/^INSERT(?:\s+OR\s+(REPLACE|IGNORE|ABORT|FAIL))?\s+INTO\s+((?:[A-Za-z_][\w$]*|"(?:[^"]|"")+"?)(?:\s*\.\s*(?:[A-Za-z_][\w$]*|"(?:[^"]|"")+"?))?)\s*(?:\(([\s\S]+?)\))?\s+([\s\S]+)$/i);
    if (!targetMatch) throw new MaiaSQLError(`Could not parse INSERT statement: ${sql}`, 'INVALID_INSERT');
    const conflictMode = targetMatch[1] ? targetMatch[1].toUpperCase() : null;
    const orReplace = conflictMode === 'REPLACE';
    const orIgnore = conflictMode === 'IGNORE';
    const orAbort = conflictMode === 'ABORT' || conflictMode === 'FAIL';
    const tail = targetMatch[4].trim();
    const onConflictDoNothing = /\bON\s+CONFLICT\s+DO\s+NOTHING\b/i.test(tail);
    const cleanedTail = tail.replace(/\bON\s+CONFLICT\s+DO\s+NOTHING\b/i, '').trim();

    if (/^VALUES\b/i.test(cleanedTail)) {
      return {
        target: targetMatch[2],
        columns: targetMatch[3],
        valuesTuples: parseValueTuples(cleanedTail.replace(/^VALUES\s+/i, '')),
        selectSql: null,
        orReplace: orReplace,
        orIgnore: orIgnore,
        orAbort: orAbort,
        onConflictDoNothing: onConflictDoNothing,
        returning: returning
      };
    }

    if (/^SELECT\b/i.test(cleanedTail)) {
      return {
        target: targetMatch[2],
        columns: targetMatch[3],
        valuesTuples: null,
        selectSql: cleanedTail,
        orReplace: orReplace,
        orIgnore: orIgnore,
        orAbort: orAbort,
        onConflictDoNothing: onConflictDoNothing,
        returning: returning
      };
    }

    throw new MaiaSQLError(`Unsupported INSERT source: ${sql}`, 'INVALID_INSERT');
  }

  function materializeInsertSelectRows(selectSql, tx, params, expectedColumns) {
    const result = executeSelect(selectSql, tx, params);
    return result.rows.map(function (row) {
      const keys = Object.keys(row);
      if (keys.length !== expectedColumns) {
        throw new MaiaSQLError('INSERT ... SELECT column count mismatch', 'INSERT_ARITY');
      }
      return keys.map(function (key) { return row[key]; });
    });
  }

  function isConstraintError(error) {
    return error instanceof MaiaSQLError
      && /^(PRIMARY_KEY|UNIQUE|NOT_NULL|CHECK)$/.test(error.code);
  }

  function projectAggregateRows(parsed, rows, paramState, tx) {
    const groups = buildGroups(parsed, rows);
    const outputRows = [];
    const columns = parsed.columns.map(function (projection) { return { name: projection.alias || inferAliasFromExpression(projection.expression || '') }; });
    const havingEvaluator = parsed.having ? compileExpression(parsed.having, tx) : null;

    for (let g = 0; g < groups.length; g += 1) {
      const groupRows = groups[g].rows;
      const representative = groupRows[0] || createScopedRow({});
      const projected = buildAggregateProjection(parsed, groupRows, representative, paramState, tx);
      if (havingEvaluator) {
        const aggregateRow = mergeScopedRows(representative, createScopedRow(projected));
        if (!havingEvaluator(aggregateRow, createParamState(paramState.values))) {
          continue;
        }
      }
      outputRows.push(projected);
    }

    return {
      columns: columns,
      rows: parsed.distinct ? dedupeResultRows(outputRows) : outputRows
    };
  }

  function buildGroups(parsed, rows) {
    if (!parsed.groupBy || parsed.groupBy.length === 0) {
      return [{ key: '__all__', rows: rows }];
    }
    const map = new Map();
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const keyValues = parsed.groupBy.map(function (expression) {
        return compileExpression(expression, null)(row, createParamState([]));
      });
      const key = JSON.stringify(keyValues);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(row);
    }
    return Array.from(map.entries()).map(function (entry) {
      return { key: entry[0], rows: entry[1] };
    });
  }

  function computeAggregate(projection, rows, paramState, tx) {
    if (projection.aggregate === 'COUNT' && projection.expression === '*') {
      return rows.length;
    }
    const values = rows.map(function (row) {
      return compileExpression(projection.expression, tx)(row, paramState);
    }).filter(function (value) {
      return value != null;
    });
    switch (projection.aggregate) {
      case 'COUNT': return values.length;
      case 'SUM': return values.reduce(function (sum, value) { return sum + Number(value); }, 0);
      case 'AVG': return values.length ? values.reduce(function (sum, value) { return sum + Number(value); }, 0) / values.length : null;
      case 'MIN': return values.length ? values.reduce(function (best, value) { return best < value ? best : value; }) : null;
      case 'MAX': return values.length ? values.reduce(function (best, value) { return best > value ? best : value; }) : null;
      default:
        throw new MaiaSQLError(`Unsupported aggregate: ${projection.aggregate}`, 'INVALID_SELECT');
    }
  }

  function buildAggregateProjection(parsed, groupRows, representative, paramState, tx) {
    const projected = {};
    for (let p = 0; p < parsed.columns.length; p += 1) {
      const projection = parsed.columns[p];
      if (projection.kind === 'count') {
        projected[projection.alias] = groupRows.length;
      } else if (projection.kind === 'aggregate') {
        projected[projection.alias] = computeAggregate(projection, groupRows, paramState, tx);
      } else if (projection.kind === 'star' || projection.kind === 'qualifiedStar') {
        throw new MaiaSQLError('STAR projection is not supported together with GROUP BY aggregates', 'INVALID_SELECT');
      } else {
        projected[projection.alias] = compileExpression(projection.expression, tx)(representative, paramState);
      }
    }
    return projected;
  }

  function parseFromClause(source) {
    const parts = splitJoinClauses(source);
    return {
      base: parseSourceRef(parts.base),
      joins: parts.joins.map(parseJoinSegment)
    };
  }

  function parseSourceRef(segment) {
    const match = segment.trim().match(/^((?:[A-Za-z_][\w$]*|"(?:[^"]|"")+"?)(?:\s*\.\s*(?:[A-Za-z_][\w$]*|"(?:[^"]|"")+"?))?)(?:\s+(?:AS\s+)?([A-Za-z_][\w$"]*))?$/i);
    if (!match) throw new MaiaSQLError(`Could not parse FROM source: ${segment}`, 'INVALID_FROM');
    const qualified = normalizeQualifiedName(match[1]);
    const name = qualified.name;
    return {
      name: name,
      alias: match[2] ? normalizeIdentifier(match[2]) : name
    };
  }

  function parseJoinSegment(segment) {
    const match = segment.match(/^(LEFT(?:\s+OUTER)?|INNER)?\s*JOIN\s+([\s\S]+?)\s+ON\s+([\s\S]+)$/i);
    if (!match) throw new MaiaSQLError(`Could not parse JOIN segment: ${segment}`, 'INVALID_JOIN');
    return {
      type: (match[1] || 'INNER').replace(/\s+/g, ' ').toUpperCase(),
      source: parseSourceRef(match[2].trim()),
      on: match[3].trim()
    };
  }

  function splitJoinClauses(source) {
    let depth = 0;
    let inString = false;
    let base = '';
    const joins = [];
    let currentJoin = null;
    let index = 0;

    while (index < source.length) {
      const ch = source[index];
      const next = source[index + 1];

      if (inString) {
        appendCurrent(ch);
        if (ch === '\'' && next === '\'') {
          appendCurrent(next);
          index += 2;
          continue;
        }
        if (ch === '\'') inString = false;
        index += 1;
        continue;
      }

      if (ch === '\'') {
        inString = true;
        appendCurrent(ch);
        index += 1;
        continue;
      }

      if (ch === '(') depth += 1;
      if (ch === ')') depth -= 1;

      if (depth === 0) {
        const keyword = detectJoinKeyword(source, index);
        if (keyword) {
          if (currentJoin) joins.push(currentJoin.trim());
          else base = base.trim();
          currentJoin = keyword;
          index += keyword.length;
          continue;
        }
      }

      appendCurrent(ch);
      index += 1;
    }

    if (currentJoin) joins.push(currentJoin.trim());
    else base = base.trim();

    return { base: base, joins: joins };

    function appendCurrent(text) {
      if (currentJoin === null) base += text;
      else currentJoin += text;
    }
  }

  function detectJoinKeyword(source, index) {
    const candidates = ['LEFT OUTER JOIN', 'LEFT JOIN', 'INNER JOIN', 'JOIN'];
    for (let i = 0; i < candidates.length; i += 1) {
      const keyword = candidates[i];
      const slice = source.slice(index, index + keyword.length);
      if (slice.toUpperCase() !== keyword) continue;
      const before = index === 0 ? ' ' : source[index - 1];
      const after = index + keyword.length >= source.length ? ' ' : source[index + keyword.length];
      if (!/[A-Za-z0-9_]/.test(before) && /\s/.test(after)) {
        return keyword;
      }
    }
    return null;
  }

  function materializeFromClause(fromClause, tx, paramState, outerContextRow) {
    let rows = materializeNamedSource(fromClause.base, tx, paramState, outerContextRow);
    for (let i = 0; i < fromClause.joins.length; i += 1) {
      const join = fromClause.joins[i];
      const rightRows = materializeNamedSource(join.source, tx, paramState, outerContextRow);
      const onEvaluator = compileExpression(join.on, tx);
      const joined = [];
      for (let l = 0; l < rows.length; l += 1) {
        let matched = false;
        for (let r = 0; r < rightRows.length; r += 1) {
          const merged = mergeScopedRows(rows[l], rightRows[r]);
          if (onEvaluator(merged, paramState)) {
            joined.push(merged);
            matched = true;
          }
        }
        if (!matched && join.type.indexOf('LEFT') === 0) {
          joined.push(mergeScopedRows(rows[l], createNullScopedRow(join.source.alias, rightRows[0])));
        }
      }
      rows = joined;
    }
    return rows;
  }

  function materializeNamedSource(sourceRef, tx, paramState, outerContextRow) {
    const table = tx.state.catalog.tables[sourceRef.name];
    if (table) {
      return table.rows.map(function (row) {
        const scoped = createScopedRow(row, sourceRef.alias, sourceRef.name);
        return outerContextRow ? mergeScopedRows(scoped, outerContextRow) : scoped;
      });
    }

    const view = tx.state.catalog.views[sourceRef.name];
    if (view) {
      const result = executeSelect(view.sql, tx, paramState.values, outerContextRow);
      return result.rows.map(function (row) {
        const renamed = applyViewColumnList(view, row);
        const scoped = createScopedRow(renamed, sourceRef.alias, sourceRef.name);
        return outerContextRow ? mergeScopedRows(scoped, outerContextRow) : scoped;
      });
    }

    throw new MaiaSQLError(`Table or view not found: ${sourceRef.name}`, 'UNKNOWN_TABLE');
  }

  function applyViewColumnList(view, row) {
    if (!view.columns || view.columns.length === 0) return row;
    const keys = Object.keys(row);
    const renamed = {};
    for (let i = 0; i < keys.length; i += 1) {
      renamed[view.columns[i] || keys[i]] = row[keys[i]];
    }
    return renamed;
  }

  function createScopedRow(baseRow, alias, objectName) {
    const row = {};
    const visibleColumns = [];
    const sources = {};
    const sourceKey = alias || objectName || null;
    if (sourceKey) sources[sourceKey] = {};
    const keys = Object.keys(baseRow);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      row[key] = baseRow[key];
      visibleColumns.push(key);
      if (sourceKey) {
        row[`${sourceKey}.${key}`] = baseRow[key];
        sources[sourceKey][key] = baseRow[key];
      }
      if (objectName && objectName !== sourceKey) {
        row[`${objectName}.${key}`] = baseRow[key];
        if (!sources[objectName]) sources[objectName] = {};
        sources[objectName][key] = baseRow[key];
      }
    }
    Object.defineProperty(row, '__visibleColumns', { value: visibleColumns, enumerable: false, writable: true });
    Object.defineProperty(row, '__sources', { value: sources, enumerable: false, writable: true });
    return row;
  }

  function mergeScopedRows(left, right) {
    const merged = createScopedRow({});
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    for (let i = 0; i < leftKeys.length; i += 1) merged[leftKeys[i]] = left[leftKeys[i]];
    for (let j = 0; j < rightKeys.length; j += 1) merged[rightKeys[j]] = right[rightKeys[j]];
    merged.__visibleColumns = (left.__visibleColumns || []).concat((right.__visibleColumns || []).filter(function (name) {
      return merged.__visibleColumns.indexOf(name) < 0;
    }));
    merged.__sources = Object.assign({}, left.__sources || {}, right.__sources || {});
    return merged;
  }

  function createNullScopedRow(alias, sampleRow) {
    const base = {};
    const sample = sampleRow && sampleRow.__sources && sampleRow.__sources[alias]
      ? sampleRow.__sources[alias]
      : {};
    const keys = Object.keys(sample);
    for (let i = 0; i < keys.length; i += 1) base[keys[i]] = null;
    return createScopedRow(base, alias, alias);
  }

  function extractCheckExpression(part) {
    const match = part.match(/\bCHECK\s*\(([\s\S]+)\)/i);
    return match ? match[1].trim() : null;
  }

  function parseTriggerDefinition(sql) {
    const normalized = sql.replace(/\s+/g, ' ').trim();
    const match = normalized.match(/^CREATE TRIGGER ([A-Za-z_][\w$"]*) (BEFORE|AFTER) (INSERT|UPDATE|DELETE)(?: OF ([A-Za-z_][\w$"]*(?:\s*,\s*[A-Za-z_][\w$"]*)*))? ON ([A-Za-z_][\w$"]*)(?: FOR EACH ROW)?(?: WHEN (.*?))? BEGIN (.*) END$/i);
    if (!match) throw new MaiaSQLError(`Could not parse CREATE TRIGGER statement: ${sql}`, 'INVALID_CREATE_TRIGGER');
    return {
      name: normalizeIdentifier(match[1]),
      timing: match[2].toUpperCase(),
      event: match[3].toUpperCase(),
      columns: match[4] ? splitTopLevel(match[4], ',').map(function (name) { return normalizeIdentifier(name.trim()); }) : [],
      table: normalizeIdentifier(match[5]),
      when: match[6] ? match[6].trim() : null,
      statements: splitSqlStatements(match[7].trim())
    };
  }

  function fireTriggers(tx, tableName, event, timing, oldRow, newRow) {
    const triggerNames = Object.keys(tx.state.catalog.triggers);
    for (let i = 0; i < triggerNames.length; i += 1) {
      const trigger = tx.state.catalog.triggers[triggerNames[i]];
      if (trigger.table !== tableName || trigger.event !== event || trigger.timing !== timing) continue;
      if (trigger.columns.length > 0 && event === 'UPDATE' && oldRow && newRow) {
        let touched = false;
        for (let c = 0; c < trigger.columns.length; c += 1) {
          if (oldRow[trigger.columns[c]] !== newRow[trigger.columns[c]]) {
            touched = true;
            break;
          }
        }
        if (!touched) continue;
      }
      const contextRow = buildTriggerContextRow(oldRow, newRow);
      if (trigger.when) {
        const allowed = compileExpression(trigger.when, tx)(contextRow, createParamState([]));
        if (!allowed) continue;
      }
      for (let s = 0; s < trigger.statements.length; s += 1) {
        executeTriggerStatement(trigger.statements[s], tx, contextRow);
      }
    }
  }

  function buildTriggerContextRow(oldRow, newRow) {
    const row = createScopedRow({});
    if (oldRow) {
      const keys = Object.keys(oldRow);
      for (let i = 0; i < keys.length; i += 1) row[`OLD.${keys[i]}`] = oldRow[keys[i]];
    }
    if (newRow) {
      const keys = Object.keys(newRow);
      for (let i = 0; i < keys.length; i += 1) {
        row[`NEW.${keys[i]}`] = newRow[keys[i]];
        if (!Object.prototype.hasOwnProperty.call(row, keys[i])) row[keys[i]] = newRow[keys[i]];
      }
    }
    return row;
  }

  function executeTriggerStatement(statement, tx, contextRow) {
    const normalized = stripComments(statement);
    const raiseMatch = normalized.match(/^SELECT\s+RAISE\s*\(\s*(ABORT|FAIL|ROLLBACK)\s*,\s*('(?:''|[^'])*')\s*\)$/i);
    if (raiseMatch) {
      const message = literalValue(raiseMatch[2]);
      throw new MaiaSQLError(message, 'TRIGGER_ABORT');
    }
    if (/^UPDATE\b/i.test(normalized) || /^INSERT\b/i.test(normalized) || /^DELETE\b/i.test(normalized) || /^SELECT\b/i.test(normalized)) {
      executeStatementWithContext(normalized, tx, [], contextRow);
      return;
    }
    throw new MaiaSQLError(`Unsupported trigger body statement: ${statement}`, 'UNSUPPORTED_TRIGGER');
  }

  function executeStatementWithContext(statement, tx, params, contextRow) {
    const normalized = stripComments(statement);
    if (/^SELECT\b/i.test(normalized)) {
      return executeSelect(normalized, tx, params, contextRow);
    }
    return executeStatement(normalized, tx, params);
  }

  function executeSelectSubquery(sql, tx, paramState, outerContextRow) {
    const result = executeSelect(sql, tx, remainingParameters(paramState), outerContextRow);
    return result.rows;
  }

  function remainingParameters(paramState) {
    return paramState.values.slice(paramState.index);
  }

  function nextParameterValue(paramState) {
    const value = paramState.values[paramState.index];
    paramState.index += 1;
    return value;
  }

  function createParamState(values) {
    return { values: values || [], index: 0 };
  }

  function dedupeResultRows(rows) {
    const output = [];
    const seen = new Set();
    for (let i = 0; i < rows.length; i += 1) {
      const key = JSON.stringify(rows[i]);
      if (seen.has(key)) continue;
      seen.add(key);
      output.push(rows[i]);
    }
    return output;
  }

  function removeConflictingRowsForReplace(table, row) {
    const remaining = [];
    for (let i = 0; i < table.rows.length; i += 1) {
      if (!isReplaceConflict(table, table.rows[i], row)) {
        remaining.push(table.rows[i]);
      }
    }
    table.rows = remaining;
  }

  function isReplaceConflict(table, existing, row) {
    if (table.primaryKey && existing[table.primaryKey] != null && existing[table.primaryKey] === row[table.primaryKey]) {
      return true;
    }
    for (let i = 0; i < table.uniqueKeys.length; i += 1) {
      const columns = table.uniqueKeys[i];
      let same = true;
      for (let c = 0; c < columns.length; c += 1) {
        if (existing[columns[c]] !== row[columns[c]]) {
          same = false;
          break;
        }
      }
      if (same) return true;
    }
    return false;
  }

  function collectParenthesizedSql(tokens, startIndex) {
    let depth = 1;
    const values = [];
    for (let i = startIndex; i < tokens.length; i += 1) {
      const token = tokens[i];
      if (token.type === 'LPAREN') depth += 1;
      if (token.type === 'RPAREN') {
        depth -= 1;
        if (depth === 0) break;
      }
      values.push(token.value);
    }
    return values.join(' ');
  }

  function consumeSubqueryTokens(tokens, advance) {
    let depth = 1;
    let count = 0;
    for (let i = 0; i < tokens.length; i += 1) {
      const token = tokens[i];
      count += 1;
      if (token.type === 'LPAREN') depth += 1;
      if (token.type === 'RPAREN') {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    advance(count);
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

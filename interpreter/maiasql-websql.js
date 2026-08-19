(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./maiasql-core'));
  } else {
    root.MaiaSQLWebSQL = factory(root.MaiaSQLRuntime);
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function (runtime) {
  'use strict';

  const MaiaSQL = runtime.MaiaSQL;
  const MaiaSQLError = runtime.MaiaSQLError;

  const WEBSQL_ERRORS = {
    UNKNOWN_ERR: 0,
    DATABASE_ERR: 1,
    VERSION_ERR: 2,
    TOO_LARGE_ERR: 3,
    QUOTA_ERR: 4,
    SYNTAX_ERR: 5,
    CONSTRAINT_ERR: 6,
    TIMEOUT_ERR: 7
  };

  class WebSqlError extends Error {
    constructor(message, code) {
      super(message);
      this.name = 'SQLError';
      this.code = code == null ? WEBSQL_ERRORS.UNKNOWN_ERR : code;
    }
  }

  class WebSqlRowList {
    constructor(rows) {
      this._rows = rows || [];
      this.length = this._rows.length;
    }

    item(index) {
      return this._rows[index] || null;
    }
  }

  class WebSqlResultSet {
    constructor(result) {
      this.insertId = result.insertId;
      this.rowsAffected = result.rowsAffected;
      this.rows = new WebSqlRowList(result.rows);
    }
  }

  class WebSqlTransaction {
    constructor() {
      this.commands = [];
      this.failed = null;
    }

    executeSql(sql, args, success, error) {
      this.commands.push({
        sql: sql,
        args: Array.isArray(args) ? args : [],
        success: typeof success === 'function' ? success : null,
        error: typeof error === 'function' ? error : null
      });
    }
  }

  class WebSqlDatabase {
    constructor(name, version, displayName, estimatedSize, creationCallback) {
      this.version = version || '1.0';
      this._ready = MaiaSQL.open({
        name: name,
        version: version || '1.0',
        displayName: displayName,
        estimatedSize: estimatedSize,
        storage: typeof indexedDB !== 'undefined' ? 'indexeddb' : 'memory'
      }).then((db) => {
        this._database = db;
        this.version = db.version;
        if (typeof creationCallback === 'function') {
          creationCallback(this);
        }
        return db;
      });
    }

    transaction(callback, errorCallback, successCallback) {
      return this._runQueuedTransaction(callback, errorCallback, successCallback, false);
    }

    readTransaction(callback, errorCallback, successCallback) {
      return this._runQueuedTransaction(callback, errorCallback, successCallback, true);
    }

    changeVersion(oldVersion, newVersion, callback, errorCallback, successCallback) {
      return this.transaction(async (tx) => {
        const db = await this._ready;
        if (String(db.version) !== String(oldVersion)) {
          throw new WebSqlError(
            `Version mismatch. Expected ${oldVersion}, found ${db.version}`,
            WEBSQL_ERRORS.VERSION_ERR
          );
        }
        if (typeof callback === 'function') callback(tx);
        await db.exec(`PRAGMA user_version = ${Number(newVersion) || 0}`);
        this.version = String(newVersion);
      }, errorCallback, successCallback);
    }

    async _runQueuedTransaction(callback, errorCallback, successCallback, readOnly) {
      const db = await this._ready;
      const queue = new WebSqlTransaction();

      try {
        if (typeof callback === 'function') callback(queue);
        await db.transaction(async (nativeTx) => {
          if (readOnly) nativeTx.readOnly = true;
          for (let i = 0; i < queue.commands.length; i += 1) {
            const command = queue.commands[i];
            try {
              const result = await nativeTx.exec(command.sql, command.args);
              if (command.success) {
                command.success(queue, new WebSqlResultSet(result));
              }
            } catch (error) {
              const mapped = mapError(error);
              if (command.error) {
                const keepGoing = command.error(queue, mapped);
                if (keepGoing === true) {
                  continue;
                }
              }
              throw mapped;
            }
          }
        }, { readOnly: readOnly });

        this.version = db.version;
        if (typeof successCallback === 'function') successCallback();
      } catch (error) {
        const mapped = mapError(error);
        if (typeof errorCallback === 'function') errorCallback(mapped);
        else throw mapped;
      }
    }
  }

  function mapError(error) {
    if (error instanceof WebSqlError) return error;
    if (error instanceof MaiaSQLError) {
      return new WebSqlError(error.message, mapErrorCode(error.code));
    }
    return new WebSqlError(error && error.message ? error.message : String(error));
  }

  function mapErrorCode(code) {
    switch (code) {
      case 'INVALID_EXPRESSION':
      case 'INVALID_INSERT':
      case 'INVALID_UPDATE':
      case 'INVALID_DELETE':
      case 'INVALID_CREATE_TABLE':
      case 'UNSUPPORTED_STATEMENT':
        return WEBSQL_ERRORS.SYNTAX_ERR;
      case 'NOT_NULL':
      case 'PRIMARY_KEY':
      case 'READ_ONLY':
        return WEBSQL_ERRORS.CONSTRAINT_ERR;
      default:
        return WEBSQL_ERRORS.DATABASE_ERR;
    }
  }

  function openDatabase(name, version, displayName, estimatedSize, creationCallback) {
    return new WebSqlDatabase(name, version, displayName, estimatedSize, creationCallback);
  }

  return {
    openDatabase: openDatabase,
    WebSqlDatabase: WebSqlDatabase,
    WebSqlTransaction: WebSqlTransaction,
    WebSqlResultSet: WebSqlResultSet,
    WebSqlRowList: WebSqlRowList,
    WebSqlError: WebSqlError,
    SQLError: WEBSQL_ERRORS
  };
}));

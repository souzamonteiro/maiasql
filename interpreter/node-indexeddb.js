'use strict';

const databases = new Map();

function cloneValue(value) {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  return JSON.parse(JSON.stringify(value));
}

function makeRequest(handler) {
  const request = {
    result: undefined,
    error: null,
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null
  };

  process.nextTick(() => {
    try {
      request.result = handler();
      if (typeof request.onsuccess === 'function') {
        request.onsuccess();
      }
    } catch (error) {
      request.error = error;
      if (typeof request.onerror === 'function') {
        request.onerror();
      }
    }
  });

  return request;
}

class NodeIDBObjectStore {
  constructor(database, name) {
    this.database = database;
    this.name = name;
    this._data = new Map();
  }

  get(key) {
    return makeRequest(() => this._data.get(key));
  }

  put(value, key) {
    return makeRequest(() => {
      this._data.set(key, cloneValue(value));
      return key;
    });
  }

  delete(key) {
    return makeRequest(() => {
      const existed = this._data.has(key);
      this._data.delete(key);
      return existed;
    });
  }
}

class NodeIDBDatabase {
  constructor(name, version) {
    this.name = name;
    this.version = version;
    this.objectStoreNames = {
      contains: (storeName) => this._stores.has(storeName)
    };
    this._stores = new Map();
    this._closed = false;
  }

  createObjectStore(storeName) {
    if (!this._stores.has(storeName)) {
      this._stores.set(storeName, new NodeIDBObjectStore(this, storeName));
    }
    this.objectStoreNames = {
      contains: (candidate) => this._stores.has(candidate)
    };
    return this._stores.get(storeName);
  }

  transaction(storeName, mode) {
    const transaction = {
      mode: mode || 'readonly',
      db: this,
      error: null,
      onabort: null,
      onerror: null,
      objectStore: (targetStoreName) => {
        if (!this._stores.has(targetStoreName)) {
          throw new Error(`Object store not found: ${targetStoreName}`);
        }
        return this._stores.get(targetStoreName);
      }
    };

    return transaction;
  }

  close() {
    this._closed = true;
  }
}

const indexedDB = {
  open(name, version) {
    const current = databases.get(name);
    const request = {
      result: null,
      error: null,
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null
    };

    process.nextTick(() => {
      try {
        let database = current;
        if (!database) {
          database = new NodeIDBDatabase(name, version || 1);
          databases.set(name, database);
        }

        if (!current || (version != null && Number(version) > Number(database.version))) {
          database.version = version != null ? Number(version) : database.version;
        }

        request.result = database;

        if (!current || (version != null && Number(version) > Number(current.version))) {
          if (typeof request.onupgradeneeded === 'function') {
            request.onupgradeneeded();
          }
        }

        if (typeof request.onsuccess === 'function') {
          request.onsuccess();
        }
      } catch (error) {
        request.error = error;
        if (typeof request.onerror === 'function') {
          request.onerror();
        }
      }
    });

    return request;
  },

  deleteDatabase(name) {
    const request = {
      result: null,
      error: null,
      onsuccess: null,
      onerror: null
    };

    process.nextTick(() => {
      try {
        databases.delete(name);
        request.result = null;
        if (typeof request.onsuccess === 'function') {
          request.onsuccess();
        }
      } catch (error) {
        request.error = error;
        if (typeof request.onerror === 'function') {
          request.onerror();
        }
      }
    });

    return request;
  }
};

module.exports = {
  indexedDB,
  databases
};

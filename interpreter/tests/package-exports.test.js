'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const pkg = require('..');

describe('MaiaSQL package exports', () => {
  it('exposes the native runtime, parser and WebSQL adapter', async () => {
    assert.equal(typeof pkg.Parser, 'function');
    assert.equal(typeof pkg.MaiaSQL.open, 'function');
    assert.equal(typeof pkg.openDatabase, 'function');
    assert.equal(typeof pkg.installWebSqlGlobals, 'function');

    const db = await pkg.MaiaSQL.open({
      name: 'package-exports-test',
      storage: 'memory',
      parser: pkg.Parser
    });

    await db.exec(`
      CREATE TABLE demo (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
      );
      INSERT INTO demo (name) VALUES ('Ada');
    `);

    const result = await db.exec('SELECT name FROM demo');
    assert.equal(result.rows[0].name, 'Ada');
  });

  it('installs openDatabase onto an arbitrary target object', () => {
    const target = {};
    const install = pkg.installWebSqlGlobals({ target: target });

    assert.equal(install.installed, true);
    assert.equal(typeof target.openDatabase, 'function');
    assert.equal(target.MaiaSQLWebSQL, pkg.MaiaSQLWebSQL);
  });
});

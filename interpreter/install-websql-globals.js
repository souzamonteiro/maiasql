'use strict';

const websql = require('./maiasql-websql');

function installWebSqlGlobals(options) {
  const settings = Object.assign({
    target: typeof globalThis !== 'undefined' ? globalThis : null,
    overwrite: false
  }, options || {});

  const target = settings.target;
  if (!target) {
    throw new Error('installWebSqlGlobals requires a target object or globalThis support');
  }

  if (!settings.overwrite && typeof target.openDatabase === 'function') {
    return {
      installed: false,
      reason: 'openDatabase already exists on target',
      target: target
    };
  }

  target.openDatabase = websql.openDatabase;
  target.MaiaSQLWebSQL = websql;

  return {
    installed: true,
    target: target
  };
}

module.exports = installWebSqlGlobals;

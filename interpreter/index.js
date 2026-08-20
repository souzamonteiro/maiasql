'use strict';

const Parser = require('./sql-parser');
const runtime = require('./maiasql-core');
const websql = require('./maiasql-websql');
const installWebSqlGlobals = require('./install-websql-globals');

module.exports = {
  Parser: Parser,
  sqlParser: Parser,
  MaiaSQL: runtime.MaiaSQL,
  MaiaDatabase: runtime.MaiaDatabase,
  MaiaTransaction: runtime.MaiaTransaction,
  MaiaResult: runtime.MaiaResult,
  MaiaSQLError: runtime.MaiaSQLError,
  MaiaSQLRuntime: runtime,
  MaiaSQLWebSQL: websql,
  openDatabase: websql.openDatabase,
  installWebSqlGlobals: installWebSqlGlobals,
  splitSqlStatements: runtime.splitSqlStatements,
  compileExpression: runtime.compileExpression
};

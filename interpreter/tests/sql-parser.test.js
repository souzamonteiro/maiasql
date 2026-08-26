'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { describe, it, test } = require('node:test');
const assert = require('node:assert/strict');

const { backupExistingParser, run } = require('./run-sql-parser');

const runSlowParserRegeneration = ['1', 'true', 'yes'].includes(String(process.env.MAIASQL_RUN_SLOW_PARSER_TEST || '').toLowerCase());
const slowParserTimeoutMs = Number.parseInt(process.env.MAIASQL_SLOW_PARSER_TIMEOUT_MS || '600000', 10);
const slowParserTest = runSlowParserRegeneration ? test : test.skip;

describe('MaiaSQL SQL parser integration', () => {
  it('creates a backup before replacing an existing generated parser', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'maiasql-parser-backup-'));
    const parserPath = path.join(tempDir, 'sql-parser.js');
    fs.writeFileSync(parserPath, 'module.exports = { old: true };\n');

    const backupPath = backupExistingParser(parserPath);

    assert.ok(backupPath, 'Expected a backup path to be created');
    assert.ok(fs.existsSync(backupPath), 'Expected the backup file to exist');
    assert.match(fs.readFileSync(backupPath, 'utf8'), /old:\s*true/);

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('parses the smoke SQL corpus with the checked-in parser', () => {
    const result = run();

    assert.equal(result.rootName, 'SqlScript');
    assert.ok(result.tokenCount > 1, 'Expected a tokenized SQL script');
  });

  slowParserTest('parses the smoke SQL corpus with a parser regenerated from SQL.ebnf', () => {
    const result = run({
      generateParser: true,
      generateTimeoutMs: slowParserTimeoutMs
    });

    assert.equal(result.rootName, 'SqlScript');
    assert.ok(result.tokenCount > 1, 'Expected a tokenized SQL script');
  });
});
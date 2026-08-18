'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { run } = require('./run-sql-parser');

describe('MaiaSQL SQL parser integration', () => {
  it('parses the smoke SQL corpus with the checked-in parser', () => {
    const result = run();

    assert.equal(result.rootName, 'SqlScript');
    assert.ok(result.tokenCount > 1, 'Expected a tokenized SQL script');
  });

  it('parses the smoke SQL corpus with a parser regenerated from SQL.ebnf', () => {
    const result = run({ generateParser: true, generateTimeoutMs: 15000 });

    assert.equal(result.rootName, 'SqlScript');
    assert.ok(result.tokenCount > 1, 'Expected a tokenized SQL script');
  });
});
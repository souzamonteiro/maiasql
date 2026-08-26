'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { buildParserCandidates } = require('../admin-app/path-resolver');

test('buildParserCandidates includes likely parser URLs for root-homed admin pages', () => {
  const candidates = buildParserCandidates('http://localhost:8000/interpreter/admin-app/index.html');

  assert.ok(candidates.includes('http://localhost:8000/interpreter/sql-parser.js'));
  assert.ok(candidates.includes('http://localhost:8000/sql-parser.js'));
  assert.ok(candidates.some((value) => value.endsWith('/interpreter/admin-app/../sql-parser.js')) === false);
});

test('buildParserCandidates keeps relative candidates stable for nested routes', () => {
  const candidates = buildParserCandidates('http://localhost:8000/app/test-page/');

  assert.ok(candidates.includes('http://localhost:8000/app/test-page/sql-parser.js'));
  assert.ok(candidates.includes('http://localhost:8000/sql-parser.js'));
});

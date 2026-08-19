#!/bin/bash

rm *.json

node test-parser-improved.js --json focused-tests.sql > focused-tests.json
node test-parser-improved.js --json lexer-tests.sql > lexer-tests.json
node test-parser-improved.js --json operator-test.sql > operator-test.json
node test-parser-improved.js --json positive-tests.sql > positive-tests.json
node test-parser-improved.js --json precedence-tests.sql > precedence-tests.json
node test-parser-improved.js --json smoke-tests.sql > smoke-tests.json

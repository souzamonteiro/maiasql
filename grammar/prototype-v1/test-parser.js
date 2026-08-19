'use strict';

const fs = require('fs');
const path = require('path');

const PROTOTYPE_DIR = __dirname;

function resolvePath(value, fallback) {
  return path.resolve(PROTOTYPE_DIR, value || fallback);
}

function parseArgs(argv) {
  const options = {
    sqlFiles: []
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--parser') {
      options.parserPath = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === '--collector') {
      options.collectorPath = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === '--sql') {
      options.sqlFiles.push(argv[index + 1]);
      index += 1;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    options.sqlFiles.push(arg);
  }

  return options;
}

function printHelp() {
  console.log([
    'Usage: node test-parser.js [--parser parser.js] [--collector parse-tree-collector.js] [--sql file.sql]...',
    '',
    'Defaults:',
    '  parser:    ./parser.js',
    '  collector: ./parse-tree-collector.js',
    '  sql:       ./smoke-tests.sql ./focused-tests.sql'
  ].join('\n'));
}

function run() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return 0;
  }

  const parserPath = resolvePath(options.parserPath, 'parser.js');
  const collectorPath = resolvePath(options.collectorPath, 'parse-tree-collector.js');
  const sqlFiles = options.sqlFiles.length > 0
    ? options.sqlFiles.map((file) => resolvePath(file))
    : ['smoke-tests.sql', 'focused-tests.sql'].map((file) => resolvePath(file));

  const Parser = require(parserPath);
  const { ParseTreeCollector } = require(collectorPath);

  let failed = false;

  for (const sqlPath of sqlFiles) {
    const sql = fs.readFileSync(sqlPath, 'utf8');
    const collector = new ParseTreeCollector();
    const parser = new Parser(sql, collector);

    try {
      collector.parse(parser, path.basename(sqlPath));
      const rootName = collector.root ? collector.root.name : '(none)';
      const tokenCount = Array.isArray(parser.tokens) ? parser.tokens.length : 0;
      console.log(`OK ${path.basename(sqlPath)} root=${rootName} tokens=${tokenCount}`);
    } catch (err) {
      failed = true;
      const message = err && err.message ? err.message : String(err);
      console.error(`FAIL ${path.basename(sqlPath)}: ${message}`);
    }
  }

  return failed ? 1 : 0;
}

if (require.main === module) {
  process.exitCode = run();
}

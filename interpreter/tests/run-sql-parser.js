'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const INTERPRETER_DIR = path.resolve(__dirname, '..');
const REPO_DIR = path.resolve(INTERPRETER_DIR, '..');

function resolveTrexPath() {
  const candidates = [
    path.join(REPO_DIR, 'maiacc', 'bin', 'tREx.sh'),
    path.join(path.dirname(REPO_DIR), 'maiacc', 'bin', 'tREx.sh')
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(`Could not find tREx.sh. Checked: ${candidates.join(', ')}`);
}

function generateParser(parserOutputPath, timeoutMs = 120000) {
  const grammarPath = path.join(REPO_DIR, 'grammar', 'SQL.ebnf');
  const trexPath = resolveTrexPath();
  const result = spawnSync(trexPath, [grammarPath, parserOutputPath], {
    cwd: REPO_DIR,
    encoding: 'utf8',
    timeout: timeoutMs
  });

  if (result.error) {
    if (result.error.code === 'ETIMEDOUT') {
      throw new Error(`tREx generation timed out after ${timeoutMs}ms`);
    }

    throw result.error;
  }

  if (result.status !== 0) {
    const stderr = result.stderr ? result.stderr.trim() : '';
    const stdout = result.stdout ? result.stdout.trim() : '';
    throw new Error(
      `tREx generation failed with exit code ${result.status}\n${stderr || stdout || 'No output'}`
    );
  }

  return parserOutputPath;
}

function parseSql({ parserPath, collectorPath, sqlPath }) {
  const Parser = require(parserPath);
  const { ParseTreeCollector } = require(collectorPath);
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const collector = new ParseTreeCollector();
  const parser = new Parser(sql, collector);

  collector.parse(parser, path.basename(sqlPath));

  return {
    parserPath,
    sqlPath,
    rootName: collector.root ? collector.root.name : null,
    tokenCount: Array.isArray(parser.tokens) ? parser.tokens.length : 0
  };
}

function run(options = {}) {
  const sqlPath = path.resolve(options.sqlPath || path.join(__dirname, 'smoke-tests.sql'));
  const collectorPath = path.resolve(options.collectorPath || path.join(INTERPRETER_DIR, 'parse-tree-collector.js'));
  let parserPath = options.parserPath
    ? path.resolve(options.parserPath)
    : path.join(INTERPRETER_DIR, 'sql-parser.js');
  let tempDir = null;

  try {
    if (options.generateParser) {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'maiasql-parser-'));
      parserPath = generateParser(
        path.join(tempDir, 'sql-parser.generated.js'),
        options.generateTimeoutMs
      );
    }

    return parseSql({ parserPath, collectorPath, sqlPath });
  } finally {
    if (tempDir) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (_) {
        // Best-effort cleanup for temporary generated parsers.
      }
    }
  }
}

function parseArgs(argv) {
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--generate') {
      options.generateParser = true;
      continue;
    }

    if (arg === '--sql') {
      options.sqlPath = argv[index + 1];
      index += 1;
      continue;
    }

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

    if (arg === '--timeout-ms') {
      options.generateTimeoutMs = Number.parseInt(argv[index + 1], 10);
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

if (require.main === module) {
  try {
    const result = run(parseArgs(process.argv.slice(2)));
    console.log(`OK: parsed ${result.sqlPath}`);
    console.log(`parser: ${result.parserPath}`);
    console.log(`root: ${result.rootName}`);
    console.log(`tokens: ${result.tokenCount}`);
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    console.error(message);
    process.exitCode = 1;
  }
}

module.exports = {
  generateParser,
  parseSql,
  run
};
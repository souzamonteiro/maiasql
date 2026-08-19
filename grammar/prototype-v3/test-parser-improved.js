'use strict';

const fs = require('fs');
const path = require('path');

const PROTOTYPE_DIR = __dirname;

function resolvePath(value, fallback) {
  return path.resolve(PROTOTYPE_DIR, value || fallback);
}

function parseArgs(argv) {
  const options = {
    sqlFiles: [],
    printTree: false,
    json: false,
    xml: false,
    ast: false,
    outputDir: null
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--parser' || arg === '--collector' || arg === '--sql' || arg === '--out-dir') {
      const value = argv[index + 1];
      if (!value) throw new Error(`${arg} requires a value`);
      if (arg === '--parser') options.parserPath = value;
      if (arg === '--collector') options.collectorPath = value;
      if (arg === '--sql') options.sqlFiles.push(value);
      if (arg === '--out-dir') options.outputDir = value;
      index += 1;
      continue;
    }

    if (arg === '--tree') { options.printTree = true; continue; }
    if (arg === '--json') { options.json = true; continue; }
    if (arg === '--xml') { options.xml = true; continue; }
    if (arg === '--ast') { options.ast = true; continue; }
    if (arg === '--all') {
      options.printTree = true;
      options.json = true;
      options.xml = true;
      options.ast = true;
      continue;
    }
    if (arg === '--help' || arg === '-h') { options.help = true; continue; }

    options.sqlFiles.push(arg);
  }

  return options;
}

function printHelp() {
  console.log([
    'Usage:',
    '  node test-parser.js [options] file.sql ...',
    '',
    'Options:',
    '  --parser FILE       Generated parser (default: ./parser.js)',
    '  --collector FILE    Collector module (default: ./parse-tree-collector.js)',
    '  --sql FILE          Add an SQL input file; may be repeated',
    '  --tree              Print the concrete syntax tree',
    '  --json              Emit JSON',
    '  --xml               Emit XML',
    '  --ast               Use the generic structural AST for JSON/XML',
    '  --all               Equivalent to --tree --json --xml --ast',
    '  --out-dir DIR       Write JSON/XML files instead of stdout',
    '  -h, --help          Show this help',
    '',
    'Examples:',
    '  node test-parser.js --tree --sql lexer-tests.sql',
    '  node test-parser.js --ast --json --xml --out-dir output query.sql',
    '',
    'Note: --ast currently emits a generic structural AST. A semantic MaiaSQL',
    'AST builder should later replace it for planning and execution.'
  ].join('\n'));
}

function ensureDirectory(directory) {
  if (directory) fs.mkdirSync(directory, { recursive: true });
}

function outputArtifact(content, extension, sqlPath, outputDir) {
  if (!outputDir) {
    process.stdout.write(`${content}\n`);
    return;
  }

  ensureDirectory(outputDir);
  const base = path.basename(sqlPath, path.extname(sqlPath));
  const destination = path.join(outputDir, `${base}.${extension}`);
  fs.writeFileSync(destination, content, 'utf8');
  console.log(`WROTE ${destination}`);
}

function run() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(err.message);
    return 2;
  }

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
  const { ParseTreeCollector, printTree } = require(collectorPath);

  let failed = false;

  for (const sqlPath of sqlFiles) {
    let sql;
    try {
      sql = fs.readFileSync(sqlPath, 'utf8');
    } catch (err) {
      failed = true;
      console.error(`FAIL ${sqlPath}: ${err.message}`);
      continue;
    }

    const collector = new ParseTreeCollector();
    let parser;
    try {
      parser = new Parser(sql, collector);
      collector.parse(parser, path.basename(sqlPath));

      const rootName = collector.root ? collector.root.name : '(none)';
      const tokenCount = Array.isArray(parser.tokens) ? parser.tokens.length : 0;
      console.log(`OK ${path.basename(sqlPath)} root=${rootName} tokens=${tokenCount}`);

      if (options.printTree) {
        console.log(`\n=== TREE ${path.basename(sqlPath)} ===`);
        printTree(collector.root);
      }

      if (options.json) {
        const json = collector.toJSON(2, { ast: options.ast });
        outputArtifact(json, options.ast ? 'ast.json' : 'cst.json', sqlPath, options.outputDir);
      }

      if (options.xml) {
        const xml = collector.toXml({ ast: options.ast });
        outputArtifact(xml, options.ast ? 'ast.xml' : 'cst.xml', sqlPath, options.outputDir);
      }
    } catch (err) {
      failed = true;
      console.error(`FAIL ${path.basename(sqlPath)}: ${err.message}`);
    }
  }

  return failed ? 1 : 0;
}

if (require.main === module) {
  process.exitCode = run();
}

module.exports = { parseArgs, run };

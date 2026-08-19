'use strict';

class ParseTreeCollector {
  constructor() {
    this.stack = [];
    this.root = null;
  }

  reset() {
    this.stack.length = 0;
    this.root = null;
  }

  parse(parser, inputLabel = 'input') {
    if (!parser || typeof parser.parse !== 'function') {
      throw new Error('ParseTreeCollector.parse requires a parser instance with parse()');
    }

    this.reset();

    const inputText = parser.lexer && typeof parser.lexer.input === 'string'
      ? parser.lexer.input
      : '';

    try {
      parser.parse();
    } catch (err) {
      throw buildParseError(err, parser, inputText, inputLabel);
    }

    if (!this.root) {
      throw new Error(`Parser completed for ${inputLabel} without producing a parse tree`);
    }

    return this.root;
  }

  checkpoint() {
    return {
      stackLen: this.stack.length,
      stackChildLens: this.stack.map((node) =>
        Array.isArray(node && node.children) ? node.children.length : 0
      ),
      root: this.root
    };
  }

  restore(mark) {
    if (!mark) return;

    const targetLen = Number.isInteger(mark.stackLen) ? mark.stackLen : 0;
    const childLens = Array.isArray(mark.stackChildLens) ? mark.stackChildLens : [];

    const sharedLen = Math.min(this.stack.length, targetLen, childLens.length);
    for (let i = 0; i < sharedLen; i += 1) {
      const node = this.stack[i];
      if (node && Array.isArray(node.children)) {
        node.children.length = childLens[i];
      }
    }

    if (this.stack.length > targetLen) {
      this.stack.length = targetLen;
    }

    this.root = Object.prototype.hasOwnProperty.call(mark, 'root')
      ? mark.root
      : this.root;
  }

  startNonterminal(name, tokenIndex = null) {
    const node = { kind: 'nonterminal', name, children: [] };
    if (Number.isInteger(tokenIndex)) node.startToken = tokenIndex;
    this.stack.push(node);
  }

  terminal(expectedType, tokenValue, tokenIndex = null) {
    if (this.stack.length === 0) return;

    const terminalNode = {
      kind: 'terminal',
      token: expectedType,
      value: tokenValue
    };
    if (Number.isInteger(tokenIndex)) terminalNode.tokenIndex = tokenIndex;

    this.stack[this.stack.length - 1].children.push(terminalNode);
  }

  endNonterminal(name = null, tokenIndex = null) {
    const node = this.stack.pop();
    if (!node) return;

    if (name && node.name !== name) {
      throw new Error(`Collector stack mismatch: expected ${node.name}, ended ${name}`);
    }
    if (Number.isInteger(tokenIndex)) node.endToken = tokenIndex;

    if (this.stack.length === 0) {
      this.root = node;
    } else {
      this.stack[this.stack.length - 1].children.push(node);
    }
  }

  abortNonterminal() {
    this.stack.pop();
  }

  /** Concrete parse tree (CST) as plain JSON-compatible object. */
  toObject() {
    return this.root;
  }

  /**
   * Generic structural AST.
   * This preserves grammar nodes and terminals; it is not yet the semantic
   * MaiaSQL AST used by the evaluator/planner.
   */
  toAst() {
    if (!this.root) {
      throw new Error('No parse tree was collected from parser events');
    }
    return parseNodeToAst(this.root);
  }

  toJSON(space = 2, options = {}) {
    const value = options.ast ? this.toAst() : this.root;
    return JSON.stringify(value, null, space);
  }

  toXml(options = {}) {
    if (!this.root) {
      throw new Error('No parse tree was collected from parser events');
    }

    const includeDeclaration = options.includeDeclaration !== false;
    const root = options.ast ? this.toAst() : this.root;
    const xmlBody = options.ast
      ? serializeAstAsXml(root)
      : serializeNodeAsXml(root);

    return includeDeclaration
      ? `<?xml version="1.0" encoding="UTF-8"?>${xmlBody}`
      : xmlBody;
  }
}

function buildParseError(err, parser, inputText, inputLabel) {
  const originalMessage = err && err.message ? err.message : String(err);
  const diagnostic = selectBestDiagnostic(parser);
  const offset = diagnostic && Number.isInteger(diagnostic.offset)
    ? diagnostic.offset
    : extractOffsetFromError(err, parser);

  const expected = diagnostic && diagnostic.expected
    ? ` expected ${diagnostic.expected}`
    : '';
  const found = diagnostic && diagnostic.found
    ? `, found ${diagnostic.found}`
    : '';

  if (offset === null || inputText.length === 0) {
    return new Error(`Parse failed for ${inputLabel}:${expected}${found}: ${originalMessage}`);
  }

  const loc = offsetToLineColumn(inputText, offset);
  const excerpt = sourceExcerpt(inputText, loc.line, loc.column);
  return new Error(
    `Parse failed for ${inputLabel} at line ${loc.line}, column ${loc.column} ` +
    `(offset ${loc.offset}):${expected}${found}: ${originalMessage}` +
    (excerpt ? `\n${excerpt}` : '')
  );
}

function selectBestDiagnostic(parser) {
  if (!parser || !Array.isArray(parser.errors) || parser.errors.length === 0) {
    return null;
  }

  let best = null;
  for (const item of parser.errors) {
    if (!item || !Number.isInteger(item.position)) continue;
    if (!best || item.position > best.position) best = item;
  }
  if (!best) return null;

  const token = Array.isArray(parser.tokens) ? parser.tokens[best.position] : null;
  return {
    ...best,
    offset: token && Number.isInteger(token.start) ? token.start : null,
    found: best.found || (token ? token.type : 'EOF')
  };
}

function offsetToLineColumn(text, offset) {
  const safeOffset = Math.max(0, Math.min(Number(offset) || 0, text.length));
  let line = 1;
  let column = 1;

  for (let i = 0; i < safeOffset; i += 1) {
    const ch = text[i];
    if (ch === '\r') {
      if (text[i + 1] === '\n') i += 1;
      line += 1;
      column = 1;
    } else if (ch === '\n') {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }

  return { line, column, offset: safeOffset };
}

function extractOffsetFromError(err, parser) {
  if (parser && Array.isArray(parser.tokens) && Number.isInteger(parser.position)) {
    const token = parser.tokens[parser.position] || null;
    if (token && Number.isInteger(token.start)) return token.start;
  }

  const message = err && err.message ? String(err.message) : '';
  const match = message.match(/\b(?:position|offset)\s+(\d+)\b/i);
  return match ? Number(match[1]) : null;
}

function sourceExcerpt(text, line, column) {
  const lines = text.split(/\r\n|\r|\n/);
  const sourceLine = lines[line - 1];
  if (typeof sourceLine !== 'string') return '';
  return `${String(line).padStart(4, ' ')} | ${sourceLine}\n     | ${' '.repeat(Math.max(0, column - 1))}^`;
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function xmlAttributeEscape(value) {
  return xmlEscape(value)
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function safeXmlName(value, fallback = 'node') {
  const text = String(value || fallback).replace(/[^A-Za-z0-9_.-]/g, '_');
  return /^[A-Za-z_]/.test(text) ? text : `_${text}`;
}

function terminalElementName(tokenType) {
  if (tokenType === 'EOF') return 'EOF';
  if (tokenType.startsWith('KW_')) return 'KEYWORD';
  if (tokenType.startsWith('TOKEN_')) return 'TOKEN';
  return safeXmlName(tokenType, 'TOKEN');
}

function serializeNodeAsXml(node) {
  if (!node) return '';

  if (node.kind === 'terminal') {
    if (node.token === 'EOF') return '<EOF/>';
    const elementName = terminalElementName(node.token);
    const tokenAttr = xmlAttributeEscape(node.token);
    return `<${elementName} type="${tokenAttr}">${xmlEscape(node.value)}</${elementName}>`;
  }

  const elementName = safeXmlName(node.name, 'nonterminal');
  const children = Array.isArray(node.children) ? node.children : [];
  if (children.length === 0) return `<${elementName}/>`;
  return `<${elementName}>${children.map(serializeNodeAsXml).join('')}</${elementName}>`;
}

function parseNodeToAst(node) {
  if (node.kind === 'terminal') {
    return {
      type: 'token',
      token: node.token,
      value: node.value,
      ...(Number.isInteger(node.tokenIndex) ? { tokenIndex: node.tokenIndex } : {})
    };
  }

  return {
    type: node.name,
    children: (node.children || []).map(parseNodeToAst)
  };
}

function serializeAstAsXml(node) {
  if (!node) return '';
  if (node.type === 'token') {
    return `<token type="${xmlAttributeEscape(node.token)}">${xmlEscape(node.value)}</token>`;
  }
  const elementName = safeXmlName(node.type, 'node');
  const children = Array.isArray(node.children) ? node.children : [];
  return `<${elementName}>${children.map(serializeAstAsXml).join('')}</${elementName}>`;
}

function getNodeLabel(node) {
  if (!node) return '(null)';
  if (node.kind === 'terminal') {
    return `${node.token}: ${JSON.stringify(node.value)}`;
  }
  return node.name;
}

function printTree(node, prefix = '', isLast = true, isRoot = true, output = console.log) {
  if (!node) return;

  const branch = isRoot ? '' : isLast ? '└─ ' : '├─ ';
  output(prefix + branch + getNodeLabel(node));

  if (!Array.isArray(node.children) || node.children.length === 0) return;

  const childPrefix = isRoot ? '' : prefix + (isLast ? '   ' : '│  ');
  for (let index = 0; index < node.children.length; index += 1) {
    printTree(
      node.children[index],
      childPrefix,
      index === node.children.length - 1,
      false,
      output
    );
  }
}

module.exports = {
  ParseTreeCollector,
  printTree,
  getNodeLabel,
  offsetToLineColumn
};

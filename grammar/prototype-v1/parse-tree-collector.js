class ParseTreeCollector {
  constructor() {
    this.stack = [];
    this.root = null;
  }

  parse(parser, inputLabel = 'input') {
    if (!parser || typeof parser.parse !== 'function') {
      throw new Error('ParseTreeCollector.parse requires a parser instance with parse()');
    }

    const inputText = parser.lexer && typeof parser.lexer.input === 'string'
      ? parser.lexer.input
      : '';

    try {
      return parser.parse();
    } catch (err) {
      const message = err && err.message ? err.message : String(err);
      const offset = extractOffsetFromError(err, parser);
      if (offset === null || inputText.length === 0) {
        throw new Error(`Parse failed for ${inputLabel}: ${message}`);
      }

      const loc = offsetToLineColumn(inputText, offset);
      throw new Error(
        `Parse failed for ${inputLabel}: ${message} at line ${loc.line}, column ${loc.column} (offset ${loc.offset})`
      );
    }
  }

  checkpoint() {
    return {
      stackLen: this.stack.length,
      stackChildLens: this.stack.map((node) => (Array.isArray(node.children) ? node.children.length : 0)),
      root: this.root
    };
  }

  restore(mark) {
    if (!mark) return;

    const targetLen = Number.isFinite(mark.stackLen) ? mark.stackLen : 0;
    const childLens = Array.isArray(mark.stackChildLens) ? mark.stackChildLens : [];

    // Remove speculative nodes created after checkpoint.
    if (this.stack.length > targetLen) {
      this.stack.length = targetLen;
    }

    // Truncate children appended during speculative parses.
    for (let i = 0; i < this.stack.length; i += 1) {
      const node = this.stack[i];
      if (!node || !Array.isArray(node.children)) continue;
      const keep = Number.isFinite(childLens[i]) ? childLens[i] : node.children.length;
      if (node.children.length > keep) {
        node.children.length = keep;
      }
    }

    this.root = mark.root || null;
  }

  startNonterminal(name) {
    this.stack.push({ kind: 'nonterminal', name, children: [] });
  }

  terminal(expectedType, tokenValue) {
    if (this.stack.length === 0) return;
    const parent = this.stack[this.stack.length - 1];
    parent.children.push({
      kind: 'terminal',
      token: expectedType,
      value: tokenValue
    });
  }

  endNonterminal() {
    const node = this.stack.pop();
    if (!node) return;

    if (this.stack.length === 0) {
      this.root = node;
    } else {
      this.stack[this.stack.length - 1].children.push(node);
    }
  }

  abortNonterminal() {
    this.stack.pop();
  }

  toJSON(space = 2) {
    return JSON.stringify(this.root, null, space);
  }

  toXml(options = {}) {
    if (!this.root) {
      throw new Error('No parse tree was collected from parser events');
    }

    const includeDeclaration = options.includeDeclaration !== false;
    const xmlBody = serializeNodeAsXml(this.root);
    return includeDeclaration
      ? `<?xml version="1.0" encoding="UTF-8"?>${xmlBody}`
      : xmlBody;
  }
}

function offsetToLineColumn(text, offset) {
  const safeOffset = Math.max(0, Math.min(Number(offset) || 0, text.length));
  let line = 1;
  let column = 1;

  for (let i = 0; i < safeOffset; i++) {
    const ch = text[i];
    if (ch === '\r') {
      if (text[i + 1] === '\n') {
        i++;
      }
      line++;
      column = 1;
    } else if (ch === '\n') {
      line++;
      column = 1;
    } else {
      column++;
    }
  }

  return { line, column, offset: safeOffset };
}

function extractOffsetFromError(err, parser) {
  if (parser && Array.isArray(parser.tokens) && Number.isInteger(parser.position)) {
    const token = parser.tokens[parser.position] || null;
    if (token && Number.isInteger(token.start)) {
      return token.start;
    }
  }

  const message = err && err.message ? String(err.message) : '';
  const match = message.match(/\b(?:position|offset)\s+(\d+)\b/i);
  if (match) {
    return Number(match[1]);
  }

  return null;
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function terminalElementName(tokenType) {
  if (tokenType === 'EOF') return 'EOF';
  return tokenType.startsWith('TOKEN_') ? 'TOKEN' : tokenType;
}

function serializeNodeAsXml(node) {
  if (!node) return '';

  if (node.kind === 'terminal') {
    const elementName = terminalElementName(node.token);
    if (node.token === 'EOF') {
      return `<${elementName}/>`;
    }
    return `<${elementName}>${xmlEscape(node.value)}</${elementName}>`;
  }

  const children = Array.isArray(node.children) ? node.children : [];
  if (children.length === 0) {
    return `<${node.name}/>`;
  }

  const inner = children.map((child) => serializeNodeAsXml(child)).join('');
  return `<${node.name}>${inner}</${node.name}>`;
}

function getNodeLabel(node) {
  if (!node) return '(null)';
  if (node.kind === 'terminal') {
    return `${node.token}: ${JSON.stringify(node.value)}`;
  }
  return node.name;
}

function printTree(node, prefix = '', isLast = true, isRoot = true) {
  if (!node) return;

  const branch = isRoot ? '' : isLast ? '└─ ' : '├─ ';
  console.log(prefix + branch + getNodeLabel(node));

  if (!Array.isArray(node.children) || node.children.length === 0) {
    return;
  }

  const childPrefix = isRoot ? '' : prefix + (isLast ? '   ' : '│  ');
  for (let index = 0; index < node.children.length; index++) {
    const child = node.children[index];
    const childIsLast = index === node.children.length - 1;
    printTree(child, childPrefix, childIsLast, false);
  }
}

module.exports = {
  ParseTreeCollector,
  printTree,
  getNodeLabel
};

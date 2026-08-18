class Lexer {
  constructor(input) {
    this.input = input;
    this.position = 0;
    this.tokens = [];
    this.charClassDepth = 0;
    this.templateDepth = 0;
    this.tokenPatterns = [    { type: 'TOKEN__3B_', regex: /^;/ },    { type: 'TOKEN_BEGIN', regex: /^BEGIN/ },    { type: 'TOKEN_DEFERRED', regex: /^DEFERRED/ },    { type: 'TOKEN_IMMEDIATE', regex: /^IMMEDIATE/ },    { type: 'TOKEN_EXCLUSIVE', regex: /^EXCLUSIVE/ },    { type: 'TOKEN_TRANSACTION', regex: /^TRANSACTION/ },    { type: 'TOKEN_COMMIT', regex: /^COMMIT/ },    { type: 'TOKEN_END', regex: /^END/ },    { type: 'TOKEN_ROLLBACK', regex: /^ROLLBACK/ },    { type: 'TOKEN_TO', regex: /^TO/ },    { type: 'TOKEN_SAVEPOINT', regex: /^SAVEPOINT/ },    { type: 'TOKEN_RELEASE', regex: /^RELEASE/ },    { type: 'TOKEN_VACUUM', regex: /^VACUUM/ },    { type: 'TOKEN_INTO', regex: /^INTO/ },    { type: 'TOKEN_PRAGMA', regex: /^PRAGMA/ },    { type: 'TOKEN__3D_', regex: /^=/ },    { type: 'TOKEN__28_', regex: /^\(/ },    { type: 'TOKEN__29_', regex: /^\)/ },    { type: 'TOKEN_ON', regex: /^ON/ },    { type: 'TOKEN_OFF', regex: /^OFF/ },    { type: 'TOKEN_TRUE', regex: /^TRUE/ },    { type: 'TOKEN_FALSE', regex: /^FALSE/ },    { type: 'TOKEN_YES', regex: /^YES/ },    { type: 'TOKEN_NO', regex: /^NO/ },    { type: 'TOKEN_CREATE', regex: /^CREATE/ },    { type: 'TOKEN_UNIQUE', regex: /^UNIQUE/ },    { type: 'TOKEN_INDEX', regex: /^INDEX/ },    { type: 'TOKEN__2C_', regex: /^,/ },    { type: 'TOKEN_WHERE', regex: /^WHERE/ },    { type: 'TOKEN_TEMP', regex: /^TEMP/ },    { type: 'TOKEN_TEMPORARY', regex: /^TEMPORARY/ },    { type: 'TOKEN_TABLE', regex: /^TABLE/ },    { type: 'TOKEN_AS', regex: /^AS/ },    { type: 'TOKEN_CONSTRAINT', regex: /^CONSTRAINT/ },    { type: 'TOKEN_PRIMARY', regex: /^PRIMARY/ },    { type: 'TOKEN_KEY', regex: /^KEY/ },    { type: 'TOKEN_ASC', regex: /^ASC/ },    { type: 'TOKEN_DESC', regex: /^DESC/ },    { type: 'TOKEN_AUTOINCREMENT', regex: /^AUTOINCREMENT/ },    { type: 'TOKEN_NOT', regex: /^NOT/ },    { type: 'TOKEN_NULL', regex: /^NULL/ },    { type: 'TOKEN_CHECK', regex: /^CHECK/ },    { type: 'TOKEN_DEFAULT', regex: /^DEFAULT/ },    { type: 'TOKEN_COLLATE', regex: /^COLLATE/ },    { type: 'TOKEN_WITHOUT', regex: /^WITHOUT/ },    { type: 'TOKEN_ROWID', regex: /^ROWID/ },    { type: 'TOKEN_STRICT', regex: /^STRICT/ },    { type: 'TOKEN_VIEW', regex: /^VIEW/ },    { type: 'TOKEN_TRIGGER', regex: /^TRIGGER/ },    { type: 'TOKEN_BEFORE', regex: /^BEFORE/ },    { type: 'TOKEN_AFTER', regex: /^AFTER/ },    { type: 'TOKEN_INSTEAD', regex: /^INSTEAD/ },    { type: 'TOKEN_OF', regex: /^OF/ },    { type: 'TOKEN_DELETE', regex: /^DELETE/ },    { type: 'TOKEN_INSERT', regex: /^INSERT/ },    { type: 'TOKEN_UPDATE', regex: /^UPDATE/ },    { type: 'TOKEN_FOR', regex: /^FOR/ },    { type: 'TOKEN_EACH', regex: /^EACH/ },    { type: 'TOKEN_ROW', regex: /^ROW/ },    { type: 'TOKEN_WHEN', regex: /^WHEN/ },    { type: 'TOKEN_REPLACE', regex: /^REPLACE/ },    { type: 'TOKEN_OR', regex: /^OR/ },    { type: 'TOKEN_VALUES', regex: /^VALUES/ },    { type: 'TOKEN_CONFLICT', regex: /^CONFLICT/ },    { type: 'TOKEN_DO', regex: /^DO/ },    { type: 'TOKEN_NOTHING', regex: /^NOTHING/ },    { type: 'TOKEN_SET', regex: /^SET/ },    { type: 'TOKEN_FROM', regex: /^FROM/ },    { type: 'TOKEN_ORDER', regex: /^ORDER/ },    { type: 'TOKEN_BY', regex: /^BY/ },    { type: 'TOKEN_LIMIT', regex: /^LIMIT/ },    { type: 'TOKEN_OFFSET', regex: /^OFFSET/ },    { type: 'TOKEN_INDEXED', regex: /^INDEXED/ },    { type: 'TOKEN_RETURNING', regex: /^RETURNING/ },    { type: 'TOKEN_WITH', regex: /^WITH/ },    { type: 'TOKEN_RECURSIVE', regex: /^RECURSIVE/ },    { type: 'TOKEN_SELECT', regex: /^SELECT/ },    { type: 'TOKEN_DISTINCT', regex: /^DISTINCT/ },    { type: 'TOKEN_ALL', regex: /^ALL/ },    { type: 'TOKEN_GROUP', regex: /^GROUP/ },    { type: 'TOKEN_HAVING', regex: /^HAVING/ },    { type: 'TOKEN_UNION', regex: /^UNION/ },    { type: 'TOKEN_INTERSECT', regex: /^INTERSECT/ },    { type: 'TOKEN_EXCEPT', regex: /^EXCEPT/ },    { type: 'TOKEN__2A_', regex: /^\*/ },    { type: 'TOKEN__2E_', regex: /^\./ },    { type: 'TOKEN_LEFT', regex: /^LEFT/ },    { type: 'TOKEN_JOIN', regex: /^JOIN/ },    { type: 'TOKEN_INNER', regex: /^INNER/ },    { type: 'TOKEN_CROSS', regex: /^CROSS/ },    { type: 'TOKEN_USING', regex: /^USING/ },    { type: 'TOKEN_NULLS', regex: /^NULLS/ },    { type: 'TOKEN_FIRST', regex: /^FIRST/ },    { type: 'TOKEN_LAST', regex: /^LAST/ },    { type: 'TOKEN_OVER', regex: /^OVER/ },    { type: 'TOKEN_AND', regex: /^AND/ },    { type: 'TOKEN_BETWEEN', regex: /^BETWEEN/ },    { type: 'TOKEN_IN', regex: /^IN/ },    { type: 'TOKEN_LIKE', regex: /^LIKE/ },    { type: 'TOKEN_ESCAPE', regex: /^ESCAPE/ },    { type: 'TOKEN__3D__3D_', regex: /^==/ },    { type: 'TOKEN__3C__3E_', regex: /^<>/ },    { type: 'TOKEN__21__3D_', regex: /^!=/ },    { type: 'TOKEN__3C_', regex: /^</ },    { type: 'TOKEN__3C__3D_', regex: /^<=/ },    { type: 'TOKEN__3E_', regex: /^>/ },    { type: 'TOKEN__3E__3D_', regex: /^>=/ },    { type: 'TOKEN__2B_', regex: /^\+/ },    { type: 'TOKEN__2D_', regex: /^-/ },    { type: 'TOKEN__2F_', regex: /^\// },    { type: 'TOKEN__25_', regex: /^%/ },    { type: 'TOKEN_RAISE', regex: /^RAISE/ },    { type: 'TOKEN_IGNORE', regex: /^IGNORE/ },    { type: 'TOKEN_ABORT', regex: /^ABORT/ },    { type: 'TOKEN_FAIL', regex: /^FAIL/ },    { type: 'TOKEN_CURRENT_5F_TIME', regex: /^CURRENT_TIME/ },    { type: 'TOKEN_CURRENT_5F_DATE', regex: /^CURRENT_DATE/ },    { type: 'TOKEN_CURRENT_5F_TIMESTAMP', regex: /^CURRENT_TIMESTAMP/ },    { type: 'TOKEN_IF', regex: /^IF/ },    { type: 'TOKEN_EXISTS', regex: /^EXISTS/ },    { type: 'skip', regex: /^(?:(?:(?:[\u0009\u000a\u000d ])+|--(?:(?:\u0009|[\u0020-\ud7ff]|[\ue000-\ufffd]))*(?:(?:\u000a|\u000d|\u000d\u000a))|\/\*(?:(?:(?:[^*])|(?:\*(?:[^/]))))*\*\/))+/, skip: true },    { type: 'Identifier', regex: /^(?:(?:[A-Z]|[a-z]|_|[\u0080-\ud7ff]|[\ue000-\ufffd])(?:(?:(?:[A-Z]|[a-z]|_|[\u0080-\ud7ff]|[\ue000-\ufffd])|[0-9]|\$))*|"(?:(?:""|(?:[^"])))*"|\[(?:[^\]])*\]|`(?:(?:``|(?:[^`])))*`)/ },    { type: 'StringLiteral', regex: /^'(?:(?:''|(?:[^'])))*'/ },    { type: 'BlobLiteral', regex: /^(?:X|x)'(?:[0-9A-Fa-f])*'/ },    { type: 'NumericLiteral', regex: /^(?:0(?:X|x)(?:[0-9A-Fa-f])+|(?:(?:[0-9])+(?:(?:\.(?:[0-9])*))?(?:(?:E|e)(?:(?:\+|-))?(?:[0-9])+)?|\.(?:[0-9])+(?:(?:E|e)(?:(?:\+|-))?(?:[0-9])+)?))/ },    { type: 'BindParameter', regex: /^(?:\?|\?(?:[0-9])+|(?::|@|\$)(?:[A-Z]|[a-z]|_|[\u0080-\ud7ff]|[\ue000-\ufffd])(?:(?:(?:[A-Z]|[a-z]|_|[\u0080-\ud7ff]|[\ue000-\ufffd])|[0-9]|\$))*|\$(?:[A-Z]|[a-z]|_|[\u0080-\ud7ff]|[\ue000-\ufffd])(?:(?:(?:[A-Z]|[a-z]|_|[\u0080-\ud7ff]|[\ue000-\ufffd])|[0-9]|\$))*::(?:[A-Z]|[a-z]|_|[\u0080-\ud7ff]|[\ue000-\ufffd])(?:(?:(?:[A-Z]|[a-z]|_|[\u0080-\ud7ff]|[\ue000-\ufffd])|[0-9]|\$))*(?:(?:\((?:[^)])*\)))?)/ },    ];
  }

  isTemplateSpanPattern(pos, kind) {
    // Deterministic scan to avoid regex escaping issues in generated code.
    if (this.input[pos] !== '}') return false;
    const BACKTICK = String.fromCharCode(96);
    const max = Math.min(this.input.length, pos + 256);
    let i = pos + 1;
    while (i < max) {
      const ch = this.input[i];
      const next = this.input[i + 1];

      if (ch === '\\') {
        i += 2;
        continue;
      }

      if (ch === '$' && next === '{') {
        return kind === 'TemplateMiddle';
      }

      if (ch === BACKTICK) {
        return kind === 'TemplateTail';
      }

      i++;
    }
    return false;
  }

  enterTemplateSpan() {
    this.templateDepth++;
  }

  exitTemplateSpan() {
    if (this.templateDepth > 0) {
      this.templateDepth--;
    }
  }
  
  tokenize() {
    while (this.position < this.input.length) {
      let bestPattern = null;
      let bestMatch = null;
      const candidates = [];

      const isGenericNameType = (type) => (
        type === 'Name' || type === 'NameChar' || type === 'NameStartChar'
      );

      for (const pattern of this.tokenPatterns) {
        // Template middle/tail tokens are context-sensitive and must only
        // be considered while lexing inside an active template expression.
        if ((pattern.type === 'TemplateMiddle' || pattern.type === 'TemplateTail') && this.templateDepth === 0) {
          continue;
        }

        const regex = pattern.regex;
        const match = this.input.substring(this.position).match(regex);

        if (match && match.index === 0 && match[0].length > 0) {
          let effectivePattern = pattern;
          // When parsing template expressions, disambiguate closing brace as template span boundary.
          if (this.templateDepth > 0 && pattern.type === 'TOKEN__7D_') {
            if (this.isTemplateSpanPattern(this.position, 'TemplateMiddle')) {
              effectivePattern = { ...pattern, type: 'TemplateMiddle' };
            } else if (this.isTemplateSpanPattern(this.position, 'TemplateTail')) {
              effectivePattern = { ...pattern, type: 'TemplateTail' };
            }
          }

          candidates.push({ pattern: effectivePattern, match });
          if (!bestMatch
              || match[0].length > bestMatch[0].length
              || (match[0].length === bestMatch[0].length && effectivePattern.skip && !bestPattern.skip)
              || (match[0].length === bestMatch[0].length
                  && bestPattern
                  && isGenericNameType(bestPattern.type)
                  && !isGenericNameType(effectivePattern.type))) {
            bestPattern = effectivePattern;
            bestMatch = match;
          }
        }
      }

      // Inside character classes, prefer Char/CharCode/CharRange-like tokens
      // over generic global terminals such as '?>' that can overmatch.
      if (this.charClassDepth > 0 && candidates.length > 0) {
        const preferredTypes = new Set(['CharCodeRange', 'CharRange', 'CharCode', 'Char', 'TOKEN__5D_']);
        const preferred = candidates.filter(c => preferredTypes.has(c.pattern.type));
        if (preferred.length > 0) {
          let localBest = preferred[0];
          for (const c of preferred) {
            if (c.match[0].length > localBest.match[0].length) {
              localBest = c;
            }
          }
          bestPattern = localBest.pattern;
          bestMatch = localBest.match;
        }
      }

      // If current input starts with whitespace and a skip token is available,
      // prefer skipping whitespace first instead of consuming it as grammar data.
      if (candidates.length > 0 && /^\s/.test(this.input.substring(this.position, this.position + 1))) {
        const skipCandidates = candidates.filter(c => c.pattern.skip);
        if (skipCandidates.length > 0) {
          let localBest = skipCandidates[0];
          for (const c of skipCandidates) {
            if (c.match[0].length > localBest.match[0].length) {
              localBest = c;
            }
          }
          bestPattern = localBest.pattern;
          bestMatch = localBest.match;
        }
      }

      if (!bestMatch) {
        throw new Error(`Unexpected character at position ${this.position}: '${this.input[this.position]}'`);
      }

      if (!bestPattern.skip) {
        const matchedToken = {
          type: bestPattern.type,
          value: bestMatch[0],
          start: this.position,
          end: this.position + bestMatch[0].length
        };
        this.tokens.push(matchedToken);

        if (bestPattern.type === 'TOKEN__5B_' || bestPattern.type === 'TOKEN__5B__5E_') {
          this.charClassDepth++;
        } else if (bestPattern.type === 'TOKEN__5D_' && this.charClassDepth > 0) {
          this.charClassDepth--;
        } else if (bestPattern.type === 'TemplateHead') {
          this.enterTemplateSpan();
        } else if (bestPattern.type === 'TemplateTail') {
          this.exitTemplateSpan();
        }
      }

      this.position += bestMatch[0].length;
    }
    
    // Add EOF token
    this.tokens.push({
      type: 'EOF',
      value: '',
      start: this.position,
      end: this.position
    });
    
    return this.tokens;
  }
}

class Parser {
  constructor(input, eventHandler = null) {
    this.lexer = new Lexer(input);
    this.tokens = this.lexer.tokenize();
    this.position = 0;
    this.errors = [];
    this.eventHandler = eventHandler;
  }
  
  peek() {
    return this.tokens[this.position];
  }
  
  consume(expectedType) {
    const token = this.peek();
    if (!token || token.type !== expectedType) {
      this.errors.push({
        expected: expectedType,
        found: token ? token.type : 'EOF',
        position: this.position
      });
      throw new Error(`Expected '${expectedType}', got '${token ? token.type : 'EOF'}'`);
    }
    if (this.eventHandler && typeof this.eventHandler.terminal === 'function') {
      this.eventHandler.terminal(expectedType, token.value, this.position);
    }
    this.position++;
    return token;
  }
  
  match(expectedType) {
    const token = this.peek();
    if (token && token.type === expectedType) {
      this.position++;
      return true;
    }
    return false;
  }

  markEventState() {
    if (this.eventHandler && typeof this.eventHandler.checkpoint === 'function') {
      return this.eventHandler.checkpoint();
    }
    return null;
  }

  restoreEventState(mark) {
    if (mark !== null && this.eventHandler && typeof this.eventHandler.restore === 'function') {
      this.eventHandler.restore(mark);
    }
  }
  
  getErrorMessage() {
    if (this.errors.length === 0) return 'No errors';
    const err = this.errors[0];
    return `Syntax error: expected ${err.expected}, got ${err.found}`;
  }
  parse() {
    const result = this.parseSqlScript();
    const next = this.peek();
    if (!next && this.position === this.tokens.length) {
      return result;
    }
    if (!next || next.type !== 'EOF') {
      throw new Error(`Unexpected token at end: ${next ? next.type : 'EOF(consumed)'}`);
    }
    return result;
  }
  parseSqlScript() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('SqlScript', this.position);
    }
    let __ok = false;
    try {
    while (this.match('TOKEN__3B_')) { /* zero or more matched */ }
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.parseSqlStatement();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__3B_');
    while (this.match('TOKEN__3B_')) { /* zero or more matched */ }
    this.parseSqlStatement();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
    while (this.match('TOKEN__3B_')) { /* zero or more matched */ }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    this.consume('EOF');

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('SqlScript', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('SqlScript', this.position);
        }
      }
    }
  }
  parseSqlStatement() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('SqlStatement', this.position);
    }
    let __ok = false;
    try {
    // Optional: try parsing ExplainPrefix
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseExplainPrefix();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseBeginStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseCommitStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseCreateIndexStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseCreateTableStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseCreateTriggerStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseCreateViewStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseDeleteStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseInsertStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parsePragmaStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseReleaseStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseRollbackStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseSavepointStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseSelectStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseUpdateStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseVacuumStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('SqlStatement', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('SqlStatement', this.position);
        }
      }
    }
  }
  parseBeginStmt() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('BeginStmt', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN_BEGIN');
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_DEFERRED');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_IMMEDIATE');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_EXCLUSIVE');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    if (this.match('TOKEN_TRANSACTION')) { /* optional matched */ }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('BeginStmt', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('BeginStmt', this.position);
        }
      }
    }
  }
  parseCommitStmt() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('CommitStmt', this.position);
    }
    let __ok = false;
    try {
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_COMMIT');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_END');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }
    if (this.match('TOKEN_TRANSACTION')) { /* optional matched */ }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('CommitStmt', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('CommitStmt', this.position);
        }
      }
    }
  }
  parseRollbackStmt() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('RollbackStmt', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN_ROLLBACK');
    if (this.match('TOKEN_TRANSACTION')) { /* optional matched */ }
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('TOKEN_TO');
    if (this.match('TOKEN_SAVEPOINT')) { /* optional matched */ }
    this.parseSavepointName();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('RollbackStmt', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('RollbackStmt', this.position);
        }
      }
    }
  }
  parseSavepointStmt() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('SavepointStmt', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN_SAVEPOINT');
    this.parseSavepointName();

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('SavepointStmt', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('SavepointStmt', this.position);
        }
      }
    }
  }
  parseReleaseStmt() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ReleaseStmt', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN_RELEASE');
    if (this.match('TOKEN_SAVEPOINT')) { /* optional matched */ }
    this.parseSavepointName();

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ReleaseStmt', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ReleaseStmt', this.position);
        }
      }
    }
  }
  parseVacuumStmt() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('VacuumStmt', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN_VACUUM');
    // Optional: try parsing SchemaName
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseSchemaName();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('TOKEN_INTO');
    this.parseFilename();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('VacuumStmt', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('VacuumStmt', this.position);
        }
      }
    }
  }
  parsePragmaStmt() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('PragmaStmt', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN_PRAGMA');
    // Optional: try parsing SchemaQualifier
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseSchemaQualifier();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parsePragmaName();
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN__3D_');
    this.parsePragmaValue();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN__28_');
    this.parsePragmaValue();
    this.consume('TOKEN__29_');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('PragmaStmt', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('PragmaStmt', this.position);
        }
      }
    }
  }
  parsePragmaValue() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('PragmaValue', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseSignedNumber();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseName();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('StringLiteral');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_ON');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_OFF');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_TRUE');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_FALSE');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_YES');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_NO');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 9 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('PragmaValue', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('PragmaValue', this.position);
        }
      }
    }
  }
  parseCreateIndexStmt() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('CreateIndexStmt', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN_CREATE');
    if (this.match('TOKEN_UNIQUE')) { /* optional matched */ }
    this.consume('TOKEN_INDEX');
    // Optional: try parsing IfNotExists
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseIfNotExists();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    // Optional: try parsing SchemaQualifier
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseSchemaQualifier();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parseIndexName();
    this.consume('TOKEN_ON');
    this.parseTableName();
    this.consume('TOKEN__28_');
    this.parseIndexedColumn();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseIndexedColumn();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
    this.consume('TOKEN__29_');
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('TOKEN_WHERE');
    this.parseExpr();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('CreateIndexStmt', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('CreateIndexStmt', this.position);
        }
      }
    }
  }
  parseCreateTableStmt() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('CreateTableStmt', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN_CREATE');
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_TEMP');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_TEMPORARY');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    this.consume('TOKEN_TABLE');
    // Optional: try parsing IfNotExists
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseIfNotExists();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    // Optional: try parsing SchemaQualifier
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseSchemaQualifier();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parseTableName();
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN__28_');
    this.parseColumnDef();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseColumnDef();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
    this.consume('TOKEN__29_');
    // Optional: try parsing TableOptions
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseTableOptions();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_AS');
    this.parseSelectStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('CreateTableStmt', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('CreateTableStmt', this.position);
        }
      }
    }
  }
  parseColumnDef() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ColumnDef', this.position);
    }
    let __ok = false;
    try {
    this.parseColumnName();
    // Optional: try parsing TypeName
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseTypeName();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseColumnConstraint();
        if (this.position === savePos) break;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ColumnDef', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ColumnDef', this.position);
        }
      }
    }
  }
  parseTypeName() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('TypeName', this.position);
    }
    let __ok = false;
    try {
    let count = 0;
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseName();
        if (this.position === savePos) break;
        count++;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }
    if (count === 0) {
      throw new Error('Expected at least one Name');
    }
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.parseSignedNumber();
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseSignedNumber();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    this.consume('TOKEN__29_');
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('TypeName', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('TypeName', this.position);
        }
      }
    }
  }
  parseColumnConstraint() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ColumnConstraint', this.position);
    }
    let __ok = false;
    try {
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('TOKEN_CONSTRAINT');
    this.parseConstraintName();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_PRIMARY');
    this.consume('TOKEN_KEY');
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_ASC');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_DESC');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    if (this.match('TOKEN_AUTOINCREMENT')) { /* optional matched */ }
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_NOT');
    this.consume('TOKEN_NULL');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_UNIQUE');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_CHECK');
    this.consume('TOKEN__28_');
    this.parseExpr();
    this.consume('TOKEN__29_');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_DEFAULT');
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseSignedNumber();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseLiteralValue();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN__28_');
    this.parseExpr();
    this.consume('TOKEN__29_');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_COLLATE');
    this.parseCollationName();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ColumnConstraint', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ColumnConstraint', this.position);
        }
      }
    }
  }
  parseTableOptions() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('TableOptions', this.position);
    }
    let __ok = false;
    try {
    this.parseTableOption();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseTableOption();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('TableOptions', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('TableOptions', this.position);
        }
      }
    }
  }
  parseTableOption() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('TableOption', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_WITHOUT');
    this.consume('TOKEN_ROWID');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_STRICT');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 2 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('TableOption', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('TableOption', this.position);
        }
      }
    }
  }
  parseCreateViewStmt() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('CreateViewStmt', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN_CREATE');
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_TEMP');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_TEMPORARY');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    this.consume('TOKEN_VIEW');
    // Optional: try parsing IfNotExists
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseIfNotExists();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    // Optional: try parsing SchemaQualifier
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseSchemaQualifier();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parseViewName();
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.parseColumnName();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseColumnName();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
    this.consume('TOKEN__29_');
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    this.consume('TOKEN_AS');
    this.parseSelectStmt();

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('CreateViewStmt', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('CreateViewStmt', this.position);
        }
      }
    }
  }
  parseCreateTriggerStmt() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('CreateTriggerStmt', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN_CREATE');
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_TEMP');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_TEMPORARY');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    this.consume('TOKEN_TRIGGER');
    // Optional: try parsing IfNotExists
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseIfNotExists();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    // Optional: try parsing SchemaQualifier
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseSchemaQualifier();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parseTriggerName();
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_BEFORE');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_AFTER');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_INSTEAD');
    this.consume('TOKEN_OF');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_DELETE');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_INSERT');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_UPDATE');
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('TOKEN_OF');
    this.parseColumnName();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseColumnName();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }
    this.consume('TOKEN_ON');
    this.parseTableName();
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('TOKEN_FOR');
    this.consume('TOKEN_EACH');
    this.consume('TOKEN_ROW');
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('TOKEN_WHEN');
    this.parseExpr();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    this.consume('TOKEN_BEGIN');
    this.parseTriggerStep();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__3B_');
    this.parseTriggerStep();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
    if (this.match('TOKEN__3B_')) { /* optional matched */ }
    this.consume('TOKEN_END');

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('CreateTriggerStmt', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('CreateTriggerStmt', this.position);
        }
      }
    }
  }
  parseTriggerStep() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('TriggerStep', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseUpdateStmt();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseInsertStmt();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseDeleteStmt();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseSelectStmt();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 4 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('TriggerStep', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('TriggerStep', this.position);
        }
      }
    }
  }
  parseInsertStmt() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('InsertStmt', this.position);
    }
    let __ok = false;
    try {
    // Optional: try parsing WithClause
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseWithClause();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_INSERT');
    // Optional: try parsing ConflictModifier
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseConflictModifier();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_REPLACE');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }
    this.consume('TOKEN_INTO');
    // Optional: try parsing SchemaQualifier
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseSchemaQualifier();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parseTableName();
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('TOKEN_AS');
    this.parseTableAlias();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.parseColumnName();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseColumnName();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
    this.consume('TOKEN__29_');
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseDefaultValues();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseValuesClause();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseSelectStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseUpsertClause();
        if (this.position === savePos) break;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }
    // Optional: try parsing ReturningClause
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseReturningClause();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('InsertStmt', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('InsertStmt', this.position);
        }
      }
    }
  }
  parseConflictModifier() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ConflictModifier', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN_OR');
    this.parseConflictAction();

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ConflictModifier', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ConflictModifier', this.position);
        }
      }
    }
  }
  parseDefaultValues() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('DefaultValues', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN_DEFAULT');
    this.consume('TOKEN_VALUES');

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('DefaultValues', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('DefaultValues', this.position);
        }
      }
    }
  }
  parseValuesClause() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ValuesClause', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN_VALUES');
    this.parseParenthesizedExprList();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseParenthesizedExprList();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ValuesClause', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ValuesClause', this.position);
        }
      }
    }
  }
  parseParenthesizedExprList() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ParenthesizedExprList', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN__28_');
    this.parseExpr();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseExpr();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
    this.consume('TOKEN__29_');

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ParenthesizedExprList', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ParenthesizedExprList', this.position);
        }
      }
    }
  }
  parseUpsertClause() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('UpsertClause', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN_ON');
    this.consume('TOKEN_CONFLICT');
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.parseIndexedColumn();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseIndexedColumn();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
    this.consume('TOKEN__29_');
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('TOKEN_WHERE');
    this.parseExpr();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    this.consume('TOKEN_DO');
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_NOTHING');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_UPDATE');
    this.consume('TOKEN_SET');
    this.parseUpdateAssignment();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseUpdateAssignment();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('TOKEN_WHERE');
    this.parseExpr();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('UpsertClause', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('UpsertClause', this.position);
        }
      }
    }
  }
  parseUpdateStmt() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('UpdateStmt', this.position);
    }
    let __ok = false;
    try {
    // Optional: try parsing WithClause
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseWithClause();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.consume('TOKEN_UPDATE');
    // Optional: try parsing ConflictModifier
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseConflictModifier();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parseQualifiedTableName();
    this.consume('TOKEN_SET');
    this.parseUpdateAssignment();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseUpdateAssignment();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
    // Optional: try parsing UpdateFromClause
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseUpdateFromClause();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('TOKEN_WHERE');
    this.parseExpr();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    // Optional: try parsing ReturningClause
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseReturningClause();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('UpdateStmt', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('UpdateStmt', this.position);
        }
      }
    }
  }
  parseUpdateAssignment() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('UpdateAssignment', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseColumnName();
    this.consume('TOKEN__3D_');
    this.parseExpr();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.parseColumnName();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseColumnName();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
    this.consume('TOKEN__29_');
    this.consume('TOKEN__3D_');
    this.parseExpr();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 2 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('UpdateAssignment', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('UpdateAssignment', this.position);
        }
      }
    }
  }
  parseUpdateFromClause() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('UpdateFromClause', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN_FROM');
    this.parseTableOrSubquery();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseTableOrSubquery();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('UpdateFromClause', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('UpdateFromClause', this.position);
        }
      }
    }
  }
  parseDeleteStmt() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('DeleteStmt', this.position);
    }
    let __ok = false;
    try {
    // Optional: try parsing WithClause
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseWithClause();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.consume('TOKEN_DELETE');
    this.consume('TOKEN_FROM');
    this.parseQualifiedTableName();
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('TOKEN_WHERE');
    this.parseExpr();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    // Optional: try parsing ReturningClause
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseReturningClause();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('DeleteStmt', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('DeleteStmt', this.position);
        }
      }
    }
  }
  parseUpdateDeleteLimitClause() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('UpdateDeleteLimitClause', this.position);
    }
    let __ok = false;
    try {
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('TOKEN_ORDER');
    this.consume('TOKEN_BY');
    this.parseOrderingTerm();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseOrderingTerm();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    this.consume('TOKEN_LIMIT');
    this.parseExpr();
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    // Group
    {
    this.consume('TOKEN_OFFSET');
    this.parseExpr();
    }
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    // Group
    {
    this.consume('TOKEN__2C_');
    this.parseExpr();
    }
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('UpdateDeleteLimitClause', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('UpdateDeleteLimitClause', this.position);
        }
      }
    }
  }
  parseQualifiedTableName() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('QualifiedTableName', this.position);
    }
    let __ok = false;
    try {
    // Optional: try parsing SchemaQualifier
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseSchemaQualifier();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parseTableName();
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_INDEXED');
    this.consume('TOKEN_BY');
    this.parseIndexName();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_NOT');
    this.consume('TOKEN_INDEXED');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('QualifiedTableName', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('QualifiedTableName', this.position);
        }
      }
    }
  }
  parseReturningClause() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ReturningClause', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN_RETURNING');
    this.parseResultColumn();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseResultColumn();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ReturningClause', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ReturningClause', this.position);
        }
      }
    }
  }
  parseSelectStmt() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('SelectStmt', this.position);
    }
    let __ok = false;
    try {
    // Optional: try parsing WithClause
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseWithClause();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parseSelectCore();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.parseCompoundOperator();
    this.parseSelectCore();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('TOKEN_ORDER');
    this.consume('TOKEN_BY');
    this.parseOrderingTerm();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseOrderingTerm();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    // Optional: try parsing LimitClause
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseLimitClause();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('SelectStmt', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('SelectStmt', this.position);
        }
      }
    }
  }
  parseWithClause() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('WithClause', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN_WITH');
    if (this.match('TOKEN_RECURSIVE')) { /* optional matched */ }
    this.parseCommonTableExpression();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseCommonTableExpression();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('WithClause', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('WithClause', this.position);
        }
      }
    }
  }
  parseCommonTableExpression() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('CommonTableExpression', this.position);
    }
    let __ok = false;
    try {
    this.parseTableName();
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.parseColumnName();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseColumnName();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
    this.consume('TOKEN__29_');
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    this.consume('TOKEN_AS');
    this.consume('TOKEN__28_');
    this.parseSelectStmt();
    this.consume('TOKEN__29_');

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('CommonTableExpression', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('CommonTableExpression', this.position);
        }
      }
    }
  }
  parseSelectCore() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('SelectCore', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_SELECT');
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_DISTINCT');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_ALL');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    this.parseResultColumn();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseResultColumn();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
    // Optional: try parsing FromClause
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseFromClause();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('TOKEN_WHERE');
    this.parseExpr();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseValuesClause();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 2 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('SelectCore', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('SelectCore', this.position);
        }
      }
    }
  }
  parseFromClause() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('FromClause', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_FROM');
    this.parseTableOrSubquery();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseTableOrSubquery();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_FROM');
    this.parseJoinClause();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 2 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('FromClause', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('FromClause', this.position);
        }
      }
    }
  }
  parseGroupByClause() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('GroupByClause', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN_GROUP');
    this.consume('TOKEN_BY');
    this.parseExpr();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseExpr();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('TOKEN_HAVING');
    this.parseExpr();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('GroupByClause', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('GroupByClause', this.position);
        }
      }
    }
  }
  parseCompoundOperator() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('CompoundOperator', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_UNION');
    if (this.match('TOKEN_ALL')) { /* optional matched */ }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_INTERSECT');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_EXCEPT');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 3 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('CompoundOperator', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('CompoundOperator', this.position);
        }
      }
    }
  }
  parseLimitClause() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('LimitClause', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN_LIMIT');
    this.parseExpr();
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    // Group
    {
    this.consume('TOKEN_OFFSET');
    this.parseExpr();
    }
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    // Group
    {
    this.consume('TOKEN__2C_');
    this.parseExpr();
    }
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('LimitClause', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('LimitClause', this.position);
        }
      }
    }
  }
  parseResultColumn() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ResultColumn', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__2A_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseTableName();
    this.consume('TOKEN__2E_');
    this.consume('TOKEN__2A_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseExpr();
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    if (this.match('TOKEN_AS')) { /* optional matched */ }
    this.parseColumnAlias();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 3 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ResultColumn', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ResultColumn', this.position);
        }
      }
    }
  }
  parseTableOrSubquery() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('TableOrSubquery', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    // Optional: try parsing SchemaQualifier
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseSchemaQualifier();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parseTableName();
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    if (this.match('TOKEN_AS')) { /* optional matched */ }
    this.parseTableAlias();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.parseSelectStmt();
    this.consume('TOKEN__29_');
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    if (this.match('TOKEN_AS')) { /* optional matched */ }
    this.parseTableAlias();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.parseJoinClause();
    this.consume('TOKEN__29_');
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    if (this.match('TOKEN_AS')) { /* optional matched */ }
    this.parseTableAlias();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 3 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('TableOrSubquery', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('TableOrSubquery', this.position);
        }
      }
    }
  }
  parseJoinClause() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('JoinClause', this.position);
    }
    let __ok = false;
    try {
    this.parseTableOrSubquery();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.parseJoinOperator();
    this.parseTableOrSubquery();
    // Optional: try parsing JoinConstraint
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseJoinConstraint();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('JoinClause', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('JoinClause', this.position);
        }
      }
    }
  }
  parseJoinOperator() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('JoinOperator', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_LEFT');
    this.consume('TOKEN_JOIN');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_INNER');
    this.consume('TOKEN_JOIN');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_CROSS');
    this.consume('TOKEN_JOIN');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 4 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('JoinOperator', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('JoinOperator', this.position);
        }
      }
    }
  }
  parseJoinConstraint() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('JoinConstraint', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_ON');
    this.parseExpr();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_USING');
    this.consume('TOKEN__28_');
    this.parseColumnName();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseColumnName();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 2 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('JoinConstraint', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('JoinConstraint', this.position);
        }
      }
    }
  }
  parseOrderingTerm() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('OrderingTerm', this.position);
    }
    let __ok = false;
    try {
    this.parseExpr();
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('TOKEN_COLLATE');
    this.parseCollationName();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_ASC');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_DESC');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('TOKEN_NULLS');
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_FIRST');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_LAST');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('OrderingTerm', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('OrderingTerm', this.position);
        }
      }
    }
  }
  parseIndexedColumn() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('IndexedColumn', this.position);
    }
    let __ok = false;
    try {
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseColumnName();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseExpr();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('TOKEN_COLLATE');
    this.parseCollationName();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_ASC');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_DESC');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('IndexedColumn', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('IndexedColumn', this.position);
        }
      }
    }
  }
  parseWindowDefn() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('WindowDefn', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN__28_');
    this.consume('TOKEN__29_');

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('WindowDefn', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('WindowDefn', this.position);
        }
      }
    }
  }
  parseOverClause() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('OverClause', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN_OVER');
    this.parseWindowDefn();

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('OverClause', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('OverClause', this.position);
        }
      }
    }
  }
  parseExpr() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('Expr', this.position);
    }
    let __ok = false;
    try {
    this.parseOrExpr();

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('Expr', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('Expr', this.position);
        }
      }
    }
  }
  parseOrExpr() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('OrExpr', this.position);
    }
    let __ok = false;
    try {
    this.parseAndExpr();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN_OR');
    this.parseAndExpr();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('OrExpr', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('OrExpr', this.position);
        }
      }
    }
  }
  parseAndExpr() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('AndExpr', this.position);
    }
    let __ok = false;
    try {
    this.parseNotExpr();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN_AND');
    this.parseNotExpr();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('AndExpr', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('AndExpr', this.position);
        }
      }
    }
  }
  parseNotExpr() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('NotExpr', this.position);
    }
    let __ok = false;
    try {
    while (this.match('TOKEN_NOT')) { /* zero or more matched */ }
    this.parseComparisonExpr();

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('NotExpr', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('NotExpr', this.position);
        }
      }
    }
  }
  parseComparisonExpr() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ComparisonExpr', this.position);
    }
    let __ok = false;
    try {
    this.parseBitOrExpr();
    while (true) {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseComparisonTail();
        if (this.position === savePos) break;
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
        break;
      }
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ComparisonExpr', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ComparisonExpr', this.position);
        }
      }
    }
  }
  parseComparisonTail() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ComparisonTail', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseComparisonOperator();
    this.parseBitOrExpr();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_NOT');
    this.consume('TOKEN_NULL');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    if (this.match('TOKEN_NOT')) { /* optional matched */ }
    this.consume('TOKEN_BETWEEN');
    this.parseBitOrExpr();
    this.consume('TOKEN_AND');
    this.parseBitOrExpr();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    if (this.match('TOKEN_NOT')) { /* optional matched */ }
    this.consume('TOKEN_IN');
    this.parseInRhs();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    if (this.match('TOKEN_NOT')) { /* optional matched */ }
    this.consume('TOKEN_LIKE');
    this.parseBitOrExpr();
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
    this.consume('TOKEN_ESCAPE');
    this.parseBitOrExpr();
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 5 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ComparisonTail', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ComparisonTail', this.position);
        }
      }
    }
  }
  parseComparisonOperator() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ComparisonOperator', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__3D_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__3D__3D_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__3C__3E_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__21__3D_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__3C_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__3C__3D_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__3E_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__3E__3D_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 8 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ComparisonOperator', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ComparisonOperator', this.position);
        }
      }
    }
  }
  parseInRhs() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('InRhs', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseSelectStmt();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.parseExpr();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseExpr();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    // Optional: try parsing SchemaQualifier
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseSchemaQualifier();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parseTableName();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    // Optional: try parsing SchemaQualifier
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseSchemaQualifier();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parseTableFunctionName();
    this.consume('TOKEN__28_');
    // Optional: try parsing FunctionArguments
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseFunctionArguments();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 3 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('InRhs', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('InRhs', this.position);
        }
      }
    }
  }
  parseBitOrExpr() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('BitOrExpr', this.position);
    }
    let __ok = false;
    try {
    this.parseAddExpr();

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('BitOrExpr', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('BitOrExpr', this.position);
        }
      }
    }
  }
  parseAddExpr() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('AddExpr', this.position);
    }
    let __ok = false;
    try {
    this.parseMultiplyExpr();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN__2B_');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN__2D_');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }
    this.parseMultiplyExpr();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('AddExpr', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('AddExpr', this.position);
        }
      }
    }
  }
  parseMultiplyExpr() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('MultiplyExpr', this.position);
    }
    let __ok = false;
    try {
    this.parseUnaryExpr();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN__2A_');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN__2F_');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN__25_');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }
    this.parseUnaryExpr();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('MultiplyExpr', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('MultiplyExpr', this.position);
        }
      }
    }
  }
  parseUnaryExpr() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('UnaryExpr', this.position);
    }
    let __ok = false;
    try {
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN__2B_');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN__2D_');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
    this.parsePrimaryExpr();

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('UnaryExpr', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('UnaryExpr', this.position);
        }
      }
    }
  }
  parsePrimaryExpr() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('PrimaryExpr', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseLiteralValue();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('BindParameter');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseFunctionInvocation();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseQualifiedColumnRef();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseCastExpr();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseCaseExpr();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseExistsExpr();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseRaiseFunction();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.parseExpr();
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__28_');
    this.parseSelectStmt();
    this.consume('TOKEN__29_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 10 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('PrimaryExpr', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('PrimaryExpr', this.position);
        }
      }
    }
  }
  parseQualifiedColumnRef() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('QualifiedColumnRef', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseSchemaName();
    this.consume('TOKEN__2E_');
    this.parseTableName();
    this.consume('TOKEN__2E_');
    this.parseColumnName();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseTableName();
    this.consume('TOKEN__2E_');
    this.parseColumnName();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseColumnName();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 3 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('QualifiedColumnRef', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('QualifiedColumnRef', this.position);
        }
      }
    }
  }
  parseFunctionInvocation() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('FunctionInvocation', this.position);
    }
    let __ok = false;
    try {
    this.parseFunctionName();
    this.consume('TOKEN__28_');
    // Optional: try parsing FunctionArguments
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseFunctionArguments();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.consume('TOKEN__29_');
    // Optional: try parsing OverClause
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseOverClause();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('FunctionInvocation', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('FunctionInvocation', this.position);
        }
      }
    }
  }
  parseFunctionArguments() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('FunctionArguments', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN__2A_');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_DISTINCT');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_ALL');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    this.parseExpr();
    // Group *
    while (true) {
      const _loopStart = this.position;
      const _loopMark = this.markEventState();
      try {
    this.consume('TOKEN__2C_');
    this.parseExpr();
      } catch (e) {
        this.position = _loopStart;
        this.restoreEventState(_loopMark);
        break;
      }
      if (this.position === _loopStart) break;
    }
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 2 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('FunctionArguments', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('FunctionArguments', this.position);
        }
      }
    }
  }
  parseRaiseFunction() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('RaiseFunction', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN_RAISE');
    this.consume('TOKEN__28_');
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_IGNORE');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    // Group
    {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_ROLLBACK');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_ABORT');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN_FAIL');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }
    this.consume('TOKEN__2C_');
    this.parseExpr();
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
    }
    this.consume('TOKEN__29_');

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('RaiseFunction', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('RaiseFunction', this.position);
        }
      }
    }
  }
  parseLiteralValue() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('LiteralValue', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('NumericLiteral');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('StringLiteral');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('BlobLiteral');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_NULL');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_TRUE');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_FALSE');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_CURRENT_5F_TIME');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_CURRENT_5F_DATE');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('TOKEN_CURRENT_5F_TIMESTAMP');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 9 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('LiteralValue', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('LiteralValue', this.position);
        }
      }
    }
  }
  parseSignedNumber() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('SignedNumber', this.position);
    }
    let __ok = false;
    try {
    // Group ?
    {
      const _optStart = this.position;
      const _optMark = this.markEventState();
      try {
      let _matchedAlt = false;
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN__2B_');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) {
        const _altStart = this.position;
        const _altMark = this.markEventState();
        try {
    this.consume('TOKEN__2D_');
          _matchedAlt = true;
        } catch (e) {
          this.position = _altStart;
          this.restoreEventState(_altMark);
        }
      }
      if (!_matchedAlt) { throw new Error('No group alternative matched'); }
      } catch (e) {
        this.position = _optStart;
        this.restoreEventState(_optMark);
      }
    }
    this.consume('NumericLiteral');

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('SignedNumber', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('SignedNumber', this.position);
        }
      }
    }
  }
  parseSchemaQualifier() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('SchemaQualifier', this.position);
    }
    let __ok = false;
    try {
    this.parseSchemaName();
    this.consume('TOKEN__2E_');

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('SchemaQualifier', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('SchemaQualifier', this.position);
        }
      }
    }
  }
  parseQualifiedTableRef() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('QualifiedTableRef', this.position);
    }
    let __ok = false;
    try {
    // Optional: try parsing SchemaQualifier
    {
      const savePos = this.position;
      const saveMark = this.markEventState();
      try {
        this.parseSchemaQualifier();
      } catch(e) {
        this.position = savePos;
        this.restoreEventState(saveMark);
      }
    }
    this.parseTableName();

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('QualifiedTableRef', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('QualifiedTableRef', this.position);
        }
      }
    }
  }
  parseIfExists() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('IfExists', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN_IF');
    this.consume('TOKEN_EXISTS');

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('IfExists', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('IfExists', this.position);
        }
      }
    }
  }
  parseIfNotExists() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('IfNotExists', this.position);
    }
    let __ok = false;
    try {
    this.consume('TOKEN_IF');
    this.consume('TOKEN_NOT');
    this.consume('TOKEN_EXISTS');

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('IfNotExists', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('IfNotExists', this.position);
        }
      }
    }
  }
  parseName() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('Name', this.position);
    }
    let __ok = false;
    try {
    this.consume('Identifier');

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('Name', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('Name', this.position);
        }
      }
    }
  }
  parseSchemaName() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('SchemaName', this.position);
    }
    let __ok = false;
    try {
    this.parseName();

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('SchemaName', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('SchemaName', this.position);
        }
      }
    }
  }
  parseTableName() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('TableName', this.position);
    }
    let __ok = false;
    try {
    this.parseName();

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('TableName', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('TableName', this.position);
        }
      }
    }
  }
  parseTableOrIndexName() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('TableOrIndexName', this.position);
    }
    let __ok = false;
    try {
    this.parseName();

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('TableOrIndexName', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('TableOrIndexName', this.position);
        }
      }
    }
  }
  parseIndexName() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('IndexName', this.position);
    }
    let __ok = false;
    try {
    this.parseName();

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('IndexName', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('IndexName', this.position);
        }
      }
    }
  }
  parseViewName() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ViewName', this.position);
    }
    let __ok = false;
    try {
    this.parseName();

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ViewName', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ViewName', this.position);
        }
      }
    }
  }
  parseTriggerName() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('TriggerName', this.position);
    }
    let __ok = false;
    try {
    this.parseName();

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('TriggerName', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('TriggerName', this.position);
        }
      }
    }
  }
  parseColumnName() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ColumnName', this.position);
    }
    let __ok = false;
    try {
    this.parseName();

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ColumnName', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ColumnName', this.position);
        }
      }
    }
  }
  parseColumnAlias() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ColumnAlias', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseName();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('StringLiteral');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 2 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ColumnAlias', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ColumnAlias', this.position);
        }
      }
    }
  }
  parseTableAlias() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('TableAlias', this.position);
    }
    let __ok = false;
    try {
    this.parseName();

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('TableAlias', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('TableAlias', this.position);
        }
      }
    }
  }
  parseConstraintName() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ConstraintName', this.position);
    }
    let __ok = false;
    try {
    this.parseName();

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ConstraintName', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ConstraintName', this.position);
        }
      }
    }
  }
  parseCollationName() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('CollationName', this.position);
    }
    let __ok = false;
    try {
    this.parseName();

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('CollationName', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('CollationName', this.position);
        }
      }
    }
  }
  parseForeignTable() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ForeignTable', this.position);
    }
    let __ok = false;
    try {
    this.parseName();

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ForeignTable', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ForeignTable', this.position);
        }
      }
    }
  }
  parseSavepointName() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('SavepointName', this.position);
    }
    let __ok = false;
    try {
    this.parseName();

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('SavepointName', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('SavepointName', this.position);
        }
      }
    }
  }
  parsePragmaName() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('PragmaName', this.position);
    }
    let __ok = false;
    try {
    this.parseName();

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('PragmaName', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('PragmaName', this.position);
        }
      }
    }
  }
  parseModuleName() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('ModuleName', this.position);
    }
    let __ok = false;
    try {
    this.parseName();

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('ModuleName', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('ModuleName', this.position);
        }
      }
    }
  }
  parseTableFunctionName() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('TableFunctionName', this.position);
    }
    let __ok = false;
    try {
    this.parseName();

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('TableFunctionName', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('TableFunctionName', this.position);
        }
      }
    }
  }
  parseFunctionName() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('FunctionName', this.position);
    }
    let __ok = false;
    try {
    this.parseName();

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('FunctionName', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('FunctionName', this.position);
        }
      }
    }
  }
  parseWindowName() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('WindowName', this.position);
    }
    let __ok = false;
    try {
    this.parseName();

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('WindowName', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('WindowName', this.position);
        }
      }
    }
  }
  parseBaseWindowName() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('BaseWindowName', this.position);
    }
    let __ok = false;
    try {
    this.parseName();

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('BaseWindowName', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('BaseWindowName', this.position);
        }
      }
    }
  }
  parseFilename() {
    if (this.eventHandler && typeof this.eventHandler.startNonterminal === 'function') {
      this.eventHandler.startNonterminal('Filename', this.position);
    }
    let __ok = false;
    try {
    const _ruleStart = this.position;
    let _matched = false;
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.consume('StringLiteral');
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      const _ruleMark = this.markEventState();
      try {
    this.parseName();
        _matched = true;
      } catch (e) {
        this.position = _ruleStart;
        this.restoreEventState(_ruleMark);
      }
    }
    if (!_matched) {
      throw new Error(`Expected one of: 2 alternatives`);
    }

      __ok = true;
    } finally {
      if (this.eventHandler) {
        if (__ok && typeof this.eventHandler.endNonterminal === 'function') {
          this.eventHandler.endNonterminal('Filename', this.position);
        }
        if (!__ok && typeof this.eventHandler.abortNonterminal === 'function') {
          this.eventHandler.abortNonterminal('Filename', this.position);
        }
      }
    }
  }
}

module.exports = Parser;
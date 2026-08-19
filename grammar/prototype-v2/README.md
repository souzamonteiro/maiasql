# MaiaSQL EBNF v3 — case-insensitive KW_* tokens

This is the complete experimental grammar for the current MaiaCC/tREx.

## Keyword strategy

Syntax rules use names such as:

```ebnf
SelectCore ::= KW_SELECT ResultColumn FromClause?
```

The lexical section defines:

```ebnf
KW_SELECT ::= [sS] [eE] [lL] [eE] [cC] [tT]
KW_FROM   ::= [fF] [rR] [oO] [mM]
```

This accepts uppercase, lowercase and mixed-case keywords without changing
the tREx implementation.

## Critical lexer expectations

1. The lexer must use longest match.
2. For equal-length matches, a `KW_*` token declared before `Identifier`
   must win.
3. Therefore `select` becomes `KW_SELECT`, while `selector` remains
   `Identifier`.

## Included tests

- `positive-tests.sql`: broad SQLite/WebSQL syntax coverage.
- `negative-tests.sql`: invalid forms expected to fail.
- `lexer-tests.sql`: case-insensitivity and keyword/identifier boundaries.
- `precedence-tests.sql`: operator hierarchy and associativity.
- `static-check.json`: structural and self-hosted parser validation.

## Statistics

- 189 case-insensitive keyword tokens.
- No global `[A-Z] == [a-z]` directive.
- No uppercase/lowercase duplication in syntax productions.

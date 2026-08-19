# MaiaSQL complete SQLite/WebSQL grammar for MaiaCC/tREx

This grammar is designed for the current self-hosted tREx without modifying it.

## Compatibility decisions

- SQL keywords are uppercase only.
- Identifiers may use uppercase or lowercase characters.
- Names that coincide with keywords must be quoted.
- No `[A-Z] == [a-z]` equivalence directive is used.
- No `KW_*` lexical layer is used.
- No direct left recursion is used.
- Alternatives with shared prefixes are ordered from the most specific form to
  the most general form.
- The script separator avoids terminal `+`, because the current generated code
  for a repeated terminal does not consume the first occurrence correctly.

## Important corrected decisions

- `FunctionInvocation` precedes `QualifiedColumnRef`.
- Three-part and two-part column references precede simple columns.
- Table-valued functions precede ordinary table references.
- `SqlScript` requires a real semicolon between statements.
- `Name` accepts only `Identifier`, preventing type names from consuming
  following SQL constraint keywords.
- Full expression precedence includes concatenation, JSON extraction, bitwise
  operators, shifts, arithmetic, comparisons, boolean logic and COLLATE.

## Files

- `SQL.ebnf`: complete grammar.
- `smoke-tests.sql`: broad statement tests.
- `focused-tests.sql`: ambiguity and expression tests.
- `static-check.json`: structural validation report.

## Scope

The grammar recognizes a broad SQLite syntax, including constructs that may be
reported as unsupported later by the IndexedDB execution backend. Parsing and
execution support are intentionally separate concerns.

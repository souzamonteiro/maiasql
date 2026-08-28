# Changelog

All notable changes to MaiaSQL will be documented in this file.

The project follows a practical public-preview release style while the SQL runtime matures. Compatibility notes are intentionally explicit so users can distinguish supported behavior from known limitations.

## 1.2.0 - 2026-08-28

### Added

- Public English manual at `docs/MANUAL.md` with supported SQL commands, examples, validation commands, and known limitations.
- Browser admin app for local-first database exploration and query execution.
- Admin schema tree with table nodes, column metadata, data type badges, and compact constraint indicators.
- Browser parser path resolver for root and nested hosting layouts.
- Optional IndexedDB implementation path for Node-based runtime validation while keeping the memory backend available.
- Runtime support and tests for:
  - `INSERT ... DEFAULT VALUES` with `RETURNING`;
  - derived tables in `FROM` and `JOIN` clauses;
  - nested CTEs and recursive CTE expansion;
  - `NULLS FIRST` / `NULLS LAST` ordering;
  - aliased `UPDATE ... FROM` and `DELETE ... USING`;
  - `ANY` and `ALL` quantified subqueries;
  - compound selects with `UNION`, `UNION ALL`, `INTERSECT`, and `EXCEPT`;
  - `PRAGMA table_info`, `index_list`, `index_info`, and `foreign_key_list`.

### Changed

- README positioning now describes MaiaSQL as a SQLite-inspired browser-native SQL runtime rather than a complete SQLite replacement.
- Parser regeneration is documented as a slow, explicit validation path instead of the default development gate.
- Package contents now include the public manual, changelog, and browser admin app assets.

### Fixed

- Corrected `NOT IN` and `NOT LIKE` predicate behavior.
- Corrected SQL precedence around `NOT`, `BETWEEN`, and `IS NULL`.
- Corrected `CHECK` and `UNIQUE` NULL semantics:
  - `CHECK` accepts unknown/NULL results and rejects only `false`;
  - `UNIQUE` allows multiple `NULL` values.
- Kept index metadata consistent after `ALTER TABLE ... RENAME COLUMN`.
- Fixed browser admin database switching/schema refresh behavior.
- Hardened browser parser loading for multiple URL layouts.

### Known Limitations

- MaiaSQL is not a drop-in SQLite replacement.
- SQLite binary file compatibility and SQLite C ABI compatibility are not supported.
- `ALTER TABLE ... DROP COLUMN` is not supported.
- `ON CONFLICT (...) DO UPDATE` is not documented as supported.
- Query planning and physical index acceleration are still limited.
- SQL function coverage is partial.
- Recursive CTEs and advanced subquery cases should still be treated as preview-level behavior.
- The browser admin app is a local-first playground, not yet a full database administration suite.

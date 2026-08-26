# MaiaSQL TODO

## Status summary

MaiaSQL already has a working prototype runtime, a browser demo, and a WebSQL compatibility layer. The project is usable for browser-native experimentation and local app data storage, and the core interpreter is now passing the runtime suite with the latest `NOT IN` / `NOT LIKE` regression fixed.

Current state after the latest runtime pass:

- the runtime suite passes with 22/22 checks under `node --test interpreter/tests/runtime-engine.test.js`
- the `NOT IN` / `NOT LIKE` predicate regression has been fixed in the runtime comparator without changing the generated parser or MaiaCC grammar artifacts
- the browser admin shell is now working as a local-first SQL playground with database switching, schema refresh, syntax highlighting, autocomplete, recent queries, saved queries, schema-tree column insertion, and CSV export
- the parser regeneration pipeline is still treated as a slow/optional validation path instead of a default failure condition
- the default memory backend remains the stable production path, while the optional IndexedDB shim remains available for Node-based validation
- the most likely remaining issues are still interpreter/runtime edge cases and deeper browser UX polish rather than parser-generation churn

## Priority 0: protect the stable parser path

- [x] Update the parser regeneration test harness to use realistic timeouts for the full grammar build (generation can take several minutes)
- [x] Validate the checked-in parser against the grammar in CI on every change with a long enough timeout budget via the explicit slow-parser test route
- [x] Add deterministic parser generation steps and explicit timeout/error reporting in `interpreter/tests/run-sql-parser.js`
- [x] Harden browser parser lookup paths for the admin app and add regression tests for likely root/nested URL layouts
- [ ] Document supported SQL grammar boundaries and unsupported dialect features
- [x] Distinguish between a genuinely broken grammar and a slow full regeneration process in developer tooling
- [x] Keep grammar and MaiaCC modifications out of the default workflow unless strictly required

## Runtime audit findings

The current runtime is already strong for a browser prototype, but the most relevant interpreter gaps are concentrated in a few areas:

- [ ] Subquery semantics are not yet exhaustive: `IN`, `EXISTS`, correlated comparisons, and multi-column subqueries need broader coverage
- [ ] `CASE` and boolean logic are still narrow compared to SQLite semantics, especially around `NULL`, nested conditions, and expression reuse
- [ ] `ORDER BY`/`GROUP BY` evaluation is usable but needs deeper validation for aliases, composite expressions, and edge-case sorting
- [ ] Function coverage is partial; unsupported functions should be explicitly documented and tested as intentional limitations
- [ ] Constraint validation remains focused on the main path; edge cases for `CHECK`, `UNIQUE`, and referential cascade behavior deserve more regression coverage
- [ ] Transaction and rollback handling is tested, but deeper multi-statement and nested savepoint scenarios are still under-covered
- [ ] Schema introspection and DDL coverage is good, but `DROP/ALTER` edge cases still need targeted regression tests
- [ ] Most browser/admin features still depend on the runtime being mature enough to provide consistent metadata and result shapes

## Priority 1: interpreter correctness and coverage

- [ ] Add tests for nested `WITH` queries and CTEs
- [ ] Add tests for `NULLS FIRST/LAST` and collation edge cases
- [ ] Add tests for more scalar functions and constraint semantics
- [ ] Add tests for multi-table `UPDATE` and `DELETE` behaviors
- [ ] Add tests for `ALTER TABLE ... DROP COLUMN` and column reordering semantics
- [ ] Add tests for `INSERT ... DEFAULT VALUES`, `RETURNING`, and `ON CONFLICT` variants
- [ ] Add tests for `CHECK` constraints and derived table validation
- [ ] Add tests for `EXISTS`, `IN`, `ANY`, `ALL`, and subquery edge cases
- [ ] Add property-style tests for result ordering and deterministic output
- [ ] Validate alias resolution and qualified-name handling in nested joins and derived tables
- [ ] Exercise more real-world failure paths for invalid expressions, missing tables, and constraint violations
- [ ] Add regression tests for schema changes after `ALTER TABLE` and `DROP` operations

## Priority 2: strengthen SQL behavior

- [x] Review and fix negated comparison semantics for `NOT IN` / `NOT LIKE` in the runtime interpreter
- [ ] Improve error classification for invalid expressions, missing tables and constraint violations
- [ ] Expand metadata introspection (`PRAGMA`, schema catalog, index diagnostics)
- [ ] Improve support for alias resolution and qualified names in more complex joins
- [ ] Harden cross-database and cross-table reference validation
- [ ] Review `LIKE`, `COLLATE`, comparison semantics and numeric coercion consistency
- [ ] Add partial support for `WITH RECURSIVE` and recursive query patterns
- [ ] Improve `VACUUM`, `ANALYZE` and metadata utilities as no-op or documented features
- [ ] Audit unsupported operators/functions to decide which are must-have versus documented limitations

## Priority 3: browser admin SPA

### Product goals

- [ ] Build a single-page admin app with a schema sidebar, SQL editor, results area and status bar
- [ ] Support database creation, rename, reset and deletion from the UI
- [ ] List tables, indexes, views, triggers and foreign keys for the selected database
- [ ] Show table rows with pagination, sorting and filter controls
- [ ] Add row create/update/delete forms for simple table editing
- [ ] Provide a query history panel and saved query snippets
- [ ] Add CSV/JSON export for result sets
- [ ] Add schema import/export and SQL script execution
- [ ] Allow a split-view for visualization and metadata analysis

### UX goals

- [ ] Follow a MySQL/phpMyAdmin-like structure: left nav + central workspace + results panel
- [ ] Provide dark and light themes
- [ ] Support keyboard shortcuts for Run, Format, Save, Clear and Reset
- [ ] Add toast notifications and debounced query execution status
- [ ] Keep local-first and browser-only operation without any server dependency

### Technical goals

- [ ] Create a SPA shell in a dedicated folder, such as `interpreter/admin-app/` or `maiasql-admin/`
- [ ] Load the runtime modules in the browser using bundling or direct script inclusion
- [ ] Add a state store for selected database, active schema, query tab and result metadata
- [ ] Store user preferences and recent queries in IndexedDB or localStorage
- [ ] Add a robust `openDatabase` abstraction for database switching and sandboxing
- [ ] Implement UI-safe SQL execution with per-statement logging and error rendering

## Priority 4: developer experience and packaging

- [ ] Add a real browser app build pipeline with a local dev server
- [ ] Add linting, formatting and a standard test script for browser and Node coverage
- [ ] Publish a sample SPA demo with screenshots in the README
- [ ] Add docs for local-first deployment and embedded app integration
- [ ] Add compatibility notes for supported browsers and IndexedDB limitations
- [ ] Publish a `CHANGELOG.md` and release policy

## Priority 5: long-term product vision

- [ ] Evaluate OPFS and worker-backed persistence for larger browser datasets
- [ ] Explore SQLite-compatible import/export for benchmarking against SQLite
- [ ] Add optional profiling tools for execution time and query plan inspection
- [ ] Consider a server-backed companion API for advanced multi-user scenarios
- [ ] Define a roadmap toward a stable v1 database engine API

## Recommended first milestone

1. Fix the parser regeneration timeout
2. Add failing tests for the most important missing SQL features
3. Build a first SPA shell for database browsing and query execution
4. Validate the admin UI against real browser flows and schema management operations
5. Publish a polished demo and dev instructions

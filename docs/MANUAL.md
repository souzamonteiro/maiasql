# MaiaSQL Manual

MaiaSQL is a pure JavaScript SQL runtime for browser-native and local-first use cases. This manual documents the SQL subset that is currently implemented and exercised by the runtime tests.

MaiaSQL is not a full SQLite clone. Treat the current public surface as a practical SQL subset for demos, embedded browser apps, local tools, and WebSQL-style migration experiments.

## Quick Start

### Node.js

```js
const { MaiaSQL } = require('./interpreter');
const Parser = require('./interpreter/sql-parser');

async function main() {
  const db = await MaiaSQL.open({
    name: 'demo',
    storage: 'memory',
    parser: Parser
  });

  await db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'user'
    );

    INSERT INTO users (name, role) VALUES ('Ada', 'compiler');
  `);

  const result = await db.exec('SELECT id, name, role FROM users');
  console.log(result.rows);
}

main();
```

### Browser Admin App

Serve the repository root as the document root:

```bash
python3 -m http.server 8123 --directory /path/to/maiasql
```

Open:

```text
http://localhost:8123/interpreter/admin-app/index.html
```

## Storage Backends

### Memory

The memory backend is the default test backend and the safest backend for runtime validation.

```js
const db = await MaiaSQL.open({
  name: 'memory-demo',
  storage: 'memory',
  parser: Parser
});
```

### IndexedDB

IndexedDB is available in browsers and can also be used in Node when a compatible IndexedDB implementation is provided.

```js
const db = await MaiaSQL.open({
  name: 'browser-demo',
  storage: 'indexeddb',
  parser: window.MaiaSQLParser
});
```

In Node-based tests:

```js
const { indexedDB } = require('./interpreter/node-indexeddb');

const db = await MaiaSQL.open({
  name: 'indexeddb-test',
  storage: 'indexeddb',
  parser: Parser,
  indexedDB
});
```

## Result Shape

`db.exec(sql, params)` returns a result object with the currently relevant fields:

```js
{
  statementType: 'SELECT',
  columns: [{ name: 'id' }, { name: 'name' }],
  rows: [{ id: 1, name: 'Ada' }],
  rowsAffected: 0,
  insertId: null
}
```

For write statements, `rowsAffected` and `insertId` are the most useful fields. For `RETURNING`, rows are returned like a query result.

## Parameter Binding

Positional parameters use `?` placeholders.

```sql
SELECT id, name
FROM users
WHERE name = ?;
```

```js
const result = await db.exec(
  'SELECT id, name FROM users WHERE name = ?',
  ['Ada']
);
```

## Supported DDL

### CREATE TABLE

Supported features include column types, `PRIMARY KEY`, `AUTOINCREMENT`, `NOT NULL`, `UNIQUE`, `DEFAULT`, `CHECK`, inline `REFERENCES`, and table-level `UNIQUE` / `FOREIGN KEY` constraints.

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  active INTEGER DEFAULT 1,
  age INTEGER CHECK (age >= 0)
);
```

Table-level constraints:

```sql
CREATE TABLE edge_map (
  left_id INTEGER NOT NULL,
  right_id INTEGER NOT NULL,
  UNIQUE (left_id, right_id),
  FOREIGN KEY (left_id) REFERENCES users(id),
  FOREIGN KEY (right_id) REFERENCES users(id)
);
```

Foreign key actions currently covered by tests:

```sql
CREATE TABLE child_cascade (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_code TEXT REFERENCES parent(code)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE TABLE child_set_null (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_code TEXT REFERENCES parent(code)
    ON UPDATE SET NULL
    ON DELETE SET NULL
);

CREATE TABLE child_restrict (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER REFERENCES parent(id) ON DELETE RESTRICT
);
```

### ALTER TABLE

Supported:

```sql
ALTER TABLE books RENAME TO library_books;
ALTER TABLE books RENAME COLUMN shelf TO area;
ALTER TABLE books ADD COLUMN note TEXT DEFAULT 'pending';
```

When a column is renamed, row data and index metadata are updated.

Not supported:

```sql
ALTER TABLE books DROP COLUMN note;
```

### CREATE INDEX

```sql
CREATE INDEX idx_books_author ON books(author_id);
CREATE UNIQUE INDEX idx_projects_code ON projects(code);
CREATE INDEX idx_tasks_open ON tasks(status) WHERE status = 'todo';
```

Indexes are represented in schema metadata and are used for uniqueness metadata. MaiaSQL does not yet implement a mature query planner or physical index acceleration comparable to SQLite.

### DROP INDEX

```sql
DROP INDEX idx_books_author;
```

### CREATE VIEW

```sql
CREATE VIEW adult_members AS
SELECT members.id, members.name, teams.name AS team_name
FROM members
INNER JOIN teams ON members.team_id = teams.id
WHERE members.age >= 18;
```

View column lists are supported:

```sql
CREATE VIEW user_names(id, display_name) AS
SELECT id, name FROM users;
```

### DROP VIEW

```sql
DROP VIEW adult_members;
```

### CREATE TRIGGER

Basic row triggers are supported with `BEFORE` / `AFTER`, `INSERT` / `UPDATE` / `DELETE`, optional `OF column`, optional `WHEN`, and statement bodies.

```sql
CREATE TRIGGER members_age_guard
BEFORE UPDATE OF age ON members
FOR EACH ROW
WHEN NEW.age < 0
BEGIN
  SELECT RAISE(ABORT, 'age must be non-negative');
END;
```

Trigger bodies can run supported statements. `SELECT RAISE(ABORT, 'message')` is supported for constraint-style validation.

### DROP TRIGGER

```sql
DROP TRIGGER members_age_guard;
```

### DROP TABLE

```sql
DROP TABLE books;
```

Dropping a table removes dependent indexes and triggers for that table.

## Supported DML

### INSERT VALUES

```sql
INSERT INTO users (name, role, active)
VALUES ('Ada', 'compiler', 1), ('Grace', 'runtime', 1);
```

### INSERT DEFAULT VALUES

```sql
INSERT INTO settings DEFAULT VALUES;
```

With `RETURNING`:

```sql
INSERT INTO settings DEFAULT VALUES
RETURNING id, label, enabled;
```

### INSERT SELECT

```sql
INSERT INTO dst (category, amount, name)
SELECT category, amount, name
FROM src
WHERE amount >= 10;
```

### Conflict Handling

Supported forms:

```sql
INSERT OR IGNORE INTO accounts (email, balance)
VALUES ('a@example.com', 99.99);

INSERT OR REPLACE INTO accounts (email, balance)
VALUES ('a@example.com', 50.75);

INSERT OR ABORT INTO accounts (email, balance)
VALUES ('b@example.com', 12.5);

INSERT OR FAIL INTO accounts (email, balance)
VALUES ('a@example.com', 13.5);

INSERT INTO dst (category, amount, name)
VALUES ('a', 10, 'n1')
ON CONFLICT DO NOTHING;
```

Limitations:

```sql
-- Not currently documented as supported:
INSERT INTO users (...) VALUES (...)
ON CONFLICT(email) DO UPDATE SET ...;
```

### UPDATE

```sql
UPDATE users
SET role = 'admin'
WHERE name = 'Ada';
```

With `RETURNING`:

```sql
UPDATE members
SET age = age + 1
WHERE name = 'Grace'
RETURNING id, name, age;
```

With correlated subqueries:

```sql
UPDATE order_lines
SET amount = amount + 5
WHERE EXISTS (
  SELECT 1 FROM orders o
  WHERE o.id = order_lines.order_id
    AND o.state = 'paid'
);
```

With `FROM`:

```sql
UPDATE accounts
SET balance = accounts.balance + adjustment.amount
FROM adjustments AS adjustment
WHERE accounts.id = adjustment.account_id;
```

### DELETE

```sql
DELETE FROM users
WHERE name = ?;
```

With correlated subqueries:

```sql
DELETE FROM order_lines
WHERE EXISTS (
  SELECT 1 FROM orders o
  WHERE o.id = order_lines.order_id
    AND o.state = 'cancelled'
);
```

With `USING`:

```sql
DELETE FROM accounts
USING adjustments AS adjustment
WHERE accounts.id = adjustment.account_id
  AND adjustment.amount = 7;
```

With `RETURNING`:

```sql
DELETE FROM users
WHERE active = 0
RETURNING id, name;
```

## Supported SELECT Features

### Basic SELECT

```sql
SELECT id, name, role
FROM users
WHERE active = 1
ORDER BY id ASC
LIMIT 10 OFFSET 0;
```

### DISTINCT

```sql
SELECT DISTINCT category
FROM inventory
ORDER BY category ASC;
```

### Aliases

```sql
SELECT members.name AS member_name, teams.name AS team_name
FROM members
JOIN teams ON members.team_id = teams.id;
```

### Joins

Supported join forms include `JOIN`, `INNER JOIN`, `LEFT JOIN`, and `LEFT OUTER JOIN`.

```sql
SELECT members.name, teams.name AS team_name
FROM members
LEFT JOIN teams ON members.team_id = teams.id
ORDER BY members.id ASC;
```

### Derived Tables

```sql
SELECT u.name, summary.total
FROM (
  SELECT id, name FROM users
) AS u
JOIN (
  SELECT user_id, SUM(total) AS total
  FROM orders
  GROUP BY user_id
) AS summary ON u.id = summary.user_id
ORDER BY u.name ASC;
```

### WHERE Predicates

Supported predicates include comparisons, boolean expressions, `IS NULL`, `IS NOT NULL`, `BETWEEN`, `LIKE`, `IN`, `EXISTS`, `ANY`, and `ALL`.

```sql
SELECT name
FROM labels
WHERE name NOT LIKE 'a%'
  AND id NOT IN (SELECT id FROM labels WHERE name = 'beta')
ORDER BY id ASC;
```

```sql
SELECT id, value
FROM scores
WHERE value > ALL (
  SELECT value FROM scores WHERE id IN (1, 2)
)
ORDER BY id ASC;
```

```sql
SELECT id, value
FROM scores
WHERE value = ANY (
  SELECT value FROM scores WHERE id IN (2, 3)
)
ORDER BY id ASC;
```

### CASE Expressions

Simple `CASE`:

```sql
SELECT title,
       CASE priority
         WHEN 1 THEN 'high'
         WHEN 2 THEN 'medium'
         ELSE 'low'
       END AS priority_label
FROM task_queue;
```

Searched `CASE`:

```sql
SELECT title,
       CASE
         WHEN effort >= 7 THEN 'long'
         WHEN effort >= 4 THEN 'medium'
         ELSE 'short'
       END AS effort_band
FROM task_queue;
```

### GROUP BY and HAVING

```sql
SELECT category,
       COUNT(*) AS total,
       SUM(amount) AS sum_amount,
       AVG(amount) AS avg_amount,
       MIN(amount) AS min_amount,
       MAX(amount) AS max_amount
FROM dst
GROUP BY category
HAVING sum_amount >= 15
ORDER BY category ASC;
```

### ORDER BY

Supported ordering features include aliases, qualified names, `ASC`, `DESC`, `COLLATE nocase`, `NULLS FIRST`, and `NULLS LAST`.

```sql
SELECT title
FROM books
ORDER BY title COLLATE nocase ASC NULLS LAST;
```

```sql
SELECT team, value
FROM scores
ORDER BY value ASC NULLS FIRST;
```

### Compound SELECT

Supported operators:

```sql
SELECT name FROM parents WHERE id = 1
UNION
SELECT name FROM parents WHERE id = 2
ORDER BY name ASC;
```

```sql
SELECT parent_id FROM children
INTERSECT
SELECT left_id FROM edge_map
ORDER BY parent_id ASC;
```

```sql
SELECT id FROM parents
EXCEPT
SELECT parent_id FROM children
ORDER BY id ASC;
```

`UNION ALL` is also supported.

### VALUES Queries

```sql
VALUES (1, 'one'), (2, 'two');
```

### CTEs

Non-recursive CTEs:

```sql
WITH ranked AS (
  SELECT id, team, value
  FROM scores
  WHERE value IS NOT NULL
)
SELECT team, value
FROM ranked
ORDER BY value DESC NULLS LAST;
```

Nested CTEs:

```sql
WITH base AS (
  SELECT id, team, score, label FROM event_log
),
filtered AS (
  WITH scoped AS (
    SELECT id, team, score, label
    FROM base
    WHERE score IS NOT NULL
  )
  SELECT id, team, score, label
  FROM scoped
)
SELECT team, score, label
FROM filtered
ORDER BY score DESC NULLS LAST;
```

Recursive CTEs:

```sql
WITH RECURSIVE seq(n) AS (
  VALUES (1)
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 5
)
SELECT n FROM seq ORDER BY n ASC;
```

Recursive CTE support is useful but should still be treated as limited compared to mature SQL engines.

## Supported Functions

### Aggregate Functions

```sql
COUNT(*)
COUNT(column)
SUM(column)
AVG(column)
MIN(column)
MAX(column)
```

Example:

```sql
SELECT category, COUNT(*) AS total, SUM(amount) AS total_amount
FROM orders
GROUP BY category;
```

### Scalar Functions

Supported scalar functions include:

```text
LOWER(value)
UPPER(value)
LENGTH(value)
COALESCE(value, ...)
IFNULL(value, fallback)
ABS(value)
TRIM(value[, chars])
LTRIM(value[, chars])
RTRIM(value[, chars])
SUBSTR(value, start[, length])
SUBSTRING(value, start[, length])
ROUND(value[, precision])
```

Example:

```sql
SELECT LOWER('MiXeD') AS lower_text,
       UPPER('MiXeD') AS upper_text,
       LENGTH('hello') AS text_length,
       COALESCE(name, 'fallback') AS resolved_name,
       ABS(amount) AS abs_amount,
       ROUND(12.3456, 2) AS rounded;
```

### Date and Time Literals

The runtime recognizes these literal-style keywords:

```sql
CURRENT_DATE
CURRENT_TIME
CURRENT_TIMESTAMP
```

Example:

```sql
INSERT INTO events (created_at) VALUES (CURRENT_TIMESTAMP);
```

## Constraints and NULL Semantics

`NOT NULL` rejects `NULL` values.

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
);
```

`CHECK` rejects only expressions that evaluate to `false`. A `NULL` / unknown result is accepted, matching SQL behavior.

```sql
CREATE TABLE measurements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reading INTEGER CHECK (reading > 0)
);

INSERT INTO measurements (reading) VALUES (NULL);
```

`UNIQUE` allows multiple `NULL` values.

```sql
CREATE TABLE measurements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tag TEXT UNIQUE
);

INSERT INTO measurements (tag) VALUES (NULL), (NULL);
```

Foreign keys are enforced when all local key columns are non-null.

```sql
INSERT INTO children (parent_id, name) VALUES (999, 'Ghost');
-- FOREIGN KEY constraint failed
```

## Transactions

The native API automatically wraps multi-statement `db.exec()` calls so failures roll back the whole batch.

```sql
INSERT INTO items (name) VALUES ('ok');
INSERT INTO missing_table (name) VALUES ('bad');
```

In this case, the first insert is rolled back if the second statement fails.

Explicit SQL transaction control is supported:

```sql
BEGIN;
UPDATE users SET active = 0 WHERE id = 1;
COMMIT;
```

Rollback:

```sql
BEGIN;
UPDATE users SET active = 0 WHERE id = 1;
ROLLBACK;
```

Savepoints:

```sql
SAVEPOINT before_reset;
UPDATE orders SET total = 99 WHERE id = 3;
ROLLBACK TO SAVEPOINT before_reset;
RELEASE SAVEPOINT before_reset;
```

The JavaScript API also supports transactional callbacks:

```js
await db.transaction(async (tx) => {
  await tx.exec('SAVEPOINT before_update');
  await tx.exec('UPDATE orders SET total = 99 WHERE id = 3');
  await tx.exec('ROLLBACK TO SAVEPOINT before_update');
});
```

## PRAGMA Support

### user_version

```sql
PRAGMA user_version = 7;
PRAGMA user_version;
```

### table_info

```sql
PRAGMA table_info(tasks);
```

Returns rows similar to:

```js
{
  cid: 1,
  name: 'project_code',
  type: 'TEXT',
  notnull: 1,
  dflt_value: null,
  pk: 0
}
```

### index_list

```sql
PRAGMA index_list(tasks);
```

### index_info

```sql
PRAGMA index_info(idx_projects_code);
```

### foreign_key_list

```sql
PRAGMA foreign_key_list(tasks);
```

## VACUUM

`VACUUM` is accepted as a no-op compatibility command.

```sql
VACUUM;
```

## WebSQL Compatibility Layer

MaiaSQL includes a WebSQL-style adapter. It is implemented over the native Promise-based API.

Typical WebSQL-style usage:

```js
const db = openDatabase('demo', '1.0', 'Demo DB', 5 * 1024 * 1024);

db.transaction((tx) => {
  tx.executeSql(
    'CREATE TABLE IF NOT EXISTS logs (id INTEGER PRIMARY KEY AUTOINCREMENT, message TEXT)'
  );
  tx.executeSql(
    'INSERT INTO logs (message) VALUES (?)',
    ['hello']
  );
  tx.executeSql(
    'SELECT id, message FROM logs',
    [],
    (tx, result) => {
      console.log(result.rows.length);
    }
  );
});
```

## Browser Admin Features

The current admin app supports:

- database creation, deletion, switching, and refresh;
- schema sidebar with tables and column metadata;
- SQL editor with syntax highlighting;
- contextual suggestions/autocomplete;
- query execution and result table rendering;
- recent query history;
- saved query snippets;
- CSV export.

The admin app is a local-first browser tool. It is not yet a full phpMyAdmin-style database manager.

## Known Limitations

### SQLite Compatibility

MaiaSQL intentionally implements a subset of SQLite-like SQL. It does not currently provide:

- SQLite binary file compatibility;
- SQLite C ABI compatibility;
- byte-for-byte SQLite behavior;
- a full SQLite extension ecosystem;
- complete SQL optimizer behavior;
- complete SQLite type affinity and coercion semantics.

### Parser and Grammar

The checked-in parser is stable and used by default. Parser regeneration through MaiaCC is intentionally treated as a slow validation path.

Use normal parser smoke tests for routine development:

```bash
npm run test:parser
```

Use slow regeneration only when explicitly validating grammar output:

```bash
npm run test:parser:slow
```

### DDL Gaps

Known DDL limitations include:

- `ALTER TABLE ... DROP COLUMN` is not supported;
- advanced column reordering is not supported;
- advanced index expressions are not fully documented as supported;
- schema migration behavior is still limited compared with mature engines.

### DML Gaps

Known DML limitations include:

- `ON CONFLICT (...) DO UPDATE` is not currently documented as supported;
- advanced `UPDATE` / `DELETE` variants outside the tested subset may fail;
- multi-column subquery behavior is not yet exhaustive;
- advanced SQL dialect extensions should be treated as unsupported unless covered here.

### SELECT Gaps

Known query limitations include:

- no cost-based query planner;
- no mature physical index acceleration model;
- partial function coverage;
- partial collation support, currently focused on `COLLATE nocase`;
- recursive CTE support is useful but still limited;
- edge cases around deeply nested boolean logic and subqueries need more coverage.

### Admin App Gaps

The admin app does not yet provide:

- table row editing forms;
- pagination/sorting/filter controls for browsing table data;
- SQL import/export beyond CSV result export;
- schema designer workflows;
- dark/light theme switcher;
- packaged production build pipeline.

## Validation Commands

Run the full regular test suite:

```bash
npm test
```

Run only runtime tests:

```bash
npm run test:runtime
```

Run parser smoke tests:

```bash
npm run test:parser
```

Run slow parser regeneration validation:

```bash
npm run test:parser:slow
```

Run the admin path resolver tests directly:

```bash
node --test interpreter/tests/admin-app-paths.test.js
```

## Public Preview Guidance

For a public release, describe MaiaSQL as:

```text
A browser-native JavaScript SQL runtime with memory and IndexedDB storage, a WebSQL compatibility adapter, and a local-first admin playground.
```

Avoid presenting it as a complete SQLite replacement. The current project is best positioned as a public preview for experimentation, embedded browser storage, WebSQL migration research, and local-first SQL tooling.

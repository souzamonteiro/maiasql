'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const Parser = require('../sql-parser');
const runtime = require('../maiasql-core');

describe('MaiaSQL prototype runtime', () => {
  it('executes CRUD statements with the memory backend', async () => {
    const db = await runtime.MaiaSQL.open({
      name: 'memory-runtime-test',
      storage: 'memory',
      parser: Parser
    });

    await db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        age INTEGER
      );
      INSERT INTO users (name, age) VALUES ('Ada', 36), ('Grace', 37);
      UPDATE users SET age = age + 1 WHERE name = 'Grace';
    `);

    const result = await db.exec('SELECT id, name, age FROM users ORDER BY id ASC');
    assert.equal(result.rows.length, 2);
    assert.equal(result.rows[1].age, 38);

    const deletion = await db.exec('DELETE FROM users WHERE name = ?', ['Ada']);
    assert.equal(deletion.rowsAffected, 1);
  });

  it('rolls back implicit transaction on failure', async () => {
    const db = await runtime.MaiaSQL.open({
      name: 'memory-rollback-test',
      storage: 'memory',
      parser: Parser
    });

    await db.exec('CREATE TABLE items (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL)');

    await assert.rejects(
      db.exec("INSERT INTO items (name) VALUES ('ok'); INSERT INTO missing_table (name) VALUES ('bad')"),
      /Table not found/
    );

    const result = await db.exec('SELECT COUNT(*) AS total FROM items');
    assert.equal(result.rows[0].total, 0);
  });

  it('supports joins, subqueries, views, triggers and returning', async () => {
    const db = await runtime.MaiaSQL.open({
      name: 'memory-advanced-test',
      storage: 'memory',
      parser: Parser
    });

    await db.exec(`
      CREATE TABLE teams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      );

      CREATE TABLE members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        age INTEGER CHECK (age >= 0)
      );

      INSERT INTO teams (name) VALUES ('Compiler'), ('Runtime');
      INSERT INTO members (team_id, name, age) VALUES
        (1, 'Ada', 36),
        (1, 'Grace', 37),
        (2, 'Linus', 55);

      CREATE VIEW adult_members AS
      SELECT members.id, members.name, teams.name AS team_name
      FROM members
      INNER JOIN teams ON members.team_id = teams.id
      WHERE members.age >= 18;

      CREATE TRIGGER members_age_guard
      BEFORE UPDATE OF age ON members
      FOR EACH ROW
      WHEN NEW.age < 0
      BEGIN
        SELECT RAISE(ABORT, 'age must be non-negative');
      END;
    `);

    const joinResult = await db.exec(`
      SELECT members.name AS member_name, teams.name AS team_name
      FROM members
      LEFT JOIN teams ON members.team_id = teams.id
      WHERE members.team_id IN (
        SELECT id FROM teams WHERE name LIKE 'C%'
      )
      ORDER BY members.id ASC
    `);

    assert.equal(joinResult.rows.length, 2);
    assert.equal(joinResult.rows[0].team_name, 'Compiler');
    assert.equal(joinResult.rows[1].member_name, 'Grace');

    const viewResult = await db.exec('SELECT * FROM adult_members ORDER BY id ASC');
    assert.equal(viewResult.rows.length, 3);
    assert.equal(viewResult.rows[0].team_name, 'Compiler');

    const returningResult = await db.exec(`
      UPDATE members
      SET age = age + 1
      WHERE name = 'Grace'
      RETURNING id, name, age
    `);
    assert.equal(returningResult.rows.length, 1);
    assert.equal(returningResult.rows[0].age, 38);

    await assert.rejects(
      db.exec(`UPDATE members SET age = -1 WHERE name = 'Ada'`),
      /age must be non-negative/
    );
  });

  it('supports insert-select, conflict handling and grouped aggregates', async () => {
    const db = await runtime.MaiaSQL.open({
      name: 'memory-analytics-test',
      storage: 'memory',
      parser: Parser
    });

    await db.exec(`
      CREATE TABLE src (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        amount INTEGER NOT NULL,
        name TEXT UNIQUE
      );

      CREATE TABLE dst (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        amount INTEGER NOT NULL,
        name TEXT UNIQUE
      );

      INSERT INTO src (category, amount, name) VALUES
        ('a', 10, 'n1'),
        ('a', 20, 'n2'),
        ('b', 5, 'n3'),
        ('b', 15, 'n4');

      INSERT INTO dst (category, amount, name)
      SELECT category, amount, name
      FROM src
      WHERE amount >= 10;

      INSERT INTO dst (category, amount, name)
      VALUES ('a', 10, 'n1')
      ON CONFLICT DO NOTHING;
    `);

    const grouped = await db.exec(`
      SELECT category,
             COUNT(*) AS total,
             SUM(amount) AS sum_amount,
             AVG(amount) AS avg_amount,
             MIN(amount) AS min_amount,
             MAX(amount) AS max_amount
      FROM dst
      GROUP BY category
      ORDER BY category ASC
    `);

    assert.equal(grouped.rows.length, 2);
    assert.deepEqual(grouped.rows[0], {
      category: 'a',
      total: 2,
      sum_amount: 30,
      avg_amount: 15,
      min_amount: 10,
      max_amount: 20
    });
    assert.deepEqual(grouped.rows[1], {
      category: 'b',
      total: 1,
      sum_amount: 15,
      avg_amount: 15,
      min_amount: 15,
      max_amount: 15
    });
  });

  it('supports distinct, having and insert or replace', async () => {
    const db = await runtime.MaiaSQL.open({
      name: 'memory-distinct-test',
      storage: 'memory',
      parser: Parser
    });

    await db.exec(`
      CREATE TABLE inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sku TEXT UNIQUE,
        category TEXT NOT NULL,
        qty INTEGER NOT NULL
      );

      INSERT INTO inventory (sku, category, qty) VALUES
        ('a-1', 'books', 5),
        ('a-2', 'books', 9),
        ('b-1', 'games', 2),
        ('c-1', 'games', 8);

      INSERT OR REPLACE INTO inventory (sku, category, qty)
      VALUES ('b-1', 'games', 11);
    `);

    const distinctResult = await db.exec(`
      SELECT DISTINCT category
      FROM inventory
      ORDER BY category ASC
    `);
    assert.equal(distinctResult.rows.length, 2);
    assert.equal(distinctResult.rows[0].category, 'books');
    assert.equal(distinctResult.rows[1].category, 'games');

    const havingResult = await db.exec(`
      SELECT category,
             COUNT(qty) AS total_rows,
             SUM(qty) AS total_qty
      FROM inventory
      GROUP BY category
      HAVING total_qty >= 14
      ORDER BY category ASC
    `);
    assert.equal(havingResult.rows.length, 2);
    assert.deepEqual(havingResult.rows[0], {
      category: 'books',
      total_rows: 2,
      total_qty: 14
    });
    assert.deepEqual(havingResult.rows[1], {
      category: 'games',
      total_rows: 2,
      total_qty: 19
    });

    const replaced = await db.exec(`SELECT qty FROM inventory WHERE sku = 'b-1'`);
    assert.equal(replaced.rows[0].qty, 11);
  });

  it('supports simple and searched CASE expressions', async () => {
    const db = await runtime.MaiaSQL.open({
      name: 'memory-case-test',
      storage: 'memory',
      parser: Parser
    });

    await db.exec(`
      CREATE TABLE task_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        priority INTEGER NOT NULL,
        status TEXT,
        effort INTEGER NOT NULL
      );

      INSERT INTO task_queue (title, priority, status, effort) VALUES
        ('parser', 1, 'done', 2),
        ('storage', 2, 'doing', 5),
        ('adapter', 3, NULL, 8);

      UPDATE task_queue
      SET status = CASE
        WHEN priority = 1 THEN 'ready'
        WHEN priority = 2 THEN 'active'
        ELSE 'queued'
      END
      WHERE status IS NULL;
    `);

    const rows = await db.exec(`
      SELECT title,
             CASE priority
               WHEN 1 THEN 'high'
               WHEN 2 THEN 'medium'
               ELSE 'low'
             END AS priority_label,
             CASE
               WHEN effort >= 7 THEN 'long'
               WHEN effort >= 4 THEN 'medium'
               ELSE 'short'
             END AS effort_band,
             status
      FROM task_queue
      ORDER BY id ASC
    `);

    assert.deepEqual(rows.rows[0], {
      title: 'parser',
      priority_label: 'high',
      effort_band: 'short',
      status: 'done'
    });
    assert.deepEqual(rows.rows[1], {
      title: 'storage',
      priority_label: 'medium',
      effort_band: 'medium',
      status: 'doing'
    });
    assert.deepEqual(rows.rows[2], {
      title: 'adapter',
      priority_label: 'low',
      effort_band: 'long',
      status: 'queued'
    });
  });

  it('supports pragma metadata for tables, indexes and foreign keys', async () => {
    const db = await runtime.MaiaSQL.open({
      name: 'memory-pragmas-test',
      storage: 'memory',
      parser: Parser
    });

    await db.exec(`
      CREATE TABLE projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        title TEXT DEFAULT 'untitled'
      );

      CREATE TABLE tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_code TEXT NOT NULL REFERENCES projects(code) ON DELETE CASCADE ON UPDATE SET NULL,
        title TEXT NOT NULL,
        status TEXT DEFAULT 'todo'
      );

      CREATE UNIQUE INDEX idx_projects_code ON projects(code);
      CREATE INDEX idx_tasks_open ON tasks(status) WHERE status = 'todo';
      PRAGMA user_version = 7;
    `);

    const pragmaVersion = await db.exec(`PRAGMA user_version`);
    assert.equal(pragmaVersion.rows[0].user_version, 7);

    const tableInfo = await db.exec(`PRAGMA table_info(tasks)`);
    assert.equal(tableInfo.rows.length, 4);
    assert.deepEqual(tableInfo.rows[1], {
      cid: 1,
      name: 'project_code',
      type: 'TEXT',
      notnull: 1,
      dflt_value: null,
      pk: 0
    });

    const indexList = await db.exec(`PRAGMA index_list(tasks)`);
    assert.equal(indexList.rows.length, 1);
    assert.deepEqual(indexList.rows[0], {
      seq: 0,
      name: 'idx_tasks_open',
      unique: 0,
      origin: 'c',
      partial: 1
    });

    const indexInfo = await db.exec(`PRAGMA index_info(idx_projects_code)`);
    assert.equal(indexInfo.rows.length, 1);
    assert.deepEqual(indexInfo.rows[0], {
      seqno: 0,
      cid: 1,
      name: 'code'
    });

    const foreignKeys = await db.exec(`PRAGMA foreign_key_list(tasks)`);
    assert.equal(foreignKeys.rows.length, 1);
    assert.deepEqual(foreignKeys.rows[0], {
      id: 0,
      seq: 0,
      table: 'projects',
      from: 'project_code',
      to: 'code',
      on_update: 'SET NULL',
      on_delete: 'CASCADE',
      match: 'NONE'
    });
  });

  it('supports ddl changes, correlated exists and richer ordering', async () => {
    const db = await runtime.MaiaSQL.open({
      name: 'memory-ddl-test',
      storage: 'memory',
      parser: Parser
    });

    await db.exec(`
      CREATE TABLE authors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
      );

      CREATE TABLE books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        author_id INTEGER NOT NULL,
        title TEXT,
        shelf TEXT DEFAULT 'general'
      );

      INSERT INTO authors (name) VALUES ('alice'), ('Bob'), ('carol');
      INSERT INTO books (author_id, title) VALUES
        (1, 'Algorithms'),
        (1, NULL),
        (2, 'Bytecode');

      ALTER TABLE books RENAME COLUMN shelf TO area;
      ALTER TABLE books ADD COLUMN note TEXT DEFAULT 'pending';
      ALTER TABLE authors RENAME TO writers;
    `);

    const existsResult = await db.exec(`
      SELECT writers.name
      FROM writers
      WHERE EXISTS (
        SELECT 1
        FROM books
        WHERE books.author_id = writers.id
          AND books.title IS NOT NULL
      )
      ORDER BY writers.name COLLATE nocase ASC
    `);
    assert.equal(existsResult.rows.length, 2);
    assert.equal(existsResult.rows[0].name, 'alice');
    assert.equal(existsResult.rows[1].name, 'Bob');

    const orderResult = await db.exec(`
      SELECT title
      FROM books
      ORDER BY title COLLATE nocase ASC NULLS LAST
    `);
    assert.equal(orderResult.rows.length, 3);
    assert.equal(orderResult.rows[0].title, 'Algorithms');
    assert.equal(orderResult.rows[1].title, 'Bytecode');
    assert.equal(orderResult.rows[2].title, null);

    const metadata = await db.exec(`SELECT area, note FROM books WHERE id = 1`);
    assert.equal(metadata.rows[0].area, 'general');
    assert.equal(metadata.rows[0].note, 'pending');

    await db.exec(`
      CREATE VIEW writer_names AS
      SELECT id, name FROM writers;
      DROP VIEW writer_names;
      CREATE INDEX idx_books_author ON books(author_id);
      DROP INDEX idx_books_author;
      CREATE TRIGGER books_note_guard
      BEFORE UPDATE OF note ON books
      FOR EACH ROW
      WHEN NEW.note = 'forbidden'
      BEGIN
        SELECT RAISE(ABORT, 'forbidden note');
      END;
      DROP TRIGGER books_note_guard;
      DROP TABLE books;
    `);

    await assert.rejects(
      db.exec(`SELECT * FROM books`),
      /Table or view not found|Table not found/
    );
  });

  it('supports compound selects and foreign keys', async () => {
    const db = await runtime.MaiaSQL.open({
      name: 'memory-relational-test',
      storage: 'memory',
      parser: Parser
    });

    await db.exec(`
      CREATE TABLE parents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
      );

      CREATE TABLE children (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        parent_id INTEGER NOT NULL REFERENCES parents(id),
        name TEXT NOT NULL
      );

      CREATE TABLE edge_map (
        left_id INTEGER NOT NULL,
        right_id INTEGER NOT NULL,
        FOREIGN KEY (left_id) REFERENCES parents(id),
        FOREIGN KEY (right_id) REFERENCES parents(id)
      );

      INSERT INTO parents (name) VALUES ('Ada'), ('Grace'), ('Linus');
      INSERT INTO children (parent_id, name) VALUES (1, 'Alpha'), (2, 'Beta');
      INSERT INTO edge_map (left_id, right_id) VALUES (1, 2), (2, 3);
    `);

    await assert.rejects(
      db.exec(`INSERT INTO children (parent_id, name) VALUES (999, 'Ghost')`),
      /FOREIGN KEY constraint failed/
    );

    const unionResult = await db.exec(`
      SELECT name FROM parents WHERE id = 1
      UNION
      SELECT name FROM parents WHERE id = 2
      ORDER BY name ASC
    `);
    assert.equal(unionResult.rows.length, 2);

    const intersectResult = await db.exec(`
      SELECT parent_id FROM children
      INTERSECT
      SELECT left_id FROM edge_map
      ORDER BY parent_id ASC
    `);
    assert.equal(intersectResult.rows.length, 2);
    assert.equal(intersectResult.rows[0].parent_id, 1);

    const exceptResult = await db.exec(`
      SELECT id FROM parents
      EXCEPT
      SELECT parent_id FROM children
      ORDER BY id ASC
    `);
    assert.equal(exceptResult.rows.length, 1);
    assert.equal(exceptResult.rows[0].id, 3);
  });

  it('supports foreign key actions and scalar functions', async () => {
    const db = await runtime.MaiaSQL.open({
      name: 'memory-fk-actions-test',
      storage: 'memory',
      parser: Parser
    });

    await db.exec(`
      CREATE TABLE parent (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE,
        label TEXT
      );

      CREATE TABLE child_cascade (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        parent_code TEXT REFERENCES parent(code) ON UPDATE CASCADE ON DELETE CASCADE
      );

      CREATE TABLE child_set_null (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        parent_code TEXT REFERENCES parent(code) ON UPDATE SET NULL ON DELETE SET NULL
      );

      CREATE TABLE child_restrict (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        parent_id INTEGER REFERENCES parent(id) ON DELETE RESTRICT
      );

      INSERT INTO parent (code, label) VALUES ('p1', 'alpha');
      INSERT INTO child_cascade (parent_code) VALUES ('p1');
      INSERT INTO child_set_null (parent_code) VALUES ('p1');
      INSERT INTO child_restrict (parent_id) VALUES (1);
    `);

    await db.exec(`UPDATE parent SET code = 'p1-new' WHERE code = 'p1'`);
    const cascaded = await db.exec(`SELECT parent_code FROM child_cascade`);
    const nulledOnUpdate = await db.exec(`SELECT parent_code FROM child_set_null`);
    assert.equal(cascaded.rows[0].parent_code, 'p1-new');
    assert.equal(nulledOnUpdate.rows[0].parent_code, null);

    await assert.rejects(
      db.exec(`DELETE FROM parent WHERE code = 'p1-new'`),
      /FOREIGN KEY constraint failed/
    );

    await db.exec(`DELETE FROM child_restrict WHERE parent_id = 1`);
    await db.exec(`DELETE FROM parent WHERE code = 'p1-new'`);
    const cascadeRows = await db.exec(`SELECT COUNT(*) AS total FROM child_cascade`);
    const setNullRows = await db.exec(`SELECT parent_code FROM child_set_null`);
    assert.equal(cascadeRows.rows[0].total, 0);
    assert.equal(setNullRows.rows[0].parent_code, null);

    await db.exec(`
      CREATE TABLE metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        amount INTEGER
      );
      INSERT INTO metrics (name, amount) VALUES ('Alpha', -7), (NULL, 3);
    `);
    const funcs = await db.exec(`
      SELECT LOWER('MiXeD') AS lower_text,
             UPPER('MiXeD') AS upper_text,
             LENGTH('hello') AS text_length,
             COALESCE(name, 'fallback') AS resolved_name,
             ABS(amount) AS abs_amount
      FROM metrics
      ORDER BY id ASC
      LIMIT 1
    `);
    assert.deepEqual(funcs.rows[0], {
      lower_text: 'mixed',
      upper_text: 'MIXED',
      text_length: 5,
      resolved_name: 'Alpha',
      abs_amount: 7
    });
  });

  it('supports additional conflict modes and string/numeric functions', async () => {
    const db = await runtime.MaiaSQL.open({
      name: 'memory-conflict-funcs-test',
      storage: 'memory',
      parser: Parser
    });

    await db.exec(`
      CREATE TABLE accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        balance REAL
      );

      INSERT INTO accounts (email, balance) VALUES ('a@example.com', 10.25);
      INSERT OR IGNORE INTO accounts (email, balance) VALUES ('a@example.com', 99.99);
      INSERT OR REPLACE INTO accounts (email, balance) VALUES ('a@example.com', 50.75);
      INSERT OR ABORT INTO accounts (email, balance) VALUES ('b@example.com', 12.5);
    `);

    await assert.rejects(
      db.exec(`INSERT OR FAIL INTO accounts (email, balance) VALUES ('a@example.com', 13.5)`),
      /UNIQUE constraint failed/
    );

    const rows = await db.exec(`SELECT email, balance FROM accounts ORDER BY id ASC`);
    assert.equal(rows.rows.length, 2);
    assert.equal(rows.rows[0].email, 'a@example.com');
    assert.equal(rows.rows[0].balance, 50.75);
    assert.equal(rows.rows[1].email, 'b@example.com');

    const funcs = await db.exec(`
      SELECT TRIM('  spaced  ') AS trimmed,
             LTRIM('xxhello', 'x') AS ltrimmed,
             RTRIM('helloyy', 'y') AS rtrimmed,
             SUBSTR('abcdef', 2, 3) AS sliced,
             ROUND(12.3456, 2) AS rounded,
             IFNULL(NULL, 'fallback') AS fallback_value
    `);
    assert.deepEqual(funcs.rows[0], {
      trimmed: 'spaced',
      ltrimmed: 'hello',
      rtrimmed: 'hello',
      sliced: 'bcd',
      rounded: 12.35,
      fallback_value: 'fallback'
    });
  });
});

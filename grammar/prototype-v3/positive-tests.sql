-- MaiaSQL comprehensive positive parser tests
-- Keywords deliberately use uppercase, lowercase and mixed case.

-- 1. Lexical case and longest-match behavior
SELECT selector, selection, selectValue, fromTable
FROM selection;
select selector from selection;
SeLeCt selector FrOm selection WhErE selector >= 1;

-- 2. Basic SELECT forms
SELECT 1;
SELECT CURRENT_TIMESTAMP;
SELECT DISTINCT name FROM people;
SELECT ALL name FROM people;
SELECT p.*, p.id, main.people.name FROM main.people AS p;

-- 3. Expressions and precedence
SELECT 1 + 2 * 3;
SELECT (1 + 2) * 3;
SELECT 'a' || 'b' || 'c';
SELECT 8 | 4 & 2;
SELECT 8 >> 1 | 1;
SELECT ~-value FROM data;
SELECT payload -> 'name', payload ->> 'name' FROM events;
SELECT name COLLATE nocase = 'ada' FROM people;

-- 4. Predicates
SELECT * FROM people WHERE age BETWEEN 18 AND 65;
SELECT * FROM people WHERE age NOT BETWEEN 18 AND 65;
SELECT * FROM people WHERE id IN (1, 2, 3);
SELECT * FROM people WHERE id NOT IN (SELECT id FROM blocked);
SELECT * FROM people WHERE name LIKE 'A%' ESCAPE '\';
SELECT * FROM people WHERE name GLOB 'A*';
SELECT * FROM people WHERE name REGEXP '^A';
SELECT * FROM people WHERE content MATCH 'database';
SELECT * FROM people WHERE deleted_at IS NULL;
SELECT * FROM people WHERE deleted_at IS NOT NULL;
SELECT * FROM people WHERE a IS DISTINCT FROM b;
SELECT * FROM people WHERE score >= ALL (SELECT score FROM results);
SELECT * FROM people WHERE score = ANY (SELECT score FROM results);

-- 5. CASE, CAST, EXISTS and row values
SELECT CAST(age AS TEXT) FROM people;
SELECT CASE WHEN age >= 18 THEN 'adult' ELSE 'minor' END FROM people;
SELECT CASE status WHEN 1 THEN 'active' ELSE 'inactive' END FROM people;
SELECT EXISTS(SELECT 1 FROM people WHERE id = 1);
SELECT * FROM people WHERE (department_id, active) = (1, TRUE);

-- 6. Functions, aggregates and FILTER
SELECT COUNT(*), SUM(value), AVG(value), MIN(value), MAX(value) FROM metrics;
SELECT COUNT(DISTINCT department_id) FROM people;
SELECT group_concat(name ORDER BY name) FROM people;
SELECT COUNT(*) FILTER (WHERE active = TRUE) FROM people;

-- 7. FROM, aliases and table-valued functions
SELECT * FROM people p;
SELECT * FROM people AS p;
SELECT * FROM json_each('[1,2,3]') AS item;
SELECT * FROM (SELECT id, name FROM people) AS p;

-- 8. Joins
SELECT * FROM a, b, c;
SELECT * FROM a JOIN b ON a.id = b.id;
SELECT * FROM a INNER JOIN b ON a.id = b.id;
SELECT * FROM a LEFT JOIN b ON a.id = b.id;
SELECT * FROM a LEFT OUTER JOIN b ON a.id = b.id;
SELECT * FROM a RIGHT JOIN b ON a.id = b.id;
SELECT * FROM a FULL OUTER JOIN b ON a.id = b.id;
SELECT * FROM a CROSS JOIN b;
SELECT * FROM a NATURAL JOIN b;
SELECT * FROM a NATURAL LEFT OUTER JOIN b;
SELECT * FROM a JOIN b USING (id);
SELECT * FROM (a JOIN b ON a.id = b.id) JOIN c ON b.id = c.id;

-- 9. GROUP BY, HAVING, ORDER BY and LIMIT
SELECT department_id, COUNT(*)
FROM people
GROUP BY department_id
HAVING COUNT(*) > 1
ORDER BY department_id DESC NULLS LAST
LIMIT 10 OFFSET 5;

SELECT * FROM people ORDER BY name LIMIT 5, 10;

-- 10. Compound SELECT and VALUES
SELECT id FROM a
UNION ALL
SELECT id FROM b
INTERSECT
SELECT id FROM c;

VALUES (1, 'Ada'), (2, 'Grace');

-- 11. CTE and recursive CTE
WITH adults AS (
  SELECT id, name FROM people WHERE age >= 18
)
SELECT * FROM adults;

WITH RECURSIVE seq(n) AS (
  VALUES(1)
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 10
)
SELECT * FROM seq;

-- 12. Window functions
SELECT
  department_id,
  COUNT(*) OVER (
    PARTITION BY department_id
    ORDER BY id
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS running_count
FROM people;

SELECT
  SUM(value) OVER (
    ORDER BY created_at
    RANGE BETWEEN 10 PRECEDING AND CURRENT ROW
    EXCLUDE TIES
  )
FROM metrics;

-- 13. CREATE TABLE and declared types
CREATE TABLE departments (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE people (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name CHARACTER VARYING(120) NOT NULL,
  age NUMERIC(3),
  score DECIMAL(10, 2),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  payload JSON,
  bytes BLOB,
  department_id INTEGER,
  generated_name TEXT GENERATED ALWAYS AS (name || ':' || id) STORED,
  CONSTRAINT uq_people_name UNIQUE (name),
  CHECK (age >= 0),
  FOREIGN KEY (department_id)
    REFERENCES departments(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
    DEFERRABLE INITIALLY DEFERRED
) STRICT;

CREATE TABLE no_rowid_table (
  code TEXT PRIMARY KEY,
  value TEXT
) WITHOUT ROWID;

CREATE TEMP TABLE temp_items (
  id INTEGER,
  value TEXT
);

CREATE TABLE copied AS
SELECT id, name FROM people;

-- 14. CREATE/DROP INDEX
CREATE INDEX idx_people_name ON people(name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_people_department_name
ON people(department_id, name COLLATE nocase DESC)
WHERE active = TRUE;

DROP INDEX IF EXISTS idx_people_name;

-- 15. INSERT, REPLACE, UPSERT and RETURNING
INSERT INTO people(name, age) VALUES ('Ada', 36);
insert into people(name, age) values ('Grace', 40);
InSeRt InTo people(name, age) VaLuEs ('Linus', 55);

INSERT INTO people(name, age)
VALUES ('Ada', 36), ('Grace', 40)
RETURNING id, name;

INSERT OR REPLACE INTO people(id, name) VALUES (1, 'Ada');

REPLACE INTO people(id, name) VALUES (1, 'Ada');

INSERT INTO people(id, name)
VALUES (1, 'Ada')
ON CONFLICT(id) DO NOTHING;

INSERT INTO people(id, name)
VALUES (1, 'Ada')
ON CONFLICT(id) DO UPDATE
SET name = excluded.name
WHERE excluded.name IS NOT NULL
RETURNING id, name;

INSERT INTO people(id, name)
SELECT id, name FROM staging
WHERE TRUE
ON CONFLICT(id) DO UPDATE
SET name = excluded.name;

-- 16. UPDATE and DELETE
UPDATE people
SET age = age + 1,
    name = 'Ada'
WHERE id = 1
RETURNING id, age;

UPDATE people
SET department_id = d.id
FROM departments AS d
WHERE d.name = 'Research'
RETURNING people.id;

DELETE FROM people WHERE id = ?;
DELETE FROM people
WHERE active = FALSE
RETURNING id
ORDER BY id
LIMIT 10;

-- 17. Views and triggers
CREATE VIEW adult_people(id, name) AS
SELECT id, name FROM people WHERE age >= 18;

DROP VIEW IF EXISTS adult_people;

CREATE TRIGGER people_age_guard
BEFORE UPDATE OF age ON people
FOR EACH ROW
WHEN NEW.age < 0
BEGIN
  SELECT RAISE(ABORT, 'age must be non-negative');
END;

DROP TRIGGER IF EXISTS people_age_guard;

-- 18. ALTER TABLE
ALTER TABLE people RENAME TO persons;
ALTER TABLE persons RENAME COLUMN name TO full_name;
ALTER TABLE persons ADD COLUMN email TEXT;
ALTER TABLE persons DROP COLUMN email;

-- 19. Transactions and savepoints
BEGIN TRANSACTION;
COMMIT;
BEGIN IMMEDIATE TRANSACTION;
ROLLBACK;
SAVEPOINT before_change;
ROLLBACK TO SAVEPOINT before_change;
RELEASE SAVEPOINT before_change;

-- 20. PRAGMA and maintenance
PRAGMA foreign_keys = ON;
PRAGMA main.table_info(people);
ANALYZE;
ANALYZE people;
REINDEX;
REINDEX people;
VACUUM;
VACUUM INTO 'backup.sqlite';

-- 21. ATTACH/DETACH and EXPLAIN
ATTACH DATABASE 'other.sqlite' AS other;
DETACH DATABASE other;
EXPLAIN SELECT * FROM people;
EXPLAIN QUERY PLAN SELECT * FROM people WHERE id = 1;

-- 22. Virtual table
CREATE VIRTUAL TABLE docs USING fts5(title, body);

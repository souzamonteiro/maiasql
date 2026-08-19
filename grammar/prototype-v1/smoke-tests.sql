-- MaiaSQL complete grammar smoke tests
-- Keywords are intentionally uppercase.

CREATE TABLE IF NOT EXISTS people (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  age INTEGER CHECK (age >= 0),
  department_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_people_name UNIQUE (name),
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE INDEX IF NOT EXISTS idx_people_age
ON people(age DESC)
WHERE age IS NOT NULL;

INSERT INTO people(name, age)
VALUES ('Ada', 36), ('Grace', 40)
ON CONFLICT(name) DO UPDATE SET age = age + 1
RETURNING id, name;

INSERT OR REPLACE INTO people(id, name, age)
VALUES (1, 'Ada', 37);

SELECT
  p.id,
  p.name,
  CAST(p.age AS TEXT) AS age_text,
  CASE WHEN p.age >= 18 THEN 'adult' ELSE 'minor' END AS category,
  COUNT(*) OVER (
    PARTITION BY p.department_id
    ORDER BY p.age
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS running_count
FROM people AS p
WHERE p.age IS NOT NULL
  AND p.name NOT LIKE '%test%'
  AND p.id IN (SELECT id FROM people WHERE age BETWEEN 18 AND 65)
GROUP BY p.department_id, p.id, p.name, p.age
HAVING COUNT(*) >= 1
ORDER BY p.name COLLATE nocase ASC NULLS LAST
LIMIT 20 OFFSET 0;

SELECT EXISTS(SELECT 1 FROM people WHERE id = 1);

WITH RECURSIVE seq(n) AS (
  VALUES(1)
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 10
)
SELECT * FROM seq;

UPDATE people
SET age = age + 1
FROM departments AS d
WHERE people.department_id = d.id
RETURNING people.id, people.age
ORDER BY people.id
LIMIT 10;

DELETE FROM people
WHERE id = ?
RETURNING id
ORDER BY id
LIMIT 1;

CREATE VIEW adult_people AS
SELECT id, name FROM people WHERE age >= 18;

CREATE TRIGGER people_age_guard
BEFORE UPDATE OF age ON people
FOR EACH ROW
WHEN NEW.age < 0
BEGIN
  SELECT RAISE(ABORT, 'age must be non-negative');
END;

ALTER TABLE people ADD COLUMN active INTEGER DEFAULT 1;
ALTER TABLE people RENAME COLUMN name TO full_name;

DROP INDEX IF EXISTS idx_people_age;
DROP VIEW IF EXISTS adult_people;
DROP TRIGGER IF EXISTS people_age_guard;

BEGIN IMMEDIATE TRANSACTION;
SAVEPOINT before_change;
ROLLBACK TO SAVEPOINT before_change;
RELEASE SAVEPOINT before_change;
COMMIT;

PRAGMA foreign_keys = ON;
ANALYZE;
REINDEX;
VACUUM;

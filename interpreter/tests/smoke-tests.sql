-- sqlite-trex initial parser smoke tests

CREATE TABLE IF NOT EXISTS main.person (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  age INTEGER CHECK (age >= 0),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
) STRICT;

CREATE INDEX IF NOT EXISTS idx_person_name
ON person(name COLLATE nocase ASC)
WHERE name IS NOT NULL;

INSERT INTO person(name, age)
VALUES ('Ada', 36), ('Grace', 40)
ON CONFLICT DO NOTHING
RETURNING id, name;

WITH RECURSIVE seq(n) AS (
  VALUES(1)
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 10
)
SELECT p.id,
       p.name AS display_name,
       count(*) OVER () AS total_rows
FROM person AS p
LEFT JOIN seq AS s ON s.n = p.id
WHERE p.age BETWEEN 18 AND 65
  AND p.name NOT LIKE '%test%'
ORDER BY p.name COLLATE nocase ASC NULLS LAST
LIMIT 20 OFFSET 0;

UPDATE person
SET age = age + 1
WHERE id IN (SELECT id FROM person WHERE age < 100)
RETURNING *;

DELETE FROM person
WHERE id = ?;

BEGIN IMMEDIATE TRANSACTION;
SAVEPOINT before_change;
ROLLBACK TO SAVEPOINT before_change;
RELEASE SAVEPOINT before_change;
COMMIT;

CREATE VIEW adult_people(id, name) AS
SELECT id, name FROM person WHERE age >= 18;

CREATE TRIGGER person_age_guard
BEFORE UPDATE OF age ON person
FOR EACH ROW
WHEN NEW.age < 0
BEGIN
  SELECT RAISE(ABORT, 'age must be non-negative');
END;

PRAGMA foreign_keys = ON;
VACUUM;

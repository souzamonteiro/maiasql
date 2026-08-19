-- MaiaSQL negative parser tests
-- Each uncommented statement is expected to fail.

-- Missing statement separator:
SELECT * FROM a SELECT * FROM b;

-- Invalid JOIN forms:
SELECT * FROM a OUTER JOIN b;
SELECT * FROM a CROSS JOIN b ON a.id = b.id;
SELECT * FROM a NATURAL JOIN b USING (id);

-- Incomplete clauses:
SELECT FROM people;
SELECT * WHERE id = 1;
INSERT INTO people VALUES;
UPDATE people SET;
DELETE people WHERE id = 1;

-- Invalid CREATE TABLE:
CREATE TABLE empty ();
CREATE TABLE broken (id INTEGER,);

-- Invalid expressions:
SELECT 1 +;
SELECT (1,);
SELECT CASE WHEN x THEN END FROM t;

-- Invalid transaction syntax:
BEGIN UNKNOWN;
ROLLBACK SAVEPOINT x;

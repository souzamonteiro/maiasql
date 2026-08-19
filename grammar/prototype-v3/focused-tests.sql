-- Focused ambiguity tests

SELECT COUNT(*) FROM people;
SELECT ABS(age) FROM people;
SELECT people.name FROM people;
SELECT main.people.name FROM main.people;
SELECT json_extract(payload, '$.name') FROM events;
SELECT value FROM json_each('[1,2,3]');
SELECT 1 IS NULL;
SELECT 1 IS NOT NULL;
SELECT 'a' || 'b';
SELECT 8 >> 1;
SELECT ~1;
SELECT payload -> 'name' FROM events;
SELECT payload ->> 'name' FROM events;

-- Must fail because there is no semicolon between statements:
-- SELECT * FROM a SELECT * FROM b;

-- Must fail because keywords are lowercase:
-- select * from people;

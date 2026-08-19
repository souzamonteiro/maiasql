UPDATE people
SET age = age + 1
WHERE name = 'Grace Hopper';

DELETE FROM people
WHERE name = 'Linus Torvalds';

INSERT INTO people (name, age, role)
VALUES ('Margaret Hamilton', 33, 'scientist');

SELECT id, name, age
FROM people
WHERE age >= 30
ORDER BY id ASC;

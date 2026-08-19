CREATE TABLE web_people (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  age INTEGER
);

INSERT INTO web_people (name, age) VALUES ('Barbara Liskov', 41);
INSERT INTO web_people (name, age) VALUES ('Donald Knuth', 45);
UPDATE web_people SET age = age + 1 WHERE name = 'Barbara Liskov';
SELECT id, name, age FROM web_people ORDER BY id ASC;

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

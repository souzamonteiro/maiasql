CREATE TABLE people (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  age INTEGER,
  role TEXT DEFAULT 'engineer',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO people (name, age, role) VALUES
  ('Ada Lovelace', 36, 'mathematician'),
  ('Grace Hopper', 37, 'admiral'),
  ('Linus Torvalds', 55, 'architect');

CREATE TABLE ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,
  amount INTEGER NOT NULL
);

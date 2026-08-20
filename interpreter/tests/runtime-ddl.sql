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

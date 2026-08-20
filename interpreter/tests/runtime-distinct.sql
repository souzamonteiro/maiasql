CREATE TABLE inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku TEXT UNIQUE,
  category TEXT NOT NULL,
  qty INTEGER NOT NULL
);

INSERT INTO inventory (sku, category, qty) VALUES
  ('a-1', 'books', 5),
  ('a-2', 'books', 9),
  ('b-1', 'games', 2),
  ('c-1', 'games', 8);

INSERT OR REPLACE INTO inventory (sku, category, qty)
VALUES ('b-1', 'games', 11);

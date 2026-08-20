CREATE TABLE accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  balance REAL
);

INSERT INTO accounts (email, balance) VALUES ('a@example.com', 10.25);
INSERT OR IGNORE INTO accounts (email, balance) VALUES ('a@example.com', 99.99);
INSERT OR REPLACE INTO accounts (email, balance) VALUES ('a@example.com', 50.75);
INSERT OR ABORT INTO accounts (email, balance) VALUES ('b@example.com', 12.5);

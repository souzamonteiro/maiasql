CREATE TABLE parent (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE,
  label TEXT
);

CREATE TABLE child_cascade (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_code TEXT REFERENCES parent(code) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE child_set_null (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_code TEXT REFERENCES parent(code) ON UPDATE SET NULL ON DELETE SET NULL
);

CREATE TABLE child_restrict (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER REFERENCES parent(id) ON DELETE RESTRICT
);

INSERT INTO parent (code, label) VALUES ('p1', 'alpha');
INSERT INTO child_cascade (parent_code) VALUES ('p1');
INSERT INTO child_set_null (parent_code) VALUES ('p1');
INSERT INTO child_restrict (parent_id) VALUES (1);

CREATE TABLE metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  amount INTEGER
);

INSERT INTO metrics (name, amount) VALUES ('Alpha', -7), (NULL, 3);

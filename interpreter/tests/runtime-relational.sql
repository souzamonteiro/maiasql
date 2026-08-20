CREATE TABLE parents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
);

CREATE TABLE children (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER NOT NULL REFERENCES parents(id),
  name TEXT NOT NULL
);

CREATE TABLE edge_map (
  left_id INTEGER NOT NULL,
  right_id INTEGER NOT NULL,
  FOREIGN KEY (left_id) REFERENCES parents(id),
  FOREIGN KEY (right_id) REFERENCES parents(id)
);

INSERT INTO parents (name) VALUES ('Ada'), ('Grace'), ('Linus');
INSERT INTO children (parent_id, name) VALUES (1, 'Alpha'), (2, 'Beta');
INSERT INTO edge_map (left_id, right_id) VALUES (1, 2), (2, 3);

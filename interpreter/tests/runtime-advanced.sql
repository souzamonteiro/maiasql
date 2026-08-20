CREATE TABLE teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  age INTEGER CHECK (age >= 0)
);

INSERT INTO teams (name) VALUES ('Compiler'), ('Runtime');

INSERT INTO members (team_id, name, age) VALUES
  (1, 'Ada', 36),
  (1, 'Grace', 37),
  (2, 'Linus', 55);

CREATE VIEW adult_members AS
SELECT members.id, members.name, teams.name AS team_name
FROM members
INNER JOIN teams ON members.team_id = teams.id
WHERE members.age >= 18;

CREATE TRIGGER members_age_guard
BEFORE UPDATE OF age ON members
FOR EACH ROW
WHEN NEW.age < 0
BEGIN
  SELECT RAISE(ABORT, 'age must be non-negative');
END;

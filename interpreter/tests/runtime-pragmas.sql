CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  title TEXT DEFAULT 'untitled'
);

CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_code TEXT NOT NULL REFERENCES projects(code) ON DELETE CASCADE ON UPDATE SET NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'todo'
);

INSERT INTO projects (code, title) VALUES
  ('core', 'Runtime Core'),
  ('websql', 'WebSQL Adapter');

CREATE UNIQUE INDEX idx_projects_code ON projects(code);
CREATE INDEX idx_tasks_open ON tasks(status) WHERE status = 'todo';

PRAGMA user_version = 7;

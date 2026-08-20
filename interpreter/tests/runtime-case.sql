CREATE TABLE task_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  priority INTEGER NOT NULL,
  status TEXT,
  effort INTEGER NOT NULL
);

INSERT INTO task_queue (title, priority, status, effort) VALUES
  ('parser', 1, 'done', 2),
  ('storage', 2, 'doing', 5),
  ('adapter', 3, NULL, 8);

UPDATE task_queue
SET status = CASE
  WHEN priority = 1 THEN 'ready'
  WHEN priority = 2 THEN 'active'
  ELSE 'queued'
END
WHERE status IS NULL;

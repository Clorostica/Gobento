CREATE TABLE IF NOT EXISTS task_comments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  task_id TEXT NOT NULL REFERENCES task_list(id) ON DELETE CASCADE,
  voter_session TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Anonymous',
  comment TEXT NOT NULL,
  created_at DATETIME DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);

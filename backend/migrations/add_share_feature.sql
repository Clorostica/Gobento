ALTER TABLE task_list ADD COLUMN share_token TEXT;
ALTER TABLE task_list ADD COLUMN date_option_1 TEXT;
ALTER TABLE task_list ADD COLUMN date_option_2 TEXT;

CREATE TABLE IF NOT EXISTS task_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT NOT NULL,
  selected_option INTEGER NOT NULL CHECK (selected_option IN (1, 2)),
  voter_session TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (task_id, voter_session),
  FOREIGN KEY (task_id) REFERENCES task_list(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_task_votes_task_id ON task_votes(task_id);
CREATE INDEX IF NOT EXISTS idx_task_list_share_token ON task_list(share_token);

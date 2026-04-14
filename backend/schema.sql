-- Cloudflare D1 Schema (SQLite)
-- Run with: wrangler d1 execute <DB_NAME> --file=schema.sql

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  username TEXT UNIQUE,
  avatar_url TEXT
);

-- Task list table
CREATE TABLE IF NOT EXISTS task_list (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL,
  text TEXT,
  title TEXT,
  color_class TEXT,
  address TEXT,
  due_date TEXT,
  start_time TEXT,
  image_url TEXT,
  shared_from_user_id TEXT,
  original_event_id TEXT,
  position INTEGER,
  liked INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Friends table (unidirectional follow: user_id follows friend_user_id)
CREATE TABLE IF NOT EXISTS friends (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  friend_user_id TEXT NOT NULL,
  UNIQUE (user_id, friend_user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (friend_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Friendships table (bidirectional friendship requests)
CREATE TABLE IF NOT EXISTS friendships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id_1 TEXT NOT NULL,
  user_id_2 TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  UNIQUE (user_id_1, user_id_2),
  FOREIGN KEY (user_id_1) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id_2) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_list_user_id ON task_list(user_id);
CREATE INDEX IF NOT EXISTS idx_task_list_status ON task_list(status);
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_user_id ON friends(friend_user_id);

-- ブランドブックのアンケート回答。1回答1行。答えの中身は質問IDをキーにしたJSONで持つ。
CREATE TABLE IF NOT EXISTS answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  variant TEXT NOT NULL,
  answers TEXT NOT NULL
);

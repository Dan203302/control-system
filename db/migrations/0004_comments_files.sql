CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  defect_id INT NOT NULL REFERENCES defects(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_comments_defect_id ON comments(defect_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);

CREATE TABLE IF NOT EXISTS files (
  id SERIAL PRIMARY KEY,
  defect_id INT NOT NULL REFERENCES defects(id) ON DELETE CASCADE,
  uploader_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  filename TEXT NOT NULL,
  storage_key TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  size_bytes INT NOT NULL,
  checksum_sha256 TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_files_defect_id ON files(defect_id);
CREATE INDEX IF NOT EXISTS idx_files_uploader_id ON files(uploader_id);

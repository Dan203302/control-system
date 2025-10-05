CREATE TABLE IF NOT EXISTS defects (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  priority TEXT NOT NULL DEFAULT 'medium',
  project_id INT NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  object_id INT NOT NULL REFERENCES objects(id) ON DELETE RESTRICT,
  stage_id INT REFERENCES stages(id) ON DELETE SET NULL,
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  due_date TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_defects_project_id ON defects(project_id);
CREATE INDEX IF NOT EXISTS idx_defects_object_id ON defects(object_id);
CREATE INDEX IF NOT EXISTS idx_defects_stage_id ON defects(stage_id);
CREATE INDEX IF NOT EXISTS idx_defects_assignee_id ON defects(assignee_id);
CREATE INDEX IF NOT EXISTS idx_defects_status ON defects(status);
CREATE INDEX IF NOT EXISTS idx_defects_priority ON defects(priority);

CREATE TABLE IF NOT EXISTS defect_history (
  id SERIAL PRIMARY KEY,
  defect_id INT NOT NULL REFERENCES defects(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_defect_history_defect_id ON defect_history(defect_id);

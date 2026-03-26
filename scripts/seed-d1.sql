CREATE TABLE IF NOT EXISTS alias_metadata (
  cf_rule_id TEXT PRIMARY KEY,
  alias TEXT NOT NULL UNIQUE,
  service TEXT,
  category TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_alias_metadata_alias ON alias_metadata(alias);
CREATE INDEX IF NOT EXISTS idx_alias_metadata_category ON alias_metadata(category);

-- Drop existing tables (use with caution in development)
DROP TABLE IF EXISTS videos;
DROP TABLE IF EXISTS models;

-- MODELS
CREATE TABLE models (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  slug         TEXT    NOT NULL UNIQUE,
  display_name TEXT    NOT NULL,
  avatar_url   TEXT,
  banner_url   TEXT,
  bio          TEXT,
  created_at   TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- VIDEOS
CREATE TABLE videos (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  slug             TEXT    NOT NULL UNIQUE,
  title            TEXT    NOT NULL,
  thumbnail_url    TEXT,
  video_url        TEXT    NOT NULL,
  channel_name     TEXT,
  views            INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER,
  description      TEXT,
  model_id         INTEGER,
  created_at       TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (model_id) REFERENCES models(id)
);

CREATE INDEX idx_models_slug       ON models(slug);
CREATE INDEX idx_videos_slug       ON videos(slug);
CREATE INDEX idx_videos_created_at ON videos(created_at);
CREATE INDEX idx_videos_views      ON videos(views);
CREATE INDEX idx_videos_model_id   ON videos(model_id);

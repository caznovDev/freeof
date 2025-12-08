
CREATE TABLE models(
 id INTEGER PRIMARY KEY,
 slug TEXT UNIQUE,
 display_name TEXT,
 avatar_url TEXT,
 banner_url TEXT,
 bio TEXT,
 adult_site_url TEXT,
 safe_thumbnail_url TEXT,
 is_featured INTEGER DEFAULT 0,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE videos(
 id INTEGER PRIMARY KEY,
 slug TEXT UNIQUE,
 title TEXT,
 thumbnail_url TEXT,
 video_url TEXT,
 is_sfw INTEGER DEFAULT 1,
 model_id INTEGER,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

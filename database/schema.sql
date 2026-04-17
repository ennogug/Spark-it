-- Spark'it Image Gallery Database Schema
-- SQLite database for storing image metadata

CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_path TEXT NOT NULL UNIQUE,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT,
    is_approved BOOLEAN DEFAULT 1,
    upload_token TEXT UNIQUE,
    checksum TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS image_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_id INTEGER NOT NULL,
    tag TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (image_id) REFERENCES images (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_images_uploaded_at ON images (uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_images_checksum ON images (checksum);
CREATE INDEX IF NOT EXISTS idx_image_tags_image_id ON image_tags (image_id);
CREATE INDEX IF NOT EXISTS idx_image_tags_tag ON image_tags (tag);

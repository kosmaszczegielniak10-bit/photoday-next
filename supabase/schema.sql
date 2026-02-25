-- PhotoDay 2.0 — Supabase PostgreSQL Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- Based on the original SQLite schema from server/db.js

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id         BIGSERIAL PRIMARY KEY,
  username   TEXT UNIQUE NOT NULL,
  email      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name  TEXT NOT NULL,
  bio        TEXT DEFAULT '',
  avatar_path TEXT DEFAULT NULL,
  created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

-- ── Entries (Journal) ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS entries (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date        TEXT NOT NULL,
  photo_path  TEXT,
  description TEXT DEFAULT '',
  mood        TEXT DEFAULT '',
  privacy     TEXT DEFAULT 'private',
  created_at  BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at  BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  deleted_at  BIGINT DEFAULT NULL,
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_entries_user_date     ON entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_entries_user_privacy  ON entries(user_id, privacy);

-- ── Friendships ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS friendships (
  id           BIGSERIAL PRIMARY KEY,
  requester_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status       TEXT DEFAULT 'pending',
  created_at   BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  UNIQUE(requester_id, receiver_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_receiver  ON friendships(receiver_id);

-- ── Reactions ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reactions (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_id   BIGINT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  type       TEXT DEFAULT 'like',
  created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  UNIQUE(user_id, entry_id)
);

-- ── Notifications ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  entity_id  BIGINT,
  is_read    INTEGER DEFAULT 0,
  created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- ── Albums ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS albums (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  cover_path  TEXT DEFAULT NULL,
  created_at  BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

CREATE TABLE IF NOT EXISTS album_entries (
  album_id   BIGINT NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  entry_id   BIGINT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  added_at   BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  PRIMARY KEY(album_id, entry_id)
);

-- ── Social: Posts ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS posts (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_id   BIGINT DEFAULT NULL REFERENCES entries(id) ON DELETE SET NULL,
  photo_path TEXT DEFAULT NULL,
  caption    TEXT DEFAULT '',
  privacy    TEXT DEFAULT 'friends',
  created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

CREATE INDEX IF NOT EXISTS idx_posts_user    ON posts(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_posts_privacy ON posts(privacy, created_at);

-- ── Social: Comments ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS comments (
  id         BIGSERIAL PRIMARY KEY,
  post_id    BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text       TEXT NOT NULL,
  created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id, created_at);

-- ── Social: Post Likes ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS post_likes (
  post_id    BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  PRIMARY KEY(post_id, user_id)
);

-- ── Social: Stories ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS stories (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  photo_path  TEXT NOT NULL,
  caption     TEXT DEFAULT '',
  privacy     TEXT DEFAULT 'friends',
  expires_at  BIGINT NOT NULL,
  created_at  BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

CREATE TABLE IF NOT EXISTS story_views (
  story_id   BIGINT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  viewer_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_at  BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  PRIMARY KEY(story_id, viewer_id)
);

CREATE INDEX IF NOT EXISTS idx_stories_user ON stories(user_id, expires_at);

-- ── Social: Direct Messages ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS conversations (
  id              BIGSERIAL PRIMARY KEY,
  user_a          BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b          BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  -- user_a is always the smaller ID (enforced at API layer: user_a = MIN, user_b = MAX)
  CHECK (user_a < user_b),
  UNIQUE(user_a, user_b)
);


CREATE TABLE IF NOT EXISTS messages (
  id              BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text            TEXT NOT NULL DEFAULT '',
  photo_path      TEXT DEFAULT NULL,
  is_read         INTEGER DEFAULT 0,
  created_at      BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

CREATE INDEX IF NOT EXISTS idx_messages_conv   ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(conversation_id, is_read);

-- ── Supabase Realtime ─────────────────────────────────────────────────────────
-- Enable realtime on the messages table so the frontend can subscribe
-- Run this separately in the Supabase Dashboard → Realtime → Tables

-- ALTER TABLE messages REPLICA IDENTITY FULL;

-- ── Row Level Security ────────────────────────────────────────────────────────
-- We use a custom JWT (not Supabase Auth), so RLS is enforced at the API route level.
-- Disable RLS on all tables — access control is in our Next.js API routes.

ALTER TABLE users         DISABLE ROW LEVEL SECURITY;
ALTER TABLE entries       DISABLE ROW LEVEL SECURITY;
ALTER TABLE friendships   DISABLE ROW LEVEL SECURITY;
ALTER TABLE reactions     DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE albums        DISABLE ROW LEVEL SECURITY;
ALTER TABLE album_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE posts         DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments      DISABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes    DISABLE ROW LEVEL SECURITY;
ALTER TABLE stories       DISABLE ROW LEVEL SECURITY;
ALTER TABLE story_views   DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages      DISABLE ROW LEVEL SECURITY;

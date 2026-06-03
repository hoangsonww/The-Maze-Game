-- Anonymous gameplay schema for The Maze Game.
--
-- These tables back the repository's `postgres` driver (leaderboard, game
-- sessions, achievements) and intentionally do NOT depend on the users table,
-- so anonymous players work exactly like they do on the Mongo driver.
--
-- The richer, user-centric relational model lives in schema.sql and is used by
-- the authenticated platform routes (auth, social, mazes, challenges, admin).
--
-- Apply with:  psql "$DATABASE_URL" -f server/database/schema-game.sql

-- gen_random_uuid() is built in on PostgreSQL 13+. Fallback for older servers:
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Leaderboard ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leaderboard_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_name     VARCHAR(50)  NOT NULL,
    score           INTEGER      NOT NULL,
    completion_time INTEGER      NOT NULL,
    difficulty      VARCHAR(20)  NOT NULL DEFAULT 'medium',
    moves           INTEGER      NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lb_entries_score      ON leaderboard_entries (score DESC, completion_time ASC);
CREATE INDEX IF NOT EXISTS idx_lb_entries_created_at ON leaderboard_entries (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lb_entries_difficulty ON leaderboard_entries (difficulty);

-- Game sessions (anonymous) -------------------------------------------------
CREATE TABLE IF NOT EXISTS game_sessions_anon (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id       VARCHAR(100),
    difficulty      VARCHAR(20)  NOT NULL DEFAULT 'medium',
    mode            VARCHAR(20)  NOT NULL DEFAULT 'single',
    start_time      BIGINT       NOT NULL,   -- epoch ms (matches the JS clock)
    end_time        BIGINT,
    completion_time INTEGER,
    moves           INTEGER      NOT NULL DEFAULT 0,
    hints_used      INTEGER      NOT NULL DEFAULT 0,
    score           INTEGER,
    status          VARCHAR(20)  NOT NULL DEFAULT 'in_progress'
                    CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_anon_status    ON game_sessions_anon (status);
CREATE INDEX IF NOT EXISTS idx_sessions_anon_player_id ON game_sessions_anon (player_id);

-- Player achievements (anonymous) -------------------------------------------
CREATE TABLE IF NOT EXISTS player_achievements (
    player_id      VARCHAR(100) NOT NULL,
    achievement_id VARCHAR(50)  NOT NULL,
    unlocked_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    PRIMARY KEY (player_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_player_achievements_player ON player_achievements (player_id);

-- User accounts (anonymous-gameplay schema; mirrors the Mongo `users` doc) ----
-- Stats and recent games are stored as JSONB for full parity with the Mongo
-- driver without a wide column set.
CREATE TABLE IF NOT EXISTS users_app (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username       VARCHAR(20)  NOT NULL,
    username_lower VARCHAR(20)  NOT NULL UNIQUE,
    email          VARCHAR(255) NOT NULL,
    email_lower    VARCHAR(255) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    role           VARCHAR(20)  NOT NULL DEFAULT 'user',
    stats          JSONB        NOT NULL DEFAULT '{}'::jsonb,
    recent_games   JSONB        NOT NULL DEFAULT '[]'::jsonb,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    last_login     TIMESTAMPTZ
);

-- ============================================
-- VEDICAS SUPABASE SCHEMA
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable Row Level Security on all tables
-- This ensures users can only access their own data

-- 1. PROFILES (User birth data, chart info)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    birth_date DATE,
    birth_time TIME,
    birth_place TEXT,
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    timezone TEXT,
    chart_data JSONB,  -- Store the full birth chart here
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- 2. SEEDS (Habits/Goals)
CREATE TABLE IF NOT EXISTS seeds (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    local_id INTEGER,  -- Local Dexie ID for sync
    title TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    description TEXT,
    frequency TEXT DEFAULT 'daily',
    difficulty TEXT DEFAULT 'Medium',
    gurus_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, local_id)
);

ALTER TABLE seeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own seeds" ON seeds
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own seeds" ON seeds
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own seeds" ON seeds
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own seeds" ON seeds
    FOR DELETE USING (auth.uid() = user_id);

-- 3. SEED_LOGS (Watering/Completion history)
CREATE TABLE IF NOT EXISTS seed_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    local_id INTEGER,
    seed_id INTEGER NOT NULL,
    date DATE NOT NULL,
    status TEXT DEFAULT 'completed',
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, local_id)
);

ALTER TABLE seed_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs" ON seed_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs" ON seed_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own logs" ON seed_logs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own logs" ON seed_logs
    FOR DELETE USING (auth.uid() = user_id);

-- 4. WISDOM (Notes from Gurus)
CREATE TABLE IF NOT EXISTS wisdom (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    local_id INTEGER,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    content TEXT,
    guru_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, local_id)
);

ALTER TABLE wisdom ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wisdom" ON wisdom
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wisdom" ON wisdom
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wisdom" ON wisdom
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wisdom" ON wisdom
    FOR DELETE USING (auth.uid() = user_id);

-- 5. MESSAGES (Chat history with Gurus)
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    local_id INTEGER,
    guru_id TEXT NOT NULL,
    role TEXT NOT NULL,  -- 'user' or 'assistant'
    content TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, local_id)
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" ON messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own messages" ON messages
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages" ON messages
    FOR DELETE USING (auth.uid() = user_id);

-- 6. CHECKINS (Daily alignment/streak tracking)
CREATE TABLE IF NOT EXISTS checkins (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    local_id INTEGER,
    date DATE NOT NULL,
    panchang JSONB,  -- Daily Panchang data
    seeds_watered INTEGER DEFAULT 0,
    seeds_total INTEGER DEFAULT 0,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own checkins" ON checkins
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkins" ON checkins
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkins" ON checkins
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own checkins" ON checkins
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- ENABLE REALTIME (for cross-device sync)
-- ============================================

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE seeds;
ALTER PUBLICATION supabase_realtime ADD TABLE seed_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE wisdom;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE checkins;

-- ============================================
-- INDEXES for better query performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_seeds_user ON seeds(user_id);
CREATE INDEX IF NOT EXISTS idx_seed_logs_user ON seed_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_seed_logs_seed ON seed_logs(seed_id);
CREATE INDEX IF NOT EXISTS idx_wisdom_user ON wisdom(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_guru ON messages(guru_id);
CREATE INDEX IF NOT EXISTS idx_checkins_user ON checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_date ON checkins(date);

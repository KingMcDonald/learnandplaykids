-- Supabase SQL Setup for Learn & Play Kids
-- Run this in Supabase SQL Editor to create all required tables

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  total_score INTEGER DEFAULT 0,
  accuracy DECIMAL(5, 2),
  activities INTEGER DEFAULT 0,
  completed_activities INTEGER DEFAULT 0,
  response_time INTEGER,
  session_count INTEGER DEFAULT 0,
  device_count INTEGER DEFAULT 1,
  last_login TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create Learning Curve Table (for detailed tracking)
CREATE TABLE IF NOT EXISTS public.learning_curve (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  question_number INTEGER,
  accuracy DECIMAL(5, 2),
  timestamp TIMESTAMP DEFAULT NOW()
);

-- 3. Create Session Data Table (for research)
CREATE TABLE IF NOT EXISTS public.session_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  activity_name VARCHAR(255),
  question_number INTEGER,
  is_correct BOOLEAN,
  points_earned INTEGER,
  difficulty VARCHAR(50),
  response_time INTEGER,
  attempt_number INTEGER,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- 4. Create Activity Progress Table
CREATE TABLE IF NOT EXISTS public.activity_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  activity_name VARCHAR(255) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  score INTEGER DEFAULT 0,
  accuracy DECIMAL(5, 2),
  plant_stage INTEGER DEFAULT 0,
  session_count INTEGER DEFAULT 0,
  timestamp TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, activity_name)
);

-- 5. Create Indexes for Performance
CREATE INDEX idx_users_name ON public.users(name);
CREATE INDEX idx_users_created_at ON public.users(created_at);
CREATE INDEX idx_users_last_login ON public.users(last_login);
CREATE INDEX idx_learning_curve_user_id ON public.learning_curve(user_id);
CREATE INDEX idx_session_data_user_id ON public.session_data(user_id);
CREATE INDEX idx_activity_progress_user_id ON public.activity_progress(user_id);

-- 6. Enable Row Level Security (RLS) for security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_curve ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_progress ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS Policies (allow all for now - restrict later)
CREATE POLICY "Allow public read" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.users FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON public.users FOR DELETE USING (true);

CREATE POLICY "Allow public read" ON public.learning_curve FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.learning_curve FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read" ON public.session_data FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.session_data FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read" ON public.activity_progress FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.activity_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.activity_progress FOR UPDATE USING (true);

-- 8. Create Functions for Auto-Update
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_timestamp
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION update_users_updated_at();

-- Done! Your Supabase tables are ready

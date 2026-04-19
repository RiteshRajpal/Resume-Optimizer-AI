-- ─────────────────────────────────────────────────────────────────────────────
-- AI Resume Editor — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users (mirrors Supabase Auth) ────────────────────────────────────────────

-- This table is for additional profile data (optional)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  full_name   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Resumes ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.resumes (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Session identifier for unauthenticated users
  session_id           TEXT,
  -- Content
  original_resume_text TEXT NOT NULL,
  edited_resume_text   TEXT NOT NULL,
  job_description      TEXT NOT NULL,
  -- Metadata
  file_name            TEXT,
  file_url             TEXT,          -- Supabase Storage URL
  ats_score            INTEGER,       -- 0–100 keyword match score
  word_count_original  INTEGER,
  word_count_edited    INTEGER,
  -- Timestamps
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ── Version History ───────────────────────────────────────────────────────────
-- Optional: track multiple optimizations per resume session
CREATE TABLE IF NOT EXISTS public.resume_versions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resume_id     UUID REFERENCES public.resumes(id) ON DELETE CASCADE,
  version       INTEGER NOT NULL DEFAULT 1,
  edited_text   TEXT NOT NULL,
  ats_score     INTEGER,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_resumes_user_id    ON public.resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_session_id ON public.resumes(session_id);
CREATE INDEX IF NOT EXISTS idx_resumes_created_at ON public.resumes(created_at DESC);

-- ── Auto-update updated_at ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.resumes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Authenticated users can only see their own resumes
CREATE POLICY "Users see own resumes"
  ON public.resumes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own resumes"
  ON public.resumes FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow anonymous inserts (session_id based, no auth required)
CREATE POLICY "Anonymous inserts allowed"
  ON public.resumes FOR INSERT
  WITH CHECK (user_id IS NULL);

-- Profiles
CREATE POLICY "Users see own profile"
  ON public.profiles FOR ALL
  USING (auth.uid() = id);

-- ── Storage Bucket Setup ──────────────────────────────────────────────────────
-- Run this AFTER creating the "resumes" bucket in the Supabase Dashboard:
-- Storage → New Bucket → Name: "resumes" → Public: false

INSERT INTO storage.buckets (id, name, public)
  VALUES ('resumes', 'resumes', false)
  ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'resumes' AND auth.role() = 'authenticated');

CREATE POLICY "Owner read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ─────────────────────────────────────────────────────────────────────────────
-- DONE! Verify with:
--   SELECT * FROM public.resumes LIMIT 5;
-- ─────────────────────────────────────────────────────────────────────────────

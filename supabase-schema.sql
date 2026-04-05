
-- ═══════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Users table (extends Supabase auth.users) ────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  full_name   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Resumes table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.resumes (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- File metadata
  file_name             TEXT,
  file_url              TEXT,
  
  -- Content
  original_resume_text  TEXT NOT NULL,
  edited_resume_text    TEXT,
  job_description       TEXT NOT NULL,
  
  -- Metrics
  keyword_score         SMALLINT CHECK (keyword_score >= 0 AND keyword_score <= 100),
  
  -- Timestamps
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER resumes_updated_at
  BEFORE UPDATE ON public.resumes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_created_at ON public.resumes(created_at DESC);

-- ─── RLS Policies ─────────────────────────────────────────────
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Resumes: users can CRUD their own resumes
CREATE POLICY "Users can view own resumes"
  ON public.resumes FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert resumes"
  ON public.resumes FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own resumes"
  ON public.resumes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own resumes"
  ON public.resumes FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can do everything (for API routes)
CREATE POLICY "Service role has full access to resumes"
  ON public.resumes
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to profiles"
  ON public.profiles
  USING (auth.role() = 'service_role');

-- ─── Storage Bucket ───────────────────────────────────────────
-- Run this to create the storage bucket:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resume-files',
  'resume-files',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can upload resume files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'resume-files');

CREATE POLICY "Users can view their own resume files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'resume-files');

CREATE POLICY "Service role can manage all files"
  ON storage.objects
  TO service_role
  USING (true);

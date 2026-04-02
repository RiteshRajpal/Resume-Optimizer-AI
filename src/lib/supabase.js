// src/lib/supabase.js
// ─────────────────────────────────────────────────────────────────────────────
// Supabase client for database and storage operations
// Install: npm install @supabase/supabase-js
// ─────────────────────────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  || '';
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const isConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// ── Resume Operations ─────────────────────────────────────────────────────────

/**
 * Save a resume optimization result to the database
 */
export async function saveResume({
  originalText,
  editedText,
  jobDescription,
  fileName,
  fileUrl,
  atsScore,
  userId = null,
  sessionId = null,
}) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('resumes')
    .insert({
      user_id: userId,
      session_id: sessionId,
      original_resume_text: originalText,
      edited_resume_text: editedText,
      job_description: jobDescription,
      file_name: fileName,
      file_url: fileUrl,
      ats_score: atsScore,
      word_count_original: originalText.split(/\s+/).length,
      word_count_edited: editedText.split(/\s+/).length,
    })
    .select()
    .single();

  if (error) { console.error('Supabase insert error:', error); return null; }
  return data;
}

/**
 * Upload a resume file to Supabase Storage
 * @returns {string|null} Public/signed URL
 */
export async function uploadResumeFile(file, userId = 'anonymous') {
  if (!supabase) return null;

  const timestamp = Date.now();
  const ext = file.name.split('.').pop();
  const path = `${userId}/${timestamp}-${file.name}`;

  const { data, error } = await supabase.storage
    .from('resumes')
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) { console.error('Storage upload error:', error); return null; }

  // Get a signed URL valid for 1 hour
  const { data: urlData } = await supabase.storage
    .from('resumes')
    .createSignedUrl(path, 3600);

  return urlData?.signedUrl || null;
}

/**
 * Fetch resume version history for a user
 */
export async function getResumeHistory(userId, limit = 10) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('resumes')
    .select('id, file_name, ats_score, created_at, word_count_edited')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) { console.error('History fetch error:', error); return []; }
  return data || [];
}

/**
 * Fetch a single resume by ID
 */
export async function getResume(id) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export { isConfigured as supabaseConfigured };

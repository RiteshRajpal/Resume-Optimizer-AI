import { createClient, SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

/** Browser client (anon key). Only created when env is set — avoids crashing API routes without Supabase. */
export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!browserClient) browserClient = createClient(url, key);
  return browserClient;
}

/** Server admin client (service role). Throws if URL or service key missing. */
export function supabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

// ─── Types ───────────────────────────────────────────────────
export interface Resume {
  id: string;
  user_id: string | null;
  original_resume_text: string;
  edited_resume_text: string | null;
  job_description: string;
  keyword_score: number | null;
  file_name: string | null;
  file_url: string | null;
  created_at: string;
}

// ─── Resume operations ────────────────────────────────────────
export async function saveResume(data: {
  originalText: string;
  editedText?: string;
  jobDescription: string;
  keywordScore?: number;
  fileName?: string;
  fileUrl?: string;
  userId?: string;
}): Promise<Resume> {
  const { data: resume, error } = await supabaseAdmin()
    .from("resumes")
    .insert({
      user_id: data.userId ?? null,
      original_resume_text: data.originalText,
      edited_resume_text: data.editedText ?? null,
      job_description: data.jobDescription,
      keyword_score: data.keywordScore ?? null,
      file_name: data.fileName ?? null,
      file_url: data.fileUrl ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to save resume: ${error.message}`);
  return resume;
}

export async function updateResumeEdited(
  id: string,
  editedText: string,
  keywordScore?: number
): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("resumes")
    .update({
      edited_resume_text: editedText,
      keyword_score: keywordScore ?? null,
    })
    .eq("id", id);

  if (error) throw new Error(`Failed to update resume: ${error.message}`);
}

export async function getResume(id: string): Promise<Resume> {
  const { data, error } = await supabaseAdmin()
    .from("resumes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(`Resume not found: ${error.message}`);
  return data;
}

// ─── Storage ──────────────────────────────────────────────────
export async function uploadResumeFile(
  file: File,
  resumeId: string
): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `resumes/${resumeId}.${ext}`;

  const { error } = await supabaseAdmin().storage
    .from("resume-files")
    .upload(path, file, { upsert: true });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabaseAdmin().storage
    .from("resume-files")
    .getPublicUrl(path);

  return data.publicUrl;
}

// src/lib/ai.js
// ─────────────────────────────────────────────────────────────────────────────
// Claude AI integration for resume optimization
// 
// SECURITY NOTE: In production, proxy this through a backend API route so your
// Anthropic key is never exposed in the browser bundle.
//
// Next.js example:
//   pages/api/optimize.js  or  app/api/optimize/route.js
// Express example:
//   app.post('/api/optimize', async (req, res) => { ... })
// ─────────────────────────────────────────────────────────────────────────────

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

const SYSTEM_PROMPT = `You are an elite professional resume writer and ATS optimization specialist with 15 years of experience helping candidates land roles at top companies.

Your task is to rewrite the provided resume to perfectly match the given job description while maintaining complete authenticity — never fabricate experience, metrics, or skills the candidate doesn't have.

OPTIMIZATION RULES:
1. KEYWORDS: Extract and naturally incorporate relevant technical and domain keywords from the JD throughout the resume
2. ACTION VERBS: Begin every bullet point with a powerful action verb (Spearheaded, Engineered, Architected, Delivered, Optimized, Reduced, Scaled, Led, Drove, Automated...)
3. QUANTIFICATION: Add realistic metrics wherever possible (%, $, headcount, time saved, scale) — only if plausible from context
4. RELEVANCE: Reorder or emphasize experiences most relevant to this specific role; de-emphasize unrelated content
5. ATS FORMAT: Use clean section headers in ALL CAPS, standard section names (EXPERIENCE, EDUCATION, SKILLS, etc.), consistent bullet format with •
6. CONCISENESS: Keep bullet points to 1-2 lines max; remove filler words
7. SUMMARY: Write or improve the professional summary to directly address the role's core requirements

OUTPUT: Return ONLY the improved resume text. No commentary, no preamble, no markdown code fences, no explanations. Just the clean resume.`;

/**
 * Optimize a resume for a specific job description using Claude AI.
 * 
 * @param {string} resumeText - Extracted text from uploaded resume
 * @param {string} jobDescription - Full job description text
 * @param {Object} options - Optional configuration
 * @param {string} options.apiKey - Override API key (default: env var)
 * @param {string} options.proxyUrl - Use a backend proxy URL instead of direct API
 * @returns {Promise<string>} - Optimized resume text
 */
export async function optimizeResume(resumeText, jobDescription, options = {}) {
  const apiKey = options.apiKey || import.meta.env.VITE_ANTHROPIC_API_KEY;
  const endpoint = options.proxyUrl || ANTHROPIC_API_URL;

  if (!apiKey && !options.proxyUrl) {
    throw new Error('No Anthropic API key found. Set VITE_ANTHROPIC_API_KEY in .env.local');
  }

  const payload = {
    model: MODEL,
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `ORIGINAL RESUME:\n${resumeText}\n\n---\n\nJOB DESCRIPTION:\n${jobDescription}\n\n---\n\nRewrite the resume above to be perfectly tailored for this job. Output only the improved resume text.`
    }]
  };

  const headers = {
    'Content-Type': 'application/json',
    ...(apiKey && { 'x-api-key': apiKey }),
    ...(apiKey && { 'anthropic-version': '2023-06-01' }),
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const msg = errorData?.error?.message || `API error ${response.status}`;
    throw new Error(msg);
  }

  const data = await response.json();
  const text = data.content?.find(b => b.type === 'text')?.text || '';
  
  if (!text) throw new Error('AI returned empty response');
  return text.trim();
}

/**
 * Calculate ATS keyword match score between resume and job description.
 * 
 * @param {string} resumeText
 * @param {string} jdText
 * @returns {{ score: number, keywords: string[], matched: string[], missing: string[] }}
 */
export function calcKeywordScore(resumeText, jdText) {
  const STOP_WORDS = new Set([
    'with','that','this','from','have','will','your','their','been','also',
    'more','they','what','when','were','than','then','which','about','after',
    'before','where','while','would','could','should','these','those','other',
    'some','such','into','over','under','both','each','many','most','must',
    'need','only','same','very','well','work','year','time','team','role'
  ]);

  const words = jdText.toLowerCase().match(/\b[a-z][a-z0-9+#.]{2,}\b/g) || [];
  const freq = {};
  words.forEach(w => {
    if (!STOP_WORDS.has(w)) freq[w] = (freq[w] || 0) + 1;
  });

  // Top 25 most frequent meaningful words
  const topKws = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([word]) => word);

  const resumeLower = resumeText.toLowerCase();
  const matched = topKws.filter(k => resumeLower.includes(k));
  const missing = topKws.filter(k => !resumeLower.includes(k));
  const score = Math.round((matched.length / Math.max(topKws.length, 1)) * 100);

  return { score, keywords: topKws, matched, missing };
}

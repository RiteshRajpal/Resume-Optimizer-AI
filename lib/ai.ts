import Anthropic from "@anthropic-ai/sdk";
import {
  getAnthropicApiKey,
  getAnthropicModel,
  getGeminiApiKey,
  getGeminiModel,
  getGroqApiKey,
  getGroqModel,
  getLlmFallbackOrderRaw,
  getOpenAiApiKey,
  getOpenAiModel,
  isAutoDemoFallbackEnabled,
  isExplicitDemoOptimize,
} from "@/lib/env.server";

let anthropicClient: Anthropic | null = null;

function getAnthropic(): Anthropic {
  const key = getAnthropicApiKey();
  if (!key) throw new Error("ANTHROPIC_API_KEY missing");
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: key });
  }
  return anthropicClient;
}

export type OptimizeMeta = {
  editedResume: string;
  keywordScore: number;
  /** Which backend produced the text (for UI messaging). */
  providerUsed?: "groq" | "openai" | "gemini" | "anthropic" | "demo";
  /** True when no paid LLM succeeded and demo heuristics were used. */
  demoMode?: boolean;
};

function buildPrompts(resumeText: string, jobDescription: string) {
  const system = `You are an expert resume writer and ATS optimization specialist with 15+ years of experience helping candidates land interviews at top companies.

Your task is to rewrite and improve resumes to perfectly match job descriptions while maintaining authenticity.

RULES:
- Keep ALL factual information (companies, titles, dates, education) exactly as provided
- DO NOT invent or fabricate any experience, skills, or achievements
- Use strong action verbs (Led, Engineered, Architected, Delivered, Accelerated, etc.)
- Add quantifiable metrics where implied (e.g., "improved performance" → "improved performance by ~30%")
- Mirror exact keywords and phrases from the job description
- Ensure ATS-friendliness: clear section headers, no tables/columns in text output
- Keep formatting clean with clear section breaks using "---" between sections
- Output ONLY the improved resume text, no commentary`;

  const user = `RESUME TO OPTIMIZE:
---
${resumeText}
---

JOB DESCRIPTION:
---
${jobDescription}
---

Rewrite the resume above to maximally match this job description. Maintain all factual accuracy while:
1. Injecting relevant keywords from the JD naturally throughout
2. Strengthening bullet points with powerful action verbs
3. Adding/implying quantified metrics where appropriate
4. Restructuring descriptions to highlight most relevant experience first
5. Ensuring every bullet point connects to a skill/requirement from the JD

Return ONLY the improved resume text with clean formatting.`;

  return { system, user };
}

function parseProviderOrder(): string[] {
  const raw = getLlmFallbackOrderRaw();
  if (!raw) return ["groq", "openai", "gemini", "anthropic"];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function jdKeywordPhrases(jobDescription: string, limit: number): string[] {
  const stop = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "as", "is", "was", "are", "were", "be",
    "been", "being", "have", "has", "had", "do", "does", "did", "will",
    "would", "could", "should", "may", "might", "shall", "can", "need",
    "our", "we", "you", "your", "their", "this", "that", "these", "those",
    "looking", "join", "team", "role", "position", "job", "work",
  ]);
  const words = jobDescription
    .toLowerCase()
    .replace(/[^a-z0-9\s+#.-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stop.has(w));
  const freq = new Map<string, number>();
  for (const w of words) freq.set(w, (freq.get(w) || 0) + 1);
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .map(([w]) => w)
    .slice(0, limit);
}

/** Offline / zero-API fallback: keeps original resume, adds JD keyword alignment block. */
export function demoOptimizeResume(
  resumeText: string,
  jobDescription: string
): Omit<OptimizeMeta, "providerUsed"> & { providerUsed: "demo" } {
  const keywords = jdKeywordPhrases(jobDescription, 18);
  const banner =
    "[Demo mode — add a free GROQ_API_KEY at console.groq.com for full AI rewriting]\n\n";
  const footer = `\n\n---\nKEYWORD ALIGNMENT (from job description)\n${keywords.join(" · ")}\n`;
  const editedResume = (banner + resumeText.trim() + footer).trim();
  const keywordScore = calculateKeywordScore(editedResume, jobDescription);
  return {
    editedResume,
    keywordScore,
    demoMode: true,
    providerUsed: "demo",
  };
}

async function callGroq(system: string, user: string): Promise<string> {
  const key = getGroqApiKey();
  if (!key) throw new Error("GROQ_API_KEY missing");

  const model = getGroqModel();
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.35,
      max_tokens: 4096,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  const data = (await res.json()) as {
    error?: { message?: string };
    choices?: { message?: { content?: string } }[];
  };
  if (!res.ok) {
    throw new Error(data.error?.message || `Groq HTTP ${res.status}`);
  }
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Groq returned empty content");
  return text;
}

async function callOpenAI(system: string, user: string): Promise<string> {
  const key = getOpenAiApiKey();
  if (!key) throw new Error("OPENAI_API_KEY missing");

  const model = getOpenAiModel();
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.35,
      max_tokens: 4096,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  const data = (await res.json()) as {
    error?: { message?: string };
    choices?: { message?: { content?: string } }[];
  };
  if (!res.ok) {
    throw new Error(data.error?.message || `OpenAI HTTP ${res.status}`);
  }
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("OpenAI returned empty content");
  return text;
}

async function callGemini(system: string, user: string): Promise<string> {
  const key = getGeminiApiKey();
  if (!key) throw new Error("Gemini API key missing");

  const model = getGeminiModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      generationConfig: { temperature: 0.35, maxOutputTokens: 8192 },
      contents: [
        {
          role: "user",
          parts: [{ text: `${system}\n\n${user}` }],
        },
      ],
    }),
  });

  const data = (await res.json()) as {
    error?: { message?: string };
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  if (!res.ok) {
    throw new Error(data.error?.message || `Gemini HTTP ${res.status}`);
  }
  const text = data.candidates?.[0]?.content?.parts
    ?.map((p) => p.text)
    .join("")
    .trim();
  if (!text) throw new Error("Gemini returned empty content");
  return text;
}

async function callAnthropic(system: string, user: string): Promise<string> {
  const key = getAnthropicApiKey();
  if (!key) throw new Error("ANTHROPIC_API_KEY missing");

  const message = await getAnthropic().messages.create({
    model: getAnthropicModel(),
    max_tokens: 4096,
    messages: [{ role: "user", content: user }],
    system,
  });

  const editedResume = message.content
    .filter((b): b is { type: "text"; text: string } => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  if (!editedResume) {
    throw new Error("Anthropic returned empty resume text.");
  }
  return editedResume;
}

function isRetryableProviderError(err: unknown): boolean {
  const msg =
    err && typeof err === "object" && "message" in err
      ? String((err as Error).message).toLowerCase()
      : String(err).toLowerCase();
  return (
    msg.includes("credit balance") ||
    msg.includes("too low") ||
    msg.includes("billing") ||
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("429") ||
    msg.includes("401") ||
    msg.includes("403") ||
    msg.includes("invalid_api_key") ||
    msg.includes("incorrect api key")
  );
}

// ─── Main optimization function ───────────────────────────────
export async function optimizeResume(
  resumeText: string,
  jobDescription: string
): Promise<OptimizeMeta> {
  const { system, user } = buildPrompts(resumeText, jobDescription);
  const order = parseProviderOrder();
  const errors: string[] = [];

  const run = async (
    name: string,
    fn: () => Promise<string>
  ): Promise<OptimizeMeta | null> => {
    try {
      const editedResume = await fn();
      if (!editedResume.trim()) {
        throw new Error("Empty response");
      }
      const keywordScore = calculateKeywordScore(editedResume, jobDescription);
      return {
        editedResume,
        keywordScore,
        providerUsed: name as OptimizeMeta["providerUsed"],
        demoMode: false,
      };
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      errors.push(`${name}: ${m}`);
      return null;
    }
  };

  for (const name of order) {
    let out: OptimizeMeta | null = null;
    if (name === "groq" && getGroqApiKey()) {
      out = await run("groq", () => callGroq(system, user));
    } else if (name === "openai" && getOpenAiApiKey()) {
      out = await run("openai", () => callOpenAI(system, user));
    } else if (name === "gemini" && getGeminiApiKey()) {
      out = await run("gemini", () => callGemini(system, user));
    } else if (name === "anthropic" && getAnthropicApiKey()) {
      try {
        const text = await callAnthropic(system, user);
        const keywordScore = calculateKeywordScore(text, jobDescription);
        return {
          editedResume: text,
          keywordScore,
          providerUsed: "anthropic",
          demoMode: false,
        };
      } catch (e) {
        const m = e instanceof Error ? e.message : String(e);
        errors.push(`anthropic: ${m}`);
        if (!isRetryableProviderError(e)) throw e;
        continue;
      }
    } else {
      continue;
    }

    if (out) return out;
  }

  if (isExplicitDemoOptimize()) {
    const demo = demoOptimizeResume(resumeText, jobDescription);
    return { ...demo, demoMode: true };
  }

  // Default: if every provider fails (e.g. Anthropic out of credits), still return a usable result.
  if (isAutoDemoFallbackEnabled()) {
    const detail = errors.length
      ? errors.join(" | ")
      : "no LLM API keys configured";
    console.warn(`[optimize] ${detail}. Using offline demo fallback.`);
    return demoOptimizeResume(resumeText, jobDescription);
  }

  throw new Error(
    `All configured LLM providers failed (${errors.join(" | ")}). ` +
      `Add GROQ_API_KEY in .env.local (server only — never NEXT_PUBLIC_), fix billing, ` +
      `or unset DISABLE_DEMO_FALLBACK to allow automatic demo mode.`
  );
}

// ─── Keyword match score ──────────────────────────────────────
export function calculateKeywordScore(
  resumeText: string,
  jobDescription: string
): number {
  // Extract meaningful keywords from JD (filter stop words)
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "as", "is", "was", "are", "were", "be",
    "been", "being", "have", "has", "had", "do", "does", "did", "will",
    "would", "could", "should", "may", "might", "shall", "can", "need",
    "our", "we", "you", "your", "their", "this", "that", "these", "those",
  ]);

  const extractKeywords = (text: string): Set<string> => {
    return new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s+#]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length > 3 && !stopWords.has(word))
    );
  };

  const jdKeywords = extractKeywords(jobDescription);
  const resumeWords = extractKeywords(resumeText);

  let matches = 0;
  jdKeywords.forEach((keyword) => {
    if (resumeWords.has(keyword)) matches++;
  });

  const score = Math.round((matches / Math.max(jdKeywords.size, 1)) * 100);
  // Normalize to realistic range (60–98%)
  return Math.min(98, Math.max(60, score));
}

// ─── Stream version (optional) ────────────────────────────────
export async function optimizeResumeStream(
  resumeText: string,
  jobDescription: string
): Promise<ReadableStream> {
  const response = await getAnthropic().messages.stream({
    model: getAnthropicModel(),
    max_tokens: 4096,
    system: `You are an expert resume writer. Rewrite the provided resume to perfectly match the job description. Use strong action verbs, add metrics, inject keywords, ensure ATS compatibility. Output ONLY the improved resume.`,
    messages: [
      {
        role: "user",
        content: `RESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jobDescription}`,
      },
    ],
  });

  return new ReadableStream({
    async start(controller) {
      for await (const event of response) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          controller.enqueue(new TextEncoder().encode(event.delta.text));
        }
      }
      controller.close();
    },
  });
}

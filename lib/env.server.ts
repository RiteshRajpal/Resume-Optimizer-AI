/**
 * Server-only environment access for API keys and LLM config.
 * Never import this file from Client Components ("use client") — build will fail.
 * Keys must live in .env.local (not committed). Do not use NEXT_PUBLIC_* for secrets.
 */
import "server-only";

export function getGroqApiKey(): string | undefined {
  return process.env.GROQ_API_KEY?.trim();
}

export function getGroqModel(): string {
  return process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
}

export function getOpenAiApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY?.trim();
}

export function getOpenAiModel(): string {
  return process.env.OPENAI_MODEL || "gpt-4o-mini";
}

export function getGeminiApiKey(): string | undefined {
  return (
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    process.env.GEMINI_API_KEY?.trim()
  );
}

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL || "gemini-2.0-flash";
}

export function getAnthropicApiKey(): string | undefined {
  return process.env.ANTHROPIC_API_KEY?.trim();
}

export function getAnthropicModel(): string {
  return process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";
}

export function getLlmFallbackOrderRaw(): string | undefined {
  return process.env.LLM_FALLBACK_ORDER?.trim();
}

export function isExplicitDemoOptimize(): boolean {
  return process.env.ALLOW_DEMO_OPTIMIZE === "true";
}

export function isAutoDemoFallbackEnabled(): boolean {
  return process.env.DISABLE_DEMO_FALLBACK !== "true";
}

export function hasAnyLlmApiKey(): boolean {
  return !!(
    getGroqApiKey() ||
    getOpenAiApiKey() ||
    getGeminiApiKey() ||
    getAnthropicApiKey()
  );
}

/** True when /api/optimize is allowed to run (LLM keys and/or demo paths). */
export function canRunOptimize(): boolean {
  return hasAnyLlmApiKey() || isExplicitDemoOptimize();
}

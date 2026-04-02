import { NextRequest, NextResponse } from "next/server";
import { optimizeResume } from "@/lib/ai";
import { canRunOptimize } from "@/lib/env.server";
import { saveResume } from "@/lib/supabase";

export const maxDuration = 120; // Allow up to 2 minutes for AI processing

// ─── POST /api/optimize ────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    if (!canRunOptimize()) {
      return NextResponse.json(
        {
          error:
            "No LLM configured. Add GROQ_API_KEY (free at console.groq.com), or OPENAI_API_KEY, GEMINI_API_KEY, ANTHROPIC_API_KEY — or set ALLOW_DEMO_OPTIMIZE=true for demo mode.",
        },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { resumeText, jobDescription, fileName } = body;

    // Validation
    if (!resumeText || typeof resumeText !== "string") {
      return NextResponse.json(
        { error: "Resume text is required." },
        { status: 400 }
      );
    }

    if (!jobDescription || typeof jobDescription !== "string") {
      return NextResponse.json(
        { error: "Job description is required." },
        { status: 400 }
      );
    }

    if (resumeText.length < 50) {
      return NextResponse.json(
        { error: "Resume text is too short." },
        { status: 400 }
      );
    }

    if (jobDescription.length < 50) {
      return NextResponse.json(
        { error: "Job description is too short." },
        { status: 400 }
      );
    }

    // Cap input lengths to avoid excessive API costs
    const truncatedResume = resumeText.slice(0, 8000);
    const truncatedJD = jobDescription.slice(0, 4000);

    console.log(`[optimize] Starting optimization. Resume: ${truncatedResume.length}c, JD: ${truncatedJD.length}c`);
    const startTime = Date.now();

    // Run AI optimization (tries GROQ → OpenAI → Gemini → Anthropic by default)
    const { editedResume, keywordScore, demoMode, providerUsed } =
      await optimizeResume(truncatedResume, truncatedJD);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[optimize] Done in ${duration}s. Score: ${keywordScore}%`);

    // Save to Supabase (optional — won't fail the request if DB is unavailable)
    let resumeId: string | undefined;
    try {
      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.SUPABASE_SERVICE_ROLE_KEY
      ) {
        const saved = await saveResume({
          originalText: truncatedResume,
          editedText: editedResume,
          jobDescription: truncatedJD,
          keywordScore,
          fileName,
        });
        resumeId = saved.id;
      }
    } catch (dbError) {
      console.warn("[optimize] DB save skipped:", dbError);
    }

    return NextResponse.json({
      success: true,
      editedResume,
      keywordScore,
      resumeId,
      processingTime: parseFloat(duration),
      demoMode: !!demoMode,
      providerUsed: providerUsed ?? null,
    });
  } catch (error: any) {
    console.error("[optimize] Error:", error);

    // Handle Anthropic API errors specifically
    if (error?.status === 529 || error?.message?.includes("overloaded")) {
      return NextResponse.json(
        { error: "AI service is temporarily busy. Please try again in a moment." },
        { status: 503 }
      );
    }

    const message =
      typeof error?.message === "string" && error.message.length < 300
        ? error.message
        : "Failed to optimize resume. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

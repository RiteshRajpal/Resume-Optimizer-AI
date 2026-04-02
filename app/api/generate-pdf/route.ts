import { NextRequest, NextResponse } from "next/server";
import { generateResumePdf } from "@/lib/pdf";

// ─── POST /api/generate-pdf ────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { resumeText, fileName = "resume" } = body;

    if (!resumeText || typeof resumeText !== "string") {
      return NextResponse.json(
        { error: "Resume text is required." },
        { status: 400 }
      );
    }

    const pdfBytes = await generateResumePdf(resumeText);

    const safeFileName = fileName
      .replace(/[^a-z0-9_-]/gi, "_")
      .replace(/_+/g, "_")
      .toLowerCase();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFileName}_optimized.pdf"`,
        "Content-Length": pdfBytes.length.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[generate-pdf] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF." },
      { status: 500 }
    );
  }
}

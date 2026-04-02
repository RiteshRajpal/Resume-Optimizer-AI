import { NextRequest, NextResponse } from "next/server";

// ─── Text extraction helpers ───────────────────────────────────
async function extractTextFromPdf(buffer: ArrayBuffer): Promise<string> {
  // Dynamic import to avoid issues with edge runtime
  const pdfParse = (await import("pdf-parse")).default;
  const result = await pdfParse(Buffer.from(buffer));
  return result.text;
}

async function extractTextFromDocx(buffer: ArrayBuffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
  return result.value;
}

// ─── POST /api/upload ──────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];

    const isValidType =
      allowedTypes.includes(file.type) ||
      file.name.endsWith(".pdf") ||
      file.name.endsWith(".docx") ||
      file.name.endsWith(".doc");

    if (!isValidType) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a PDF or DOCX file." },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Extract text
    const buffer = await file.arrayBuffer();
    let resumeText: string;

    try {
      if (file.name.endsWith(".pdf") || file.type === "application/pdf") {
        resumeText = await extractTextFromPdf(buffer);
      } else {
        resumeText = await extractTextFromDocx(buffer);
      }
    } catch (extractError) {
      console.error("Text extraction failed:", extractError);
      return NextResponse.json(
        { error: "Failed to extract text from file. Please try a different file." },
        { status: 422 }
      );
    }

    // Clean up extracted text
    resumeText = resumeText
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (!resumeText || resumeText.length < 50) {
      return NextResponse.json(
        { error: "Could not extract meaningful text from the file. Please check the file is not password-protected or scanned." },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      text: resumeText,
      fileName: file.name,
      fileSize: file.size,
      charCount: resumeText.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during upload." },
      { status: 500 }
    );
  }
}

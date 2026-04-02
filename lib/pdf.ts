import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from "pdf-lib";

interface PdfSection {
  type: "name" | "contact" | "sectionHeader" | "bullet" | "text" | "divider";
  content: string;
}

// ─── Parse resume text into sections ─────────────────────────
function parseResumeText(text: string): PdfSection[] {
  const sections: PdfSection[] = [];
  const lines = text.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Detect section headers (ALL CAPS or followed by "---")
    if (
      line.match(/^[A-Z][A-Z\s&]+$/) ||
      line.match(/^(EXPERIENCE|EDUCATION|SKILLS|SUMMARY|PROJECTS|CERTIFICATIONS|AWARDS|PUBLICATIONS)/i)
    ) {
      sections.push({ type: "sectionHeader", content: line });
    }
    // Divider
    else if (line.match(/^[-─]{3,}$/)) {
      sections.push({ type: "divider", content: "" });
    }
    // Bullet points
    else if (line.startsWith("•") || line.startsWith("-") || line.startsWith("*")) {
      sections.push({ type: "bullet", content: line.replace(/^[•\-*]\s*/, "") });
    }
    // First line (likely name)
    else if (i === 0 || (i === 1 && sections.length === 0)) {
      sections.push({ type: "name", content: line });
    }
    // Contact info (has @ or phone patterns)
    else if (
      line.match(/@/) ||
      line.match(/\d{3}[-.\s]\d{3}/) ||
      line.match(/linkedin|github/i)
    ) {
      sections.push({ type: "contact", content: line });
    }
    // Regular text
    else {
      sections.push({ type: "text", content: line });
    }
  }

  return sections;
}

// ─── Word wrap helper ─────────────────────────────────────────
function wrapText(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

// ─── Main PDF generation ──────────────────────────────────────
export async function generateResumePdf(resumeText: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // Embed fonts
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Page setup
  const pageWidth = 612; // US Letter
  const pageHeight = 792;
  const marginX = 50;
  const contentWidth = pageWidth - marginX * 2;

  // Colors
  const black = rgb(0.08, 0.07, 0.06);
  const darkGray = rgb(0.34, 0.31, 0.27);
  const medGray = rgb(0.56, 0.52, 0.47);
  const accentColor = rgb(0.96, 0.62, 0.04); // amber

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - 50;

  const checkNewPage = () => {
    if (y < 60) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - 50;
    }
  };

  const sections = parseResumeText(resumeText);

  for (const section of sections) {
    checkNewPage();

    switch (section.type) {
      case "name":
        page.drawText(section.content, {
          x: marginX,
          y,
          size: 22,
          font: fontBold,
          color: black,
        });
        y -= 28;
        break;

      case "contact":
        page.drawText(section.content, {
          x: marginX,
          y,
          size: 9,
          font: fontRegular,
          color: medGray,
        });
        y -= 14;
        break;

      case "sectionHeader":
        y -= 6;
        page.drawLine({
          start: { x: marginX, y: y + 14 },
          end: { x: pageWidth - marginX, y: y + 14 },
          thickness: 1,
          color: accentColor,
          opacity: 0.6,
        });
        page.drawText(section.content.toUpperCase(), {
          x: marginX,
          y,
          size: 9,
          font: fontBold,
          color: accentColor,
        });
        y -= 16;
        break;

      case "divider":
        y -= 4;
        page.drawLine({
          start: { x: marginX, y },
          end: { x: pageWidth - marginX, y },
          thickness: 0.5,
          color: rgb(0.9, 0.89, 0.88),
        });
        y -= 8;
        break;

      case "bullet": {
        const wrappedLines = wrapText(section.content, fontRegular, 10, contentWidth - 16);
        for (let i = 0; i < wrappedLines.length; i++) {
          checkNewPage();
          if (i === 0) {
            page.drawText("•", {
              x: marginX,
              y,
              size: 10,
              font: fontRegular,
              color: accentColor,
            });
          }
          page.drawText(wrappedLines[i], {
            x: marginX + 12,
            y,
            size: 10,
            font: fontRegular,
            color: darkGray,
          });
          y -= 14;
        }
        break;
      }

      case "text": {
        // Detect if it looks like a job title / company line (bold it)
        const isJobLine = section.content.match(/\d{4}/) || section.content.match(/\|/);
        const wrappedLines = wrapText(section.content, isJobLine ? fontBold : fontRegular, 10, contentWidth);
        for (const wLine of wrappedLines) {
          checkNewPage();
          page.drawText(wLine, {
            x: marginX,
            y,
            size: isJobLine ? 10.5 : 10,
            font: isJobLine ? fontBold : fontRegular,
            color: isJobLine ? black : darkGray,
          });
          y -= 14;
        }
        break;
      }
    }
  }

  // Footer
  const pageCount = pdfDoc.getPageCount();
  for (let i = 0; i < pageCount; i++) {
    const pg = pdfDoc.getPage(i);
    pg.drawText(`Page ${i + 1} of ${pageCount}`, {
      x: pageWidth / 2 - 30,
      y: 30,
      size: 8,
      font: fontRegular,
      color: rgb(0.75, 0.72, 0.68),
    });
  }

  return pdfDoc.save();
}

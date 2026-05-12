import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Utility: split text into paragraphs
function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, " ").trim())
    .filter((p) => p.length > 0);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let text = "";

    // ── TXT ──────────────────────────────────────────────
    if (fileName.endsWith(".txt") || file.type === "text/plain") {
      text = buffer.toString("utf-8");
    }

    // ── DOCX ─────────────────────────────────────────────
    else if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
      const mammoth = (await import("mammoth")).default;
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    }

    // ── PDF ───────────────────────────────────────────────
    else if (fileName.endsWith(".pdf") || file.type === "application/pdf") {
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(buffer);
      text = data.text;
    }

    else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload PDF, DOCX, or TXT." },
        { status: 415 }
      );
    }

    if (!text.trim()) {
      return NextResponse.json({ error: "Could not extract text from the file." }, { status: 422 });
    }

    const paragraphs = splitIntoParagraphs(text);
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const charCount = text.length;

    // Rough language detection based on character code ranges
    const cjkCount = (text.match(/[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]/g) || []).length;
    const arabicCount = (text.match(/[\u0600-\u06FF]/g) || []).length;
    const cyrillic = (text.match(/[\u0400-\u04FF]/g) || []).length;

    let detectedLang = "en";
    if (cjkCount > 20) detectedLang = cjkCount > 100 ? "zh" : "ja";
    else if (arabicCount > 20) detectedLang = "ar";
    else if (cyrillic > 20) detectedLang = "ru";

    return NextResponse.json({
      text,
      paragraphs,
      wordCount,
      charCount,
      detectedLang,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (err) {
    console.error("[parse] Error:", err);
    return NextResponse.json(
      { error: "Failed to parse file. Please try another format." },
      { status: 500 }
    );
  }
}

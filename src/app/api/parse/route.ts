import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Max upload size enforced here (Vercel hard limit is 4.5 MB on Hobby plan)
const MAX_BYTES = 10 * 1024 * 1024;

/** Split raw text into non-empty paragraphs */
function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, " ").trim())
    .filter((p) => p.length > 4);
}

/** Rough source-language detection by character ranges */
function detectLang(text: string): string {
  const cjk    = (text.match(/[\u4E00-\u9FFF]/g) ?? []).length;
  const kana    = (text.match(/[\u3040-\u30FF]/g) ?? []).length;
  const hangul  = (text.match(/[\uAC00-\uD7AF]/g) ?? []).length;
  const arabic  = (text.match(/[\u0600-\u06FF]/g) ?? []).length;
  const cyrill  = (text.match(/[\u0400-\u04FF]/g) ?? []).length;
  const viet    = (text.match(/[àáâãèéêìíòóôõùúýăđơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/gi) ?? []).length;

  const max = Math.max(cjk, kana, hangul, arabic, cyrill, viet);
  if (max < 15) return "en";
  if (max === cjk && cjk > kana)    return "zh";
  if (max === kana || kana > 20)    return "ja";
  if (max === hangul)               return "ko";
  if (max === arabic)               return "ar";
  if (max === cyrill)               return "ru";
  if (max === viet)                 return "vi";
  return "en";
}

/** Extract text from PDF using pdfjs-dist (pure JS, no native addons) */
async function parsePdf(buffer: Buffer): Promise<string> {
  // Use the legacy build which is Node-compatible without a canvas dependency
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  // Disable the worker — run everything in the main thread (serverless-safe)
  pdfjsLib.GlobalWorkerOptions.workerSrc = "";

  const pdfOptions = {
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    useSystemFonts: true,
    disableFontFace: true,
  };
  // Cast needed: pdfjs-dist types don't expose all runtime options
  const loadingTask = pdfjsLib.getDocument(pdfOptions as Parameters<typeof pdfjsLib.getDocument>[0]);

  const pdf = await loadingTask.promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page    = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(pageText);
  }

  return pages.join("\n\n");
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `File too large. Maximum allowed size is ${MAX_BYTES / 1024 / 1024} MB.` },
        { status: 413 }
      );
    }

    const fileName = file.name.toLowerCase();
    const bytes    = await file.arrayBuffer();
    const buffer   = Buffer.from(bytes);
    let text       = "";

    // ── Plain text ─────────────────────────────────────────
    if (fileName.endsWith(".txt") || file.type === "text/plain") {
      text = buffer.toString("utf-8");
    }

    // ── DOCX / DOC ─────────────────────────────────────────
    else if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
      const mammoth = (await import("mammoth")).default;
      const result  = await mammoth.extractRawText({ buffer });
      text = result.value;
    }

    // ── PDF ────────────────────────────────────────────────
    else if (fileName.endsWith(".pdf") || file.type === "application/pdf") {
      text = await parsePdf(buffer);
    }

    else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload PDF, DOCX, or TXT." },
        { status: 415 }
      );
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: "Could not extract text from the file. The document may be scanned/image-only." },
        { status: 422 }
      );
    }

    const paragraphs = splitIntoParagraphs(text);
    const wordCount  = text.split(/\s+/).filter(Boolean).length;
    const charCount  = text.length;
    const detectedLang = detectLang(text);

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
      { error: "Failed to parse the file. Please try another format or a smaller file." },
      { status: 500 }
    );
  }
}

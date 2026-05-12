import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MYMEMORY_API = "https://api.mymemory.translated.net/get";
const CHUNK_LIMIT = 500; // MyMemory limit per request (chars)

function chunkText(text: string, limit: number): string[] {
  if (text.length <= limit) return [text];
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = start + limit;
    if (end < text.length) {
      // Try to break at sentence boundary
      const boundary = text.lastIndexOf(".", end);
      const boundary2 = text.lastIndexOf("。", end);
      const best = Math.max(boundary, boundary2);
      if (best > start + 100) end = best + 1;
    }
    chunks.push(text.slice(start, end).trim());
    start = end;
  }
  return chunks.filter((c) => c.length > 0);
}

async function translateChunk(
  text: string,
  targetLang: string,
  sourceLang: string = "autodetect"
): Promise<string> {
  if (!text.trim()) return text;

  const langPair =
    sourceLang === "autodetect" ? `autodetect|${targetLang}` : `${sourceLang}|${targetLang}`;

  const url = `${MYMEMORY_API}?q=${encodeURIComponent(text)}&langpair=${langPair}&de=translator@translaate.app`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Translaate/1.0" },
  });

  if (!res.ok) throw new Error(`MyMemory API error: ${res.status}`);

  const data = await res.json();

  if (data.responseStatus === 200 && data.responseData?.translatedText) {
    return data.responseData.translatedText;
  }

  throw new Error(data.responseDetails || "Translation failed");
}

async function translateParagraph(
  paragraph: string,
  targetLang: string,
  sourceLang: string
): Promise<string> {
  if (!paragraph.trim()) return paragraph;

  const chunks = chunkText(paragraph, CHUNK_LIMIT);
  const translatedChunks: string[] = [];

  for (const chunk of chunks) {
    try {
      const translated = await translateChunk(chunk, targetLang, sourceLang);
      translatedChunks.push(translated);
      // Small delay to avoid rate limiting
      if (chunks.length > 1) await new Promise((r) => setTimeout(r, 150));
    } catch {
      translatedChunks.push(`[Translation unavailable for this segment]`);
    }
  }

  return translatedChunks.join(" ");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paragraphs, targetLang, sourceLang = "autodetect" } = body as {
      paragraphs: string[];
      targetLang: string;
      sourceLang?: string;
    };

    if (!paragraphs || !Array.isArray(paragraphs)) {
      return NextResponse.json({ error: "paragraphs array is required" }, { status: 400 });
    }

    if (!targetLang || !["en", "vi", "zh", "ja", "ko", "fr", "de", "es"].includes(targetLang)) {
      return NextResponse.json({ error: "Invalid target language" }, { status: 400 });
    }

    // Translate up to 50 paragraphs in one request (rate limit safety)
    const limited = paragraphs.slice(0, 80);
    const translations: string[] = [];

    for (const para of limited) {
      const translated = await translateParagraph(para, targetLang, sourceLang);
      translations.push(translated);
    }

    return NextResponse.json({ translations });
  } catch (err) {
    console.error("[translate] Error:", err);
    return NextResponse.json({ error: "Translation service unavailable." }, { status: 500 });
  }
}

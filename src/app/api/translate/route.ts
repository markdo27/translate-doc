import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// ─────────────────────────────────────────────────────────────
// Language code mapping (our internal → each API's format)
// ─────────────────────────────────────────────────────────────
const TO_GOOGLE: Record<string, string> = {
  vi: "vi", en: "en", zh: "zh-CN", ja: "ja",
  ko: "ko", fr: "fr", de: "de", es: "es", ar: "ar", ru: "ru",
};
const TO_DEEPL: Record<string, string> = {
  vi: "VI", en: "EN-US", zh: "ZH", ja: "JA",
  ko: "KO", fr: "FR", de: "DE", es: "ES", ar: "AR", ru: "RU",
};
const TO_AZURE: Record<string, string> = {
  vi: "vi", en: "en", zh: "zh-Hans", ja: "ja",
  ko: "ko", fr: "fr", de: "de", es: "es", ar: "ar", ru: "ru",
};

const CHUNK = 4800; // chars per request (safe for all APIs)

function chunks(text: string, max: number): string[] {
  if (text.length <= max) return [text];
  const out: string[] = [];
  let i = 0;
  while (i < text.length) {
    let end = i + max;
    if (end < text.length) {
      const b = Math.max(text.lastIndexOf(".", end), text.lastIndexOf("。", end), text.lastIndexOf("\n", end));
      if (b > i + 100) end = b + 1;
    }
    out.push(text.slice(i, end).trim());
    i = end;
  }
  return out.filter(Boolean);
}

// ─────────────────────────────────────────────────────────────
// BACKEND 1: Google Translate unofficial (gtx) — no key needed
// ─────────────────────────────────────────────────────────────
async function googleTranslate(text: string, target: string): Promise<string> {
  const tl = TO_GOOGLE[target] ?? target;
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Google gtx ${res.status}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json();
  // Response: [[["translated","original",null,null,1],...],...]
  if (!Array.isArray(data?.[0])) throw new Error("Google gtx: unexpected shape");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data[0].map((seg: any) => seg[0] ?? "").join("");
}

// ─────────────────────────────────────────────────────────────
// BACKEND 2: Lingva Translate (open-source Google proxy) — no key
// ─────────────────────────────────────────────────────────────
const LINGVA_HOSTS = [
  "https://lingva.ml",
  "https://translate.plausibility.cloud",
  "https://lingva.thedaviddelta.com",
];

async function lingvaTranslate(text: string, target: string): Promise<string> {
  const tl = TO_GOOGLE[target] ?? target;
  for (const host of LINGVA_HOSTS) {
    try {
      const url = `${host}/api/v1/auto/${tl}/${encodeURIComponent(text)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const data = await res.json() as { translation?: string };
      if (data.translation) return data.translation;
    } catch { /* try next host */ }
  }
  throw new Error("Lingva: all hosts failed");
}

// ─────────────────────────────────────────────────────────────
// BACKEND 3: DeepL — requires DEEPL_API_KEY env var (free tier ok)
// ─────────────────────────────────────────────────────────────
async function deeplTranslate(text: string, target: string): Promise<string> {
  const key = process.env.DEEPL_API_KEY;
  if (!key) throw new Error("No DEEPL_API_KEY");
  const tl  = TO_DEEPL[target] ?? target.toUpperCase();
  // Free keys use api-free.deepl.com, paid keys use api.deepl.com
  const host = key.endsWith(":fx") ? "api-free.deepl.com" : "api.deepl.com";
  const res = await fetch(`https://${host}/v2/translate`, {
    method: "POST",
    headers: { "Authorization": `DeepL-Auth-Key ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ text: [text], target_lang: tl }),
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`DeepL ${res.status}`);
  const data = await res.json() as { translations: { text: string }[] };
  return data.translations[0]?.text ?? "";
}

// ─────────────────────────────────────────────────────────────
// BACKEND 4: Microsoft Azure Translator — requires AZURE_TRANSLATOR_KEY
// ─────────────────────────────────────────────────────────────
async function azureTranslate(text: string, target: string): Promise<string> {
  const key    = process.env.AZURE_TRANSLATOR_KEY;
  const region = process.env.AZURE_TRANSLATOR_REGION ?? "eastus";
  if (!key) throw new Error("No AZURE_TRANSLATOR_KEY");
  const tl  = TO_AZURE[target] ?? target;
  const res = await fetch(
    `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${tl}`,
    {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Ocp-Apim-Subscription-Region": region,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([{ Text: text }]),
      signal: AbortSignal.timeout(12000),
    }
  );
  if (!res.ok) throw new Error(`Azure ${res.status}`);
  const data = await res.json() as { translations: { text: string }[] }[];
  return data[0]?.translations[0]?.text ?? "";
}

// ─────────────────────────────────────────────────────────────
// BACKEND 5: MyMemory — free fallback
// ─────────────────────────────────────────────────────────────
async function myMemoryTranslate(text: string, target: string): Promise<string> {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=autodetect|${target}&de=translator@translaate.app`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`MyMemory ${res.status}`);
  const data = await res.json() as { responseStatus: number; responseData: { translatedText: string } };
  if (data.responseStatus !== 200) throw new Error("MyMemory quota or error");
  return data.responseData.translatedText;
}

// ─────────────────────────────────────────────────────────────
// ORCHESTRATOR — tries backends in priority order
// ─────────────────────────────────────────────────────────────
type Backend = { name: string; fn: (t: string, l: string) => Promise<string>; enabled: boolean };

function getBackends(): Backend[] {
  return [
    // Premium backends first (if keys provided)
    { name: "deepl",   fn: deeplTranslate,   enabled: !!process.env.DEEPL_API_KEY },
    { name: "azure",   fn: azureTranslate,   enabled: !!process.env.AZURE_TRANSLATOR_KEY },
    // Free no-key backends
    { name: "google",  fn: googleTranslate,  enabled: true },
    { name: "lingva",  fn: lingvaTranslate,  enabled: true },
    { name: "mymemory",fn: myMemoryTranslate,enabled: true },
  ].filter(b => b.enabled);
}

async function translateText(text: string, target: string): Promise<{ text: string; backend: string }> {
  if (!text.trim()) return { text, backend: "passthrough" };

  const backends = getBackends();
  const errors: string[] = [];

  for (const backend of backends) {
    try {
      const translated = await backend.fn(text, target);
      if (translated && translated.trim()) return { text: translated, backend: backend.name };
    } catch (e) {
      errors.push(`${backend.name}: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  console.error("[translate] All backends failed:", errors);
  throw new Error("All translation backends failed. Try again later.");
}


// ─────────────────────────────────────────────────────────────
// ROUTE HANDLER
// ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { paragraphs, targetLang } = await req.json() as {
      paragraphs: string[];
      targetLang: string;
    };

    if (!paragraphs || !Array.isArray(paragraphs)) {
      return NextResponse.json({ error: "paragraphs array required" }, { status: 400 });
    }
    if (!targetLang) {
      return NextResponse.json({ error: "targetLang required" }, { status: 400 });
    }

    const translations: string[] = [];
    let usedBackend = "unknown";

    for (const para of paragraphs.slice(0, 80)) {
      const parts = chunks(para, CHUNK);
      const segments: string[] = [];
      for (const part of parts) {
        const { text, backend } = await translateText(part, targetLang);
        segments.push(text);
        usedBackend = backend;
        if (parts.length > 1) await new Promise(r => setTimeout(r, 80));
      }
      translations.push(segments.join(" "));
    }

    return NextResponse.json({ translations, backend: usedBackend });
  } catch (err) {
    console.error("[translate] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Translation service unavailable." },
      { status: 500 }
    );
  }
}

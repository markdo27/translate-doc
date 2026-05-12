"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { DocumentViewer } from "@/components/DocumentViewer";
import { TranslationPane } from "@/components/TranslationPane";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ExportButton } from "@/components/ExportButton";

interface Doc {
  paragraphs: string[]; wordCount: number; charCount: number;
  detectedLang: string; fileName: string; fileSize: number;
}

function fmt(b: number) {
  return b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`;
}

const BATCH = 5;

async function translateBatch(paragraphs: string[], targetLang: string): Promise<string[]> {
  const res  = await fetch("/api/translate", { method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paragraphs, targetLang }) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Translation failed");
  return data.translations as string[];
}

export default function TranslatePage() {
  const router = useRouter();
  const [doc, setDoc] = useState<Doc | null>(null);
  const [lang, setLang] = useState<"en"|"vi">("vi");
  const [translations, setTranslations] = useState<(string|null)[]>([]);
  const [transIdx, setTransIdx] = useState<number|null>(null);
  const [running, setRunning] = useState(false);
  const [err, setErr] = useState<string|null>(null);
  const aborted = useRef(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("translaate_doc");
    if (!raw) { router.replace("/"); return; }
    const d: Doc = JSON.parse(raw);
    setDoc(d);
    setTranslations(new Array(d.paragraphs.length).fill(null));
  }, [router]);

  const reset = (newLang?: "en"|"vi") => {
    aborted.current = true; setRunning(false); setTransIdx(null);
    setTranslations(new Array(doc?.paragraphs.length ?? 0).fill(null));
    setErr(null);
    if (newLang) setLang(newLang);
  };

  const changeLang = (l: "en"|"vi") => { if (running) reset(l); else { setLang(l); reset(l); } };

  const translate = useCallback(async () => {
    if (!doc || running) return;
    aborted.current = false; setRunning(true); setErr(null);
    setTranslations(new Array(doc.paragraphs.length).fill(null));
    try {
      for (let i = 0; i < doc.paragraphs.length; i += BATCH) {
        if (aborted.current) break;
        setTransIdx(i);
        const batch  = doc.paragraphs.slice(i, i + BATCH);
        const result = await translateBatch(batch, lang);
        setTranslations(prev => { const n = [...prev]; result.forEach((r, j) => { n[i+j] = r; }); return n; });
      }
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Translation failed."); }
    finally { setTransIdx(null); setRunning(false); }
  }, [doc, running, lang]);

  const [active, setActive] = useState<number|null>(null);

  if (!doc) return (
    <div className="app"><Header />
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"60vh",
        color:"var(--text-3)", fontSize:13 }}>Loading…</div>
    </div>
  );

  const done = translations.filter(t => t !== null).length;

  return (
    <div className="app" style={{ height:"100vh", overflow:"hidden" }}>
      <Header />
      <div className="workspace">
        {/* Toolbar */}
        <div className="toolbar">
          <div className="toolbar__file">
            <div className="file-icon">
              {doc.fileName.endsWith(".pdf") ? "📕" : doc.fileName.endsWith(".docx") ? "📘" : "📄"}
            </div>
            <div>
              <div className="file-name">{doc.fileName}</div>
              <div className="file-meta">{doc.wordCount.toLocaleString()} words · {fmt(doc.fileSize)} · {doc.paragraphs.length} ¶</div>
            </div>
          </div>

          <LanguageSelector value={lang} onChange={changeLang} disabled={running} />

          <div className="toolbar__actions">
            {running
              ? <button className="btn btn--danger" onClick={() => reset()} id="stop-btn">Stop</button>
              : <button className="btn btn--primary" onClick={translate} id="translate-btn">
                  {done > 0 ? "Retranslate" : "Translate"}
                </button>}
            <ExportButton paragraphs={doc.paragraphs} translations={translations}
              targetLang={lang} fileName={doc.fileName} disabled={running} />
            <button className="btn btn--ghost" onClick={() => { sessionStorage.removeItem("translaate_doc"); router.push("/"); }}
              id="new-doc-btn">← New</button>
          </div>
        </div>

        {err && (
          <div className="errbar">
            <span>{err}</span>
            <button className="errbar__close" onClick={() => setErr(null)}>✕</button>
          </div>
        )}

        {/* Split view */}
        <div className="split">
          <DocumentViewer paragraphs={doc.paragraphs} activeParagraph={active}
            onParagraphClick={setActive} title={doc.fileName} detectedLang={doc.detectedLang} />
          <div className="split__divider" />
          <TranslationPane paragraphs={doc.paragraphs} translations={translations}
            translatingIndex={transIdx} targetLang={lang}
            activeParagraph={active} onParagraphClick={setActive} />
        </div>
      </div>
    </div>
  );
}

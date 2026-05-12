"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { DocumentViewer } from "@/components/DocumentViewer";
import { TranslationPane } from "@/components/TranslationPane";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ExportButton } from "@/components/ExportButton";

interface DocData {
  paragraphs: string[];
  wordCount: number;
  charCount: number;
  detectedLang: string;
  fileName: string;
  fileSize: number;
}

const FILE_ICONS: Record<string, string> = {
  pdf: "📕",
  docx: "📘",
  doc: "📘",
  txt: "📄",
};

function fileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "txt";
  return FILE_ICONS[ext] ?? "📄";
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// Translate one paragraph via the API
async function translateParagraphs(
  paragraphs: string[],
  targetLang: string
): Promise<string[]> {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paragraphs, targetLang }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Translation failed");
  return data.translations as string[];
}

// Batch size: translate N paragraphs at a time to show streaming progress
const BATCH_SIZE = 5;

export default function TranslatePage() {
  const router = useRouter();
  const [doc, setDoc] = useState<DocData | null>(null);
  const [targetLang, setTargetLang] = useState<"en" | "vi">("vi");
  const [translations, setTranslations] = useState<(string | null)[]>([]);
  const [translatingIndex, setTranslatingIndex] = useState<number | null>(null);
  const [activeParagraph, setActiveParagraph] = useState<number | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const abortRef = useRef<boolean>(false);

  // Load doc from sessionStorage
  useEffect(() => {
    const raw = sessionStorage.getItem("translaate_doc");
    if (!raw) { router.replace("/"); return; }
    const data: DocData = JSON.parse(raw);
    setDoc(data);
    setTranslations(new Array(data.paragraphs.length).fill(null));
  }, [router]);

  // Sync translations array length when doc changes
  useEffect(() => {
    if (doc) setTranslations(new Array(doc.paragraphs.length).fill(null));
  }, [doc?.paragraphs.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset translations when language changes
  const handleLangChange = (lang: "en" | "vi") => {
    if (isTranslating) {
      abortRef.current = true;
      setIsTranslating(false);
    }
    setTargetLang(lang);
    setTranslations(new Array(doc?.paragraphs.length ?? 0).fill(null));
    setTranslateError(null);
    setTranslatingIndex(null);
  };

  const startTranslation = useCallback(async () => {
    if (!doc || isTranslating) return;
    abortRef.current = false;
    setIsTranslating(true);
    setTranslateError(null);
    setTranslations(new Array(doc.paragraphs.length).fill(null));

    const { paragraphs } = doc;

    try {
      for (let i = 0; i < paragraphs.length; i += BATCH_SIZE) {
        if (abortRef.current) break;

        const batch = paragraphs.slice(i, i + BATCH_SIZE);
        setTranslatingIndex(i);

        const results = await translateParagraphs(batch, targetLang);

        setTranslations((prev) => {
          const next = [...prev];
          results.forEach((r, j) => { next[i + j] = r; });
          return next;
        });
      }
    } catch (err: unknown) {
      setTranslateError(
        err instanceof Error ? err.message : "Translation failed. Please try again."
      );
    } finally {
      setTranslatingIndex(null);
      setIsTranslating(false);
    }
  }, [doc, isTranslating, targetLang]);

  const stopTranslation = () => {
    abortRef.current = true;
    setIsTranslating(false);
    setTranslatingIndex(null);
  };

  const handleReset = () => {
    sessionStorage.removeItem("translaate_doc");
    router.push("/");
  };

  if (!doc) {
    return (
      <div className="app-wrapper">
        <Header />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "60vh",
            color: "var(--text-muted)",
            fontSize: "0.9rem",
          }}
        >
          Loading document…
        </div>
      </div>
    );
  }

  const doneCount = translations.filter((t) => t !== null).length;

  return (
    <div className="app-wrapper" style={{ height: "100vh", overflow: "hidden" }}>
      <Header />

      <div className="translate-page">
        {/* Toolbar */}
        <div className="translate-toolbar">
          {/* Left: file info */}
          <div className="file-info" style={{ flex: 1, minWidth: 0 }}>
            <div className={`file-icon file-icon--${doc.fileName.split(".").pop() ?? "txt"}`}>
              {fileIcon(doc.fileName)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                className="file-info__name"
                style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              >
                {doc.fileName}
              </div>
              <div className="file-info__meta">
                {doc.wordCount.toLocaleString()} words · {formatSize(doc.fileSize)} ·{" "}
                {doc.paragraphs.length} paragraphs
              </div>
            </div>
          </div>

          {/* Center: language selector */}
          <LanguageSelector
            value={targetLang}
            onChange={handleLangChange}
            disabled={isTranslating}
          />

          {/* Right: actions */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
            {isTranslating ? (
              <button
                className="btn btn--danger btn--sm"
                onClick={stopTranslation}
                id="stop-translation-btn"
              >
                ⏹ Stop
              </button>
            ) : (
              <button
                className="btn btn--primary btn--sm"
                onClick={startTranslation}
                disabled={isTranslating}
                id="translate-btn"
              >
                {doneCount > 0 ? "🔄 Retranslate" : "🌐 Translate"}
              </button>
            )}

            <ExportButton
              paragraphs={doc.paragraphs}
              translations={translations}
              targetLang={targetLang}
              fileName={doc.fileName}
              disabled={isTranslating}
            />

            <button
              className="btn btn--glass btn--sm"
              onClick={handleReset}
              id="new-document-btn"
              data-tooltip="Upload a new document"
            >
              ↩ New
            </button>
          </div>
        </div>

        {/* Error bar */}
        {translateError && (
          <div
            role="alert"
            style={{
              padding: "10px 24px",
              background: "rgba(239,68,68,0.1)",
              borderBottom: "1px solid rgba(239,68,68,0.2)",
              color: "#ef4444",
              fontSize: "0.85rem",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            ⚠️ {translateError}
            <button
              onClick={() => setTranslateError(null)}
              style={{ marginLeft: "auto", background: "none", border: "none", color: "inherit", cursor: "pointer" }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Split view */}
        <div className="translate-body">
          {/* Source pane */}
          <div className="translate-col">
            <DocumentViewer
              paragraphs={doc.paragraphs}
              activeParagraph={activeParagraph}
              onParagraphClick={setActiveParagraph}
              title={doc.fileName}
              detectedLang={doc.detectedLang}
            />
          </div>

          {/* Divider */}
          <div className="split-divider" />

          {/* Translation pane */}
          <div className="translate-col">
            <TranslationPane
              paragraphs={doc.paragraphs}
              translations={translations}
              translatingIndex={translatingIndex}
              targetLang={targetLang}
              activeParagraph={activeParagraph}
              onParagraphClick={setActiveParagraph}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";

interface TranslationPaneProps {
  paragraphs: string[];
  translations: (string | null)[];
  translatingIndex: number | null;
  targetLang: "en" | "vi";
  activeParagraph: number | null;
  onParagraphClick: (index: number) => void;
}

const LANG_LABELS = { en: "English", vi: "Tiếng Việt" };
const LANG_CLASS  = { en: "pane-label--en", vi: "pane-label--vi" };

export function TranslationPane({
  paragraphs,
  translations,
  translatingIndex,
  targetLang,
  activeParagraph,
  onParagraphClick,
}: TranslationPaneProps) {
  const [copied, setCopied] = useState<number | null>(null);

  const copy = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 1500);
  };

  const doneCount = translations.filter((t) => t !== null).length;
  const total = paragraphs.length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const isTranslating = translatingIndex !== null;

  return (
    <div className="doc-pane">
      <div className="pane-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className={`pane-label ${LANG_CLASS[targetLang]}`}>
            {targetLang === "vi" ? "🇻🇳" : "🇺🇸"} {LANG_LABELS[targetLang]}
          </span>
          {isTranslating && (
            <span className="status-chip status-chip--processing">
              <span className="pulse-dot" />
              Translating…
            </span>
          )}
          {!isTranslating && doneCount > 0 && doneCount === total && (
            <span className="status-chip status-chip--done">
              ✓ Complete
            </span>
          )}
        </div>

        {total > 0 && (
          <span className="word-count">{doneCount}/{total}</span>
        )}
      </div>

      {isTranslating && (
        <div style={{ padding: "0 20px 8px", flexShrink: 0 }}>
          <div className="progress-bar">
            <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <div className="pane-scroll" id="translation-pane">
        {paragraphs.map((_, idx) => {
          const translation = translations[idx];
          const isTranslatingThis = translatingIndex === idx;
          const isDone = translation !== null;

          return (
            <div
              key={idx}
              className={[
                "doc-paragraph",
                activeParagraph === idx ? "doc-paragraph--active" : "",
                isTranslatingThis ? "doc-paragraph--translating" : "",
                isDone && !isTranslatingThis ? "doc-paragraph--translated" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onParagraphClick(idx)}
              role="button"
              tabIndex={0}
              aria-label={`Translation ${idx + 1}`}
              onKeyDown={(e) => e.key === "Enter" && onParagraphClick(idx)}
              id={`trans-para-${idx}`}
            >
              <span
                style={{
                  fontSize: "0.65rem",
                  color: "var(--text-muted)",
                  fontWeight: 700,
                  marginRight: 10,
                  userSelect: "none",
                }}
              >
                {(idx + 1).toString().padStart(2, "0")}
              </span>

              {isTranslatingThis ? (
                <span className="skeleton" style={{ height: "1.2em", width: "80%", display: "inline-block" }} />
              ) : isDone ? (
                <span className="translated-text">{translation}</span>
              ) : (
                <span className="translated-text translated-text--placeholder">
                  Awaiting translation…
                </span>
              )}

              {isDone && !isTranslatingThis && (
                <button
                  className="copy-btn"
                  onClick={(e) => { e.stopPropagation(); copy(translation!, idx); }}
                  aria-label={`Copy translation ${idx + 1}`}
                >
                  {copied === idx ? "✓ Copied" : "Copy"}
                </button>
              )}
            </div>
          );
        })}

        {paragraphs.length === 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 12,
              color: "var(--text-muted)",
              fontSize: "0.9rem",
            }}
          >
            <span style={{ fontSize: "2.5rem" }}>🌐</span>
            <p>Upload a document and click <strong>Translate</strong> to begin</p>
          </div>
        )}
      </div>
    </div>
  );
}

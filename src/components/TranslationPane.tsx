"use client";
import { useState } from "react";

interface Props {
  paragraphs: string[];
  translations: (string | null)[];
  translatingIndex: number | null;
  targetLang: "en" | "vi";
  activeParagraph: number | null;
  onParagraphClick: (i: number) => void;
}

export function TranslationPane({ paragraphs, translations, translatingIndex, targetLang, activeParagraph, onParagraphClick }: Props) {
  const [copied, setCopied] = useState<number | null>(null);

  const copy = async (text: string, i: number) => {
    await navigator.clipboard.writeText(text);
    setCopied(i); setTimeout(() => setCopied(null), 1500);
  };

  const done  = translations.filter(t => t !== null).length;
  const total = paragraphs.length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
  const running = translatingIndex !== null;

  return (
    <div className="pane">
      <div className="pane__header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className={`pane__tag pane__tag--${targetLang}`}>
            {targetLang === "vi" ? "🇻🇳 Tiếng Việt" : "🇺🇸 English"}
          </span>
          {running && <span className="status status--run"><span className="dot"/>Translating</span>}
          {!running && done > 0 && done === total && <span className="status status--ok">✓ Done</span>}
        </div>
        <span className="pane__count">{done}/{total}</span>
      </div>

      {running && (
        <div className="progress">
          <div className="progress__bar" style={{ width: `${pct}%` }} />
        </div>
      )}

      <div className="pane__scroll" id="translation-pane">
        {paragraphs.length === 0 ? (
          <div className="empty">
            <div className="empty__icon">🌐</div>
            <p>Upload a document and press Translate</p>
          </div>
        ) : paragraphs.map((_, i) => {
          const t = translations[i];
          const isWorking = translatingIndex === i;
          const isDone = t !== null;

          return (
            <div
              key={i}
              className={`para${activeParagraph === i ? " para--active" : ""}${isWorking ? " para--working" : ""}${isDone && !isWorking ? " para--done" : ""}`}
              onClick={() => onParagraphClick(i)}
              role="button" tabIndex={0}
              onKeyDown={e => e.key === "Enter" && onParagraphClick(i)}
              id={`trans-para-${i}`}
            >
              <span className="para__n">{String(i + 1).padStart(2, "0")}</span>
              <span className="para__text">
                {isWorking
                  ? <span className="skel" style={{ width: "75%", height: "1em" }} />
                  : isDone
                  ? t
                  : <span className="para__placeholder">Awaiting…</span>}
              </span>
              {isDone && !isWorking && (
                <button className="para__copy"
                  onClick={e => { e.stopPropagation(); copy(t!, i); }}>
                  {copied === i ? "✓" : "Copy"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

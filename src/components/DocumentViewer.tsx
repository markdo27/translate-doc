"use client";
import { useState } from "react";

const LANGS: Record<string, string> = {
  zh: "Chinese", ja: "Japanese", ko: "Korean", en: "English",
  vi: "Vietnamese", ar: "Arabic", ru: "Russian", fr: "French",
};

interface Props {
  paragraphs: string[];
  activeParagraph: number | null;
  onParagraphClick: (i: number) => void;
  title?: string;
  detectedLang?: string;
}

export function DocumentViewer({ paragraphs, activeParagraph, onParagraphClick, title, detectedLang }: Props) {
  const [copied, setCopied] = useState<number | null>(null);

  const copy = async (text: string, i: number) => {
    await navigator.clipboard.writeText(text);
    setCopied(i); setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="pane">
      <div className="pane__header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="pane__tag">Source</span>
          {detectedLang && (
            <span style={{ fontSize: 11, color: "var(--text-3)",
              background: "var(--surface-high)", border: "1px solid var(--border)",
              borderRadius: 6, padding: "2px 8px" }}>
              {LANGS[detectedLang] ?? detectedLang}
            </span>
          )}
        </div>
        <span className="pane__count">{paragraphs.length} ¶</span>
      </div>

      {title && (
        <div style={{ padding: "8px 20px", borderBottom: "1px solid var(--border)",
          fontSize: 11, color: "var(--text-3)", flexShrink: 0,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {title}
        </div>
      )}

      <div className="pane__scroll" id="source-pane">
        {paragraphs.map((p, i) => (
          <div
            key={i}
            className={`para${activeParagraph === i ? " para--active" : ""}`}
            onClick={() => onParagraphClick(i)}
            role="button" tabIndex={0}
            onKeyDown={e => e.key === "Enter" && onParagraphClick(i)}
            id={`src-para-${i}`}
          >
            <span className="para__n">{String(i + 1).padStart(2, "0")}</span>
            <span className="para__text">{p}</span>
            <button className="para__copy"
              onClick={e => { e.stopPropagation(); copy(p, i); }}>
              {copied === i ? "✓" : "Copy"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

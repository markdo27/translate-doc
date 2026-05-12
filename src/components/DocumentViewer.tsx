"use client";

import { useState } from "react";

interface DocumentViewerProps {
  paragraphs: string[];
  activeParagraph: number | null;
  onParagraphClick: (index: number) => void;
  title?: string;
  detectedLang?: string;
}

const LANG_LABELS: Record<string, string> = {
  zh: "中文 (Chinese)",
  ja: "日本語 (Japanese)",
  ko: "한국어 (Korean)",
  en: "English",
  vi: "Tiếng Việt",
  ar: "العربية (Arabic)",
  ru: "Русский (Russian)",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
};

export function DocumentViewer({
  paragraphs,
  activeParagraph,
  onParagraphClick,
  title,
  detectedLang,
}: DocumentViewerProps) {
  const [copied, setCopied] = useState<number | null>(null);

  const copyParagraph = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="doc-pane">
      <div className="pane-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="pane-label pane-label--source">SOURCE</span>
          {detectedLang && (
            <span
              style={{
                fontSize: "0.72rem",
                color: "var(--text-muted)",
                background: "var(--glass-bg)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-full)",
                padding: "2px 10px",
              }}
            >
              🔍 {LANG_LABELS[detectedLang] ?? detectedLang}
            </span>
          )}
        </div>
        <span className="word-count">{paragraphs.length} paragraphs</span>
      </div>

      {title && (
        <div
          style={{
            padding: "12px 20px",
            borderBottom: "1px solid var(--glass-border)",
            fontSize: "0.8rem",
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}
        >
          <span>📁</span>
          <span style={{ fontWeight: 500, color: "var(--text-secondary)" }}>{title}</span>
        </div>
      )}

      <div className="pane-scroll" id="source-pane">
        {paragraphs.map((para, idx) => (
          <div
            key={idx}
            className={`doc-paragraph${activeParagraph === idx ? " doc-paragraph--active" : ""}`}
            onClick={() => onParagraphClick(idx)}
            role="button"
            tabIndex={0}
            aria-label={`Paragraph ${idx + 1}`}
            onKeyDown={(e) => e.key === "Enter" && onParagraphClick(idx)}
            id={`src-para-${idx}`}
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
            {para}
            <button
              className="copy-btn"
              onClick={(e) => { e.stopPropagation(); copyParagraph(para, idx); }}
              aria-label={`Copy paragraph ${idx + 1}`}
            >
              {copied === idx ? "✓ Copied" : "Copy"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

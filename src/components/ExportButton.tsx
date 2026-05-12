"use client";

import { useState } from "react";

interface ExportButtonProps {
  paragraphs: string[];
  translations: (string | null)[];
  targetLang: "en" | "vi";
  fileName?: string;
  disabled?: boolean;
}

export function ExportButton({
  paragraphs,
  translations,
  targetLang,
  fileName,
  disabled,
}: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const baseName = fileName?.replace(/\.[^.]+$/, "") ?? "document";
  const outName = `${baseName}_${targetLang.toUpperCase()}_translated`;

  const completedCount = translations.filter((t) => t !== null).length;
  const isDisabled = disabled || completedCount === 0;

  // ── Export as TXT ────────────────────────────────────────
  const exportTxt = () => {
    setExporting(true);
    try {
      const lines = translations.map((t, i) =>
        t !== null ? t : `[Not translated] ${paragraphs[i]}`
      );
      const content = lines.join("\n\n");
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${outName}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  // ── Export as DOCX (via docx library) ────────────────────
  const exportDocx = async () => {
    setExporting(true);
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");

      const docParagraphs = [
        new Paragraph({
          text: `${outName}`,
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Translated to ${targetLang === "vi" ? "Tiếng Việt" : "English"} by Translaate`,
              color: "888888",
              size: 20,
            }),
          ],
        }),
        new Paragraph({ text: "" }), // spacer
        ...translations.map((t, i) =>
          new Paragraph({
            children: [
              new TextRun({
                text: t !== null ? t : `[Not translated] ${paragraphs[i]}`,
                size: 24,
              }),
            ],
            spacing: { after: 200 },
          })
        ),
      ];

      const doc = new Document({
        creator: "Translaate",
        title: outName,
        description: `Document translated to ${targetLang}`,
        sections: [{ children: docParagraphs }],
      });

      const buffer = await Packer.toBlob(doc);
      const url = URL.createObjectURL(buffer);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${outName}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("DOCX export failed:", err);
      alert("DOCX export failed. Falling back to TXT.");
      exportTxt();
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="export-panel">
      <button
        className="btn btn--glass btn--sm"
        onClick={exportTxt}
        disabled={isDisabled || exporting}
        id="export-txt-btn"
        data-tooltip="Download as plain text"
        aria-label="Export as TXT"
      >
        📝 TXT
      </button>
      <button
        className="btn btn--primary btn--sm"
        onClick={exportDocx}
        disabled={isDisabled || exporting}
        id="export-docx-btn"
        data-tooltip="Download as Word document"
        aria-label="Export as DOCX"
      >
        {exporting ? "⚙️ Exporting…" : "⬇️ Export DOCX"}
      </button>
    </div>
  );
}

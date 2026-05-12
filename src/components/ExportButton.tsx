"use client";
import { useState } from "react";

interface Props {
  paragraphs: string[];
  translations: (string | null)[];
  targetLang: "en" | "vi";
  fileName?: string;
  disabled?: boolean;
}

export function ExportButton({ paragraphs, translations, targetLang, fileName, disabled }: Props) {
  const [busy, setBusy] = useState(false);
  const base    = (fileName?.replace(/\.[^.]+$/, "") ?? "document") + `_${targetLang.toUpperCase()}`;
  const hasData = translations.some(t => t !== null);

  const exportTxt = () => {
    setBusy(true);
    try {
      const blob = new Blob(
        [translations.map((t, i) => t ?? paragraphs[i]).join("\n\n")],
        { type: "text/plain;charset=utf-8" }
      );
      const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `${base}.txt` });
      a.click(); URL.revokeObjectURL(a.href);
    } finally { setBusy(false); }
  };

  const exportDocx = async () => {
    setBusy(true);
    try {
      const { Document, Packer, Paragraph: DocxPara, TextRun, HeadingLevel } = await import("docx");
      const doc = new Document({
        creator: "Translaate", title: base,
        sections: [{
          children: [
            new DocxPara({ text: base, heading: HeadingLevel.HEADING_1 }),
            new DocxPara({ text: "" }),
            ...translations.map((t, i) => new DocxPara({
              children: [new TextRun({ text: t ?? paragraphs[i], size: 24 })],
              spacing: { after: 180 },
            })),
          ],
        }],
      });
      const blob = await Packer.toBlob(doc);
      const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `${base}.docx` });
      a.click(); URL.revokeObjectURL(a.href);
    } catch { exportTxt(); }
    finally { setBusy(false); }
  };

  return (
    <div className="export">
      <button className="btn btn--ghost" onClick={exportTxt}
        disabled={disabled || !hasData || busy} id="export-txt-btn">
        TXT
      </button>
      <button className="btn btn--ghost" onClick={exportDocx}
        disabled={disabled || !hasData || busy} id="export-docx-btn">
        {busy ? "…" : "↓ DOCX"}
      </button>
    </div>
  );
}

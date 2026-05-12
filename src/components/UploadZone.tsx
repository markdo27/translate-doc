"use client";
import { useCallback, useRef, useState } from "react";

interface Props { onFileSelect: (f: File) => void; isLoading?: boolean; }

const ACCEPT = [".pdf", ".docx", ".doc", ".txt"];

export function UploadZone({ onFileSelect, isLoading }: Props) {
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  const handle = useCallback((file: File) => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ACCEPT.includes(ext)) { setError("Unsupported format. Use PDF, DOCX, or TXT."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("File too large — max 10 MB."); return; }
    setError(null);
    onFileSelect(file);
  }, [onFileSelect]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) handle(f);
  }, [handle]);

  return (
    <div>
      <div
        className={`upload-zone${drag ? " upload-zone--drag" : ""}`}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => !isLoading && ref.current?.click()}
        role="button" tabIndex={0} id="upload-zone"
        onKeyDown={e => e.key === "Enter" && !isLoading && ref.current?.click()}
      >
        <input
          ref={ref} type="file" className="upload-zone__input"
          accept=".pdf,.docx,.doc,.txt" onChange={e => { const f = e.target.files?.[0]; if (f) handle(f); e.target.value = ""; }}
          tabIndex={-1} id="file-input"
        />
        <div className="upload-zone__icon">
          {isLoading ? "⚙️" : "↑"}
        </div>
        {isLoading ? (
          <>
            <p className="upload-zone__title">Parsing document…</p>
            <p className="upload-zone__sub">Extracting text and detecting language</p>
            <div className="progress" style={{ maxWidth: 200, margin: "20px auto 0", borderRadius: 2 }}>
              <div className="progress__bar progress__bar--run" />
            </div>
          </>
        ) : (
          <>
            <p className="upload-zone__title">{drag ? "Drop to upload" : "Upload your document"}</p>
            <p className="upload-zone__sub">Drag & drop, or click to browse — up to 10 MB</p>
            <div className="upload-zone__badges">
              {ACCEPT.map(f => <span key={f} className="badge">{f.replace(".", "")}</span>)}
            </div>
          </>
        )}
      </div>
      {error && (
        <div style={{ marginTop: 12, padding: "10px 16px", borderRadius: 10,
          background: "rgba(255,69,58,0.08)", border: "1px solid rgba(255,69,58,0.18)",
          color: "var(--err)", fontSize: 13 }} role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

"use client";

import { useCallback, useRef, useState } from "react";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

const ACCEPTED = [".pdf", ".docx", ".doc", ".txt"];
const MAX_SIZE_MB = 10;

export function UploadZone({ onFileSelect, isLoading }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = (file: File): string | null => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED.includes(ext) && !ACCEPTED.includes("." + file.type.split("/").pop())) {
      return `Unsupported format. Please upload: ${ACCEPTED.join(", ")}`;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File too large. Maximum size is ${MAX_SIZE_MB} MB.`;
    }
    return null;
  };

  const handleFile = useCallback(
    (file: File) => {
      const err = validate(file);
      if (err) { setError(err); return; }
      setError(null);
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  return (
    <div style={{ width: "100%" }}>
      <div
        className={`upload-zone${isDragging ? " upload-zone--drag" : ""}${isLoading ? " upload-zone--loading" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => !isLoading && inputRef.current?.click()}
        role="button"
        aria-label="Upload document"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && !isLoading && inputRef.current?.click()}
        id="upload-zone"
      >
        <input
          ref={inputRef}
          type="file"
          className="upload-zone__input"
          accept=".pdf,.docx,.doc,.txt,text/plain,application/pdf"
          onChange={onInputChange}
          tabIndex={-1}
          id="file-input"
        />

        {isLoading ? (
          <>
            <span className="upload-zone__icon" style={{ animation: "none" }}>⚙️</span>
            <p className="upload-zone__title">Processing document…</p>
            <p className="upload-zone__sub">Extracting text and detecting language</p>
            <div className="progress-bar" style={{ maxWidth: 240, margin: "0 auto" }}>
              <div className="progress-bar__fill progress-bar__fill--indeterminate" />
            </div>
          </>
        ) : (
          <>
            <span className="upload-zone__icon">📄</span>
            <p className="upload-zone__title">
              {isDragging ? "Drop your document here" : "Upload your document"}
            </p>
            <p className="upload-zone__sub">
              Drag &amp; drop or click to browse — up to {MAX_SIZE_MB} MB
            </p>
            <div className="upload-zone__formats">
              {ACCEPTED.map((f) => (
                <span key={f} className="format-badge">{f.replace(".", "")}</span>
              ))}
            </div>
          </>
        )}
      </div>

      {error && (
        <div
          style={{
            marginTop: 12,
            padding: "10px 16px",
            borderRadius: 8,
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#ef4444",
            fontSize: "0.875rem",
          }}
          role="alert"
        >
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}

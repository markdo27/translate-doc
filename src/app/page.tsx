"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Header from "@/components/Header";
import { UploadZone } from "@/components/UploadZone";

const FEATURES = [
  { icon: "📄", label: "PDF support" },
  { icon: "📝", label: "DOCX / DOC" },
  { icon: "🔤", label: "Plain text" },
  { icon: "🇻🇳", label: "Tiếng Việt" },
  { icon: "🇺🇸", label: "English" },
  { icon: "✨", label: "Correct accents" },
  { icon: "⬇️", label: "Export DOCX" },
  { icon: "🔒", label: "No data stored" },
];

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/parse", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Failed to parse file");

      // Store parsed doc in sessionStorage and navigate to translate page
      sessionStorage.setItem(
        "translaate_doc",
        JSON.stringify({
          paragraphs: data.paragraphs,
          wordCount: data.wordCount,
          charCount: data.charCount,
          detectedLang: data.detectedLang,
          fileName: data.fileName,
          fileSize: data.fileSize,
        })
      );

      router.push("/translate");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-wrapper">
      <Header />

      <main>
        {/* Hero */}
        <section className="hero container">
          <div className="anim-fade-in-up">
            <div className="hero__eyebrow">
              <span>✨</span> AI-Powered Document Translation
            </div>
            <h1 className="hero__title">
              Translate documents with<br />
              <span>perfect accents</span>
            </h1>
            <p className="hero__subtitle">
              Upload any PDF, DOCX, or TXT file and instantly translate it to
              <strong style={{ color: "var(--vi-accent)" }}> Tiếng Việt</strong> or{" "}
              <strong style={{ color: "var(--en-accent)" }}>English</strong> — with full
              diacritical accuracy.
            </p>

            <div className="feature-pills">
              {FEATURES.map((f) => (
                <div key={f.label} className="feature-pill">
                  <span className="icon">{f.icon}</span>
                  {f.label}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Upload */}
        <section
          className="container anim-fade-in-up"
          style={{ maxWidth: 760, animationDelay: "0.1s" }}
        >
          <UploadZone onFileSelect={handleFile} isLoading={loading} />

          {error && (
            <div
              role="alert"
              style={{
                marginTop: 16,
                padding: "12px 20px",
                borderRadius: 10,
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#ef4444",
                fontSize: "0.9rem",
              }}
            >
              ⚠️ {error}
            </div>
          )}
        </section>

        {/* How it works */}
        <section
          className="container anim-fade-in-up"
          style={{
            maxWidth: 900,
            marginTop: 64,
            animationDelay: "0.2s",
          }}
        >
          <h2
            style={{
              textAlign: "center",
              fontSize: "1.1rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              marginBottom: 32,
            }}
          >
            How it works
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
            }}
          >
            {[
              {
                step: "01",
                icon: "📤",
                title: "Upload",
                desc: "Drop your PDF, DOCX, or TXT file into the upload zone.",
              },
              {
                step: "02",
                icon: "🔍",
                title: "Detect",
                desc: "We auto-detect the source language — Chinese, Japanese, English, and more.",
              },
              {
                step: "03",
                icon: "🌐",
                title: "Translate",
                desc: "Choose English or Vietnamese. Translation happens paragraph by paragraph.",
              },
              {
                step: "04",
                icon: "⬇️",
                title: "Export",
                desc: "Download your translated document as a clean DOCX or TXT file.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="glass glass--raised"
                style={{ padding: "24px 20px", position: "relative", overflow: "hidden" }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 16,
                    fontSize: "2.5rem",
                    fontWeight: 900,
                    color: "var(--glass-border)",
                    lineHeight: 1,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {item.step}
                </span>
                <div style={{ fontSize: "1.8rem", marginBottom: 12 }}>{item.icon}</div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 8 }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Vietnamese accent showcase */}
        <section
          className="container anim-fade-in-up"
          style={{ maxWidth: 900, marginTop: 48, marginBottom: 80, animationDelay: "0.3s" }}
        >
          <div
            className="glass"
            style={{
              padding: "32px 40px",
              borderColor: "rgba(255,107,53,0.2)",
              background: "rgba(255,107,53,0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 24, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <p
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    marginBottom: 12,
                  }}
                >
                  Source (Chinese)
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-doc)",
                    fontSize: "1.05rem",
                    lineHeight: 1.8,
                    color: "var(--text-primary)",
                  }}
                >
                  中华人民共和国海商法是调整海上运输关系的法律规范。
                </p>
              </div>
              <div
                style={{
                  width: 1,
                  background: "rgba(255,107,53,0.2)",
                  alignSelf: "stretch",
                  minHeight: 60,
                }}
              />
              <div style={{ flex: 1, minWidth: 200 }}>
                <p
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--vi-accent)",
                    marginBottom: 12,
                  }}
                >
                  🇻🇳 Tiếng Việt — Correct accents
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-doc)",
                    fontSize: "1.05rem",
                    lineHeight: 1.8,
                    color: "var(--text-primary)",
                  }}
                >
                  Luật Hàng hải Cộng hòa Nhân dân Trung Hoa là quy phạm pháp luật điều chỉnh các
                  quan hệ vận tải biển.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

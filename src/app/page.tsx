"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Header from "@/components/Header";
import { UploadZone } from "@/components/UploadZone";

const STEPS = [
  { n: "01", icon: "↑", title: "Upload",   desc: "Drop a PDF, DOCX, or TXT file. Up to 10 MB." },
  { n: "02", icon: "◎", title: "Detect",   desc: "Source language is automatically identified — Chinese, Japanese, Arabic, and more." },
  { n: "03", icon: "⇄", title: "Translate",desc: "Choose English or Vietnamese. Translation streams paragraph by paragraph." },
  { n: "04", icon: "↓", title: "Export",   desc: "Download the result as a clean DOCX or TXT file." },
];

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setLoading(true); setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/parse", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to parse file");
      sessionStorage.setItem("translaate_doc", JSON.stringify(data));
      router.push("/translate");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "An unexpected error occurred.");
    } finally { setLoading(false); }
  };

  return (
    <div className="app">
      <Header />
      <main>
        {/* ── HERO ── */}
        <section className="hero container">
          <div className="anim-up">
            <p className="hero__label">Document Translation</p>
            <h1 className="hero__h1">
              Translate with<br /><em>perfect accents</em>
            </h1>
            <p className="hero__sub">
              Upload any PDF, DOCX, or TXT and get an accurate translation in
              English or Vietnamese — diacritics included.
            </p>
          </div>

          <div className="anim-up anim-up-1" style={{ maxWidth: 640, margin: "0 auto" }}>
            <UploadZone onFileSelect={handleFile} isLoading={loading} />
            {error && (
              <div style={{ marginTop: 12, padding: "10px 16px", borderRadius: 10,
                background: "rgba(255,69,58,0.08)", border: "1px solid rgba(255,69,58,0.18)",
                color: "var(--err)", fontSize: 13 }} role="alert">
                {error}
              </div>
            )}
          </div>
        </section>

        {/* ── STEPS ── */}
        <section className="steps container anim-up anim-up-2">
          <p className="steps__label">How it works</p>
          <div className="steps__grid">
            {STEPS.map(s => (
              <div key={s.n} className="step-card">
                <p className="step-num">{s.n}</p>
                <span className="step-icon">{s.icon}</span>
                <p className="step-title">{s.title}</p>
                <p className="step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── PREVIEW ── */}
        <section className="preview-strip container anim-up anim-up-3">
          <div className="preview-card">
            <div className="preview-card__header">
              <div className="preview-card__dot" style={{ background: "#FF5F57" }} />
              <div className="preview-card__dot" style={{ background: "#FFBD2E" }} />
              <div className="preview-card__dot" style={{ background: "#28C840" }} />
              <span className="preview-card__title">Example — 中华人民共和国海商法</span>
            </div>
            <div className="preview-card__body">
              <div className="preview-cell">
                <p className="preview-cell__lang preview-cell__lang--zh">Source · Chinese</p>
                <p className="preview-cell__text">
                  中华人民共和国海商法是调整海上运输关系、船舶关系的法律规范，自1993年7月1日起施行。
                </p>
              </div>
              <div style={{ background: "var(--border)" }} />
              <div className="preview-cell">
                <p className="preview-cell__lang preview-cell__lang--vi">🇻🇳 Tiếng Việt</p>
                <p className="preview-cell__text">
                  Luật Hàng hải Cộng hòa Nhân dân Trung Hoa là quy phạm pháp luật điều chỉnh quan hệ vận tải biển và quan hệ tàu thuyền, có hiệu lực từ ngày 1 tháng 7 năm 1993.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

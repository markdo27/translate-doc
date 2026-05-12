"use client";

interface Props { value: "en" | "vi"; onChange: (l: "en" | "vi") => void; disabled?: boolean; }

export function LanguageSelector({ value, onChange, disabled }: Props) {
  return (
    <div className="lang-sel" role="group" aria-label="Target language">
      <button
        className={`lang-opt${value === "en" ? " lang-opt--active" : ""}`}
        onClick={() => onChange("en")} disabled={disabled}
        aria-pressed={value === "en"} id="lang-btn-en"
      >
        <span>🇺🇸</span> English
      </button>
      <button
        className={`lang-opt${value === "vi" ? " lang-opt--active" : ""}`}
        onClick={() => onChange("vi")} disabled={disabled}
        aria-pressed={value === "vi"} id="lang-btn-vi"
      >
        <span>🇻🇳</span> Tiếng Việt
      </button>
    </div>
  );
}

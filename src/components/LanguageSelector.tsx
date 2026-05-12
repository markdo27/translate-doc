"use client";

interface LanguageSelectorProps {
  value: "en" | "vi";
  onChange: (lang: "en" | "vi") => void;
  disabled?: boolean;
}

const LANGS: { code: "en" | "vi"; flag: string; label: string }[] = [
  { code: "en", flag: "🇺🇸", label: "English" },
  { code: "vi", flag: "🇻🇳", label: "Tiếng Việt" },
];

export function LanguageSelector({ value, onChange, disabled }: LanguageSelectorProps) {
  return (
    <div
      className="lang-selector"
      role="group"
      aria-label="Target translation language"
    >
      <span
        style={{
          fontSize: "0.7rem",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          paddingLeft: 8,
          paddingRight: 4,
          whiteSpace: "nowrap",
        }}
      >
        Translate to
      </span>
      {LANGS.map((lang) => (
        <button
          key={lang.code}
          className={`lang-btn${value === lang.code ? " lang-btn--active" : ""}`}
          data-lang={lang.code}
          onClick={() => onChange(lang.code)}
          disabled={disabled}
          aria-pressed={value === lang.code}
          id={`lang-btn-${lang.code}`}
        >
          <span>{lang.flag}</span>
          <span>{lang.label}</span>
        </button>
      ))}
    </div>
  );
}

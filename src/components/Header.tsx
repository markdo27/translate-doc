import Link from "next/link";

export default function Header() {
  return (
    <header className="header">
      <div className="container">
        <div className="header__inner">
          <Link href="/" className="logo" id="logo-link">
            <div className="logo__icon">🌐</div>
            <span className="logo__text">Translaate</span>
            <span className="logo__badge">Beta</span>
          </Link>
          <nav style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <a
              href="https://mymemory.translated.net"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--glass btn--sm"
              id="powered-by-link"
            >
              Powered by MyMemory
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}

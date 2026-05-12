import Link from "next/link";

export default function Header() {
  return (
    <header className="header">
      <div className="container">
        <div className="header__inner">
          <Link href="/" className="logo" id="logo-link">
            <div className="logo__mark">🌐</div>
            <span className="logo__name">Translaate</span>
            <span className="logo__ver">BETA</span>
          </Link>
          <a
            href="https://mymemory.translated.net"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--ghost"
            style={{ fontSize: 12 }}
            id="powered-by-link"
          >
            Powered by MyMemory ↗
          </a>
        </div>
      </div>
    </header>
  );
}

/**
 * Author and terms of use. Landing page only: /translate runs as a fixed
 * height workspace with its own overflow, so a footer there would be clipped.
 */
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <p className="site-footer__label">About &amp; Licence</p>
        <dl className="about">
          <dt>Author</dt>
          <dd>Mark Do</dd>

          <dt>Contact</dt>
          <dd>
            <a href="mailto:dtcmark@gmail.com">dtcmark@gmail.com</a>
          </dd>

          <dt>Personal use</dt>
          <dd>
            Free. Use this tool, and anything you make with it, for personal, study and other
            non commercial work. No permission needed.
          </dd>

          <dt>Commercial use</dt>
          <dd>
            Ask first. Client, brand, resale and any other paid work needs written permission:{" "}
            <a href="mailto:dtcmark@gmail.com?subject=Commercial%20use%20request">
              request a licence
            </a>
            .
          </dd>
        </dl>
        <p className="site-footer__note">© 2026 Mark Do. Provided as is, with no warranty.</p>
      </div>
    </footer>
  );
}

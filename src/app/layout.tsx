import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Translaate — Document Translation",
  description: "Upload PDF, DOCX, or TXT and translate to English or Vietnamese with perfect diacritical accents.",
  keywords: "translate, document, Vietnamese, PDF, DOCX, translation",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

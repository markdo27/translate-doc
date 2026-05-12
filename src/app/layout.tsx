import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Translaate — Document Translation Tool",
  description:
    "Upload PDF, DOCX or TXT documents and translate them to English or Vietnamese with correct diacritical accents instantly.",
  keywords: "translate, document, Vietnamese, diacritics, PDF, DOCX, translation tool",
  openGraph: {
    title: "Translaate",
    description: "Translate documents to English or Vietnamese with perfect accents",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {/* Decorative background */}
        <div className="bg-grid" aria-hidden="true" />
        <div className="bg-orb bg-orb--teal" aria-hidden="true" />
        <div className="bg-orb bg-orb--purple" aria-hidden="true" />
        <div className="bg-orb bg-orb--blue" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}

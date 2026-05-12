# Translaate 🌐

A premium document translation tool — upload PDF, DOCX, or TXT files and translate to **English** or **Vietnamese** with correct diacritical accents.

## Features

- 📄 Upload **PDF**, **DOCX**, **DOC**, **TXT** (up to 10 MB)
- 🔍 **Auto-detect** source language (Chinese, Japanese, Arabic, Russian, and more)
- 🇻🇳 **Tiếng Việt** — correct diacritics (`ắ ổ ụ ệ ồ ứ`)
- 🇺🇸 **English** translation
- ⚡ Streaming paragraph-by-paragraph progress
- ⬇️ Export translated doc as **DOCX** or **TXT**
- 🔒 No data stored — everything processed in-memory

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Styling | Vanilla CSS (dark glassmorphism) |
| PDF parsing | `pdfjs-dist` (pure JS, Vercel-safe) |
| DOCX parsing | `mammoth` |
| Translation | [MyMemory API](https://mymemory.translated.net) (free, 100k chars/day) |
| Export | `docx` npm package (client-side) |
| Fonts | Inter + Noto Sans (full Unicode / CJK / Vietnamese) |

## Local Development

```bash
npm install
npm run dev
# → http://localhost:3000
```

## Deploy to Vercel

### One-click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/markdo27/translate-doc)

### Manual deploy

```bash
npm i -g vercel
vercel
```

> **Note on file size limits:**
> - Vercel **Hobby** plan: 4.5 MB max request body per serverless function
> - Vercel **Pro** plan: supports larger payloads
> - If you need >4.5 MB PDFs on Hobby, consider chunked streaming upload

## Environment Variables

No API keys required. The app uses the free [MyMemory](https://mymemory.translated.net) translation API which allows 100,000 characters/day without a key.

To increase limits, register for a free MyMemory key and add:

```env
MYMEMORY_KEY=your_key_here
```

Then update `src/app/api/translate/route.ts` to append `&key=${process.env.MYMEMORY_KEY}` to the API URL.

## Project Structure

```
src/
├── app/
│   ├── globals.css              # Design system
│   ├── page.tsx                 # Landing page
│   ├── translate/page.tsx       # Translation workspace
│   └── api/
│       ├── parse/route.ts       # File parsing (PDF/DOCX/TXT)
│       └── translate/route.ts   # MyMemory translation wrapper
└── components/
    ├── Header.tsx
    ├── UploadZone.tsx
    ├── DocumentViewer.tsx       # Source text pane
    ├── TranslationPane.tsx      # Translated output pane
    ├── LanguageSelector.tsx     # EN/VI toggle
    └── ExportButton.tsx         # DOCX/TXT export
```

## License

MIT

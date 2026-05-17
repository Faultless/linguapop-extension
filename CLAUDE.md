# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

LinguaPop is a language-learning novel reader. Users import EPUB/TXT files (or a paired original+translation), and read them with switchable view modes (original / translated / parallel), per-token JLPT color coding for Japanese, tap-for-dictionary, select-for-translation, custom themes, multiple layouts, TTS, and fullscreen. Available as a browser extension, web app, and mobile (Capacitor) app. There is no backend — all state is stored in localStorage / IndexedDB.

## Monorepo Structure

pnpm workspace with six packages under `packages/`:

- **`@linguapop/core`** — shared business logic: types, hooks (`useNovels`, `useReaderPrefs`), reader-prefs context, importers (EPUB/TXT), content cleaner, machine translation, kuromoji wrapper, JLPT vocab, Jisho dictionary lookup, IDB key-value store.
- **`@linguapop/ui`** — shared React components and views: `ReadTab` (entire app), `Library` (home), `Reader` (the reading view), `ImportNovelPanel`, `ReaderSettingsPanel`, `JapaneseText` (colored tokens), `JlptWordPopover`.
- **`@linguapop/extension`** — Chrome/Firefox MV3 popup (420×580px fixed viewport).
- **`@linguapop/web`** — responsive web app (`max-w-lg`).
- **`@linguapop/mobile`** — Capacitor 7 wrapper (iOS/Android) around the same web app.
- **`@linguapop/landing`** — static HTML/Tailwind marketing page (no React), deployed to GitHub Pages at `/linguapop-extension/`.

All three app targets (extension, web, mobile) render `<ReaderPrefsProvider><ReadTab/></ReaderPrefsProvider>` — there is no tab navigation, the reader is the entire app.

## Common Commands

```bash
# Development
pnpm dev:extension       # extension popup dev server
pnpm dev:web             # web app dev server
pnpm dev:landing         # landing page dev server

# Building
pnpm build:extension     # produces packages/extension/dist/
pnpm build:web
pnpm build:mobile        # web build + cap sync
pnpm build:android
pnpm build:landing
pnpm build               # builds all packages

# Linting
pnpm lint                # ESLint across entire monorepo
```

Mobile Capacitor commands (run inside `packages/mobile`):
```bash
pnpm cap:sync            # sync web build to native
pnpm cap:open:ios        # open Xcode
pnpm cap:open:android    # open Android Studio
```

There are no test commands — there is currently no test suite.

## Key Architecture Decisions

### State Management

No global state library. Single source of truth for reader prefs lives in `ReaderPrefsProvider` (Context). Novels are held by `useNovels`: lightweight `NovelMeta[]` index in localStorage, full `NovelBody` (chapters) per novel in IndexedDB.

### Theming

`ReaderPrefs.themeId` selects from `BUILTIN_THEMES` (plus user-defined `customThemes`). The active theme is applied app-wide via inline styles reading `theme.bg / fg / accent / muted`. There is no CSS variable scaffolding — components consume the theme through the context.

### Translation

`translateText(text, src, tgt, opts?)` is the unified MT call: tries Capacitor native (iOS Translation / ML Kit on Android) if a plugin is registered, then Google Translate's public `gtx` endpoint, then LibreTranslate. Long chapters are split on paragraph/sentence boundaries. Translation is **explicit only** — never auto-fires; user presses the in-reader Translate button or selects text.

### Japanese

`kuromoji.js` is loaded as a UMD `<script>` from jsDelivr the first time a Japanese chapter is opened (its IPADIC dict, ~10 MB, is fetched from the same CDN and browser-cached). Tokens are colored by JLPT level using a curated starter vocab list bundled in core. Tap a token → Jisho dictionary lookup (cached in IDB). Drag-select a span → `translateText` of the selection.

### Importers

`parseEpub` handles EPUB 2/3 via JSZip; `splitTxtIntoChapters` heuristically splits .txt files. `pruneNovel()` strips frontmatter/backmatter (copyright pages, TOC, dedications, "About the author"). `alignChapters()` pairs original + translation chapter-by-chapter (by index, falling back to title-similarity Jaccard).

### CORS

`corsFetch` (in `packages/core/src/utils/corsFetch.ts`) routes through:
- **Extension:** direct `fetch` (MV3 `host_permissions: ["*://*/*"]`).
- **Mobile:** direct `fetch` (Capacitor WebView).
- **Dev server:** Vite middleware at `/cors-proxy` (configured in each package's `vite.config.ts`).
- **Production web:** `VITE_CORS_PROXY_URL` env var or direct fetch fallback.

## Tech Stack

All packages share: React 19, TypeScript 6 (strict), Vite 8, Tailwind CSS 4 (via `@tailwindcss/vite`), ESLint 9 (flat config). TypeScript has `noUnusedLocals` and `noUnusedParameters` — keep imports and parameters clean.

## Deployment

The landing page deploys automatically to GitHub Pages via `.github/workflows/deploy-landing.yml` on every push to `main`.

# LinguaPop

Smart language learning resource recommendations — radio, podcasts, YouTube and more, matched to your level and interests.

Available as a **browser extension** (Chrome/Firefox), **web app**, and **mobile app** (Android via Capacitor).

## Features

- **Live radio** — Stream stations in your target language
- **Podcasts** — Browse episodes with a built-in audio player and adjustable playback speed
- **YouTube** — Curated channels for language learners
- **Custom feeds** — Paste any YouTube channel, podcast RSS, or website URL and it gets parsed alongside curated content
- **Smart matching** — Set your level (beginner/intermediate/advanced) and interests; resources are ranked by relevance
- **10 languages** — French, Spanish, German, Italian, Portuguese, Japanese, Korean, Chinese, Arabic, Russian
- **No account required** — Preferences stored locally on-device

## Monorepo Structure

```
packages/
  core/        Shared logic: types, data, hooks, utils, audio context
  ui/          Shared React components and views
  extension/   Browser extension target (Chrome/Firefox, MV3)
  web/         Responsive web app target
  mobile/      Capacitor mobile app target (iOS/Android)
  landing/     Static landing page (deployed to GitHub Pages)
```

## Getting Started

```sh
pnpm install
```

### Development

```sh
pnpm dev:extension    # Browser extension (localhost:5173)
pnpm dev:web          # Web app
pnpm dev:landing      # Landing page
```

### Building

```sh
pnpm build:extension  # → packages/extension/dist/
pnpm build:web        # → packages/web/dist/
pnpm build:landing    # → packages/landing/dist/
pnpm build            # Build all packages
```

### Loading the Extension

1. Run `pnpm build:extension`
2. **Chrome**: `chrome://extensions` → Developer Mode → Load unpacked → select `packages/extension/dist/`
3. **Firefox**: `about:debugging` → This Firefox → Load Temporary Add-on → select `packages/extension/dist/manifest.json`

### Mobile (Capacitor)

```sh
cd packages/mobile
npx cap add ios        # First time only
npx cap add android    # First time only
pnpm build && npx cap sync
npx cap open ios       # Open in Xcode
npx cap open android   # Open in Android Studio
```

## Tech Stack

- React 19, TypeScript 6, Vite 8
- Tailwind CSS 4
- Capacitor 7 (mobile)
- pnpm workspaces

## Landing Page

Hosted on GitHub Pages and auto-deployed via GitHub Actions on push to `main`.

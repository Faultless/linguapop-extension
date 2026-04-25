# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

LinguaPop is a language-learning resource aggregator available as a browser extension, web app, and mobile app. It surfaces curated and user-added podcasts, YouTube channels, radio streams, and more across 10 languages. There is no backend — all state is stored in localStorage/device storage.

## Monorepo Structure

pnpm workspace with six packages under `packages/`:

- **`@linguapop/core`** — shared business logic: data fetching (`corsFetch`), feed parsing (RSS/Atom/YouTube), hooks (`usePrefs`, `useSaved`, `useCustomFeeds`), types, and the curated resources dataset
- **`@linguapop/ui`** — shared React components and views (tabs, cards, drawers, audio player)
- **`@linguapop/extension`** — Chrome/Firefox MV3 popup (420×580px fixed viewport)
- **`@linguapop/web`** — responsive web app, same React `<App>` as the extension
- **`@linguapop/mobile`** — Capacitor 7 wrapper (iOS/Android) around the same web app
- **`@linguapop/landing`** — static HTML/Tailwind marketing page (no React), deployed to GitHub Pages at `/linguapop-extension/`

All three app targets (extension, web, mobile) render the identical `<App>` component from `@linguapop/ui`. Platform differences are limited to viewport CSS and CORS handling.

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

### CORS Strategy

`corsFetch` (in `packages/core/src/utils/corsFetch.ts`) detects the runtime environment and routes requests accordingly:
- **Extension:** direct `fetch` — MV3 `host_permissions: ["*://*/*"]` grants CORS-free access
- **Mobile:** Capacitor's `CapacitorHttp` plugin (native HTTP, bypasses CORS)
- **Dev server:** proxied through Vite middleware at `/cors-proxy` (configured in each package's `vite.config.ts`)
- **Production web:** uses `VITE_CORS_PROXY_URL` env var or falls back to direct fetch

### State Management

No global state library. Three custom React hooks backed by localStorage:
- `usePrefs` — UI preferences (language filter, level, interests)
- `useSaved` — saved/bookmarked resources
- `useCustomFeeds` — user-added feed URLs

### Audio Playback

A single `AudioContext` (React Context wrapping `HTMLAudioElement`) is provided at app root and consumed everywhere. Only one track plays at a time across all views.

### Feed Parsing

`packages/core/src/utils/` contains parsers for RSS, Atom, and YouTube. YouTube channel resolution handles `@handles`, channel IDs, and playlist URLs via HTML scraping with a fallback chain: direct feed → `<link>` tag detection → scrape.

### Curated Data

70+ resources defined in `packages/core/src/data/resources.ts`. Each resource has: `type` (radio | podcast | youtube | website | newsletter), `language`, `level` (beginner | intermediate | advanced), `interests[]`, and feed/URL metadata.

## Tech Stack

All packages share: React 19, TypeScript 6 (strict), Vite 8, Tailwind CSS 4 (via `@tailwindcss/vite`), ESLint 9 (flat config).

TypeScript is configured with `noUnusedLocals` and `noUnusedParameters` — keep imports and parameters clean.

## Deployment

The landing page deploys automatically to GitHub Pages via `.github/workflows/deploy-landing.yml` on every push to `main`.

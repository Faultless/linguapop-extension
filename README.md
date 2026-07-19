# LinguaPop

A Japanese language-learning novel reader. Import EPUB / TXT files (or a paired original + translation), and read with switchable view modes, per-token JLPT color coding, tap-for-dictionary, select-for-translation, custom themes, TTS, and more.

> **Status**: this repo is being migrated from a React/TypeScript monorepo to a single **Flutter** codebase. The old TS sources are kept under `legacy_ts/` as reference. See `CLAUDE.md` for the migration status table.

## Targets

| Platform     | Status      | Notes                                  |
|--------------|-------------|----------------------------------------|
| Android      | ✅ scaffold | Native back button, edge-to-edge       |
| Linux desktop| ✅ scaffold |                                        |
| Web          | ✅ scaffold | No MeCab — tokenizer is degraded on web|
| iOS          | ⏳ not yet  | `flutter create . --platforms ios`     |

## Getting started

```bash
flutter pub get
flutter run                 # auto-pick device
flutter run -d chrome       # web
flutter run -d linux        # Linux desktop
```

### Building

```bash
flutter build apk --debug         # Android APK
flutter build apk --release
flutter build web
flutter build linux
```

### Checks

```bash
flutter analyze       # static analysis + lints
flutter test          # tests
```

## Project layout

```
lib/
  main.dart        bootstrap
  app.dart         MaterialApp.router
  data/            models · storage · themes
  providers/       Riverpod state notifiers
  ui/              router · screens · widgets
assets/jlpt/       JLPT vocab JSON (port of legacy_ts data)
legacy_ts/         previous React/TS monorepo (reference only)
```

For architectural decisions, conventions, and a port checklist, see `CLAUDE.md`.

## Tech stack

- Flutter 3.41 (Dart 3.11)
- Riverpod (state) · go_router (navigation) · Hive (storage)
- mecab_dart (Japanese tokenization, native) · flutter_tts · http
- archive · xml · file_picker (EPUB / TXT import)

## License

TBD.

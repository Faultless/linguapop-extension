#!/usr/bin/env bash
# Netlify build: install Flutter, build the web app, assemble the site.
set -euo pipefail

FLUTTER_DIR="${HOME}/flutter-sdk"
if [ ! -d "$FLUTTER_DIR" ]; then
  git clone --depth 1 --branch stable https://github.com/flutter/flutter.git "$FLUTTER_DIR"
fi
export PATH="$FLUTTER_DIR/bin:$PATH"

flutter pub get
# Netlify serves from the domain root, so no --base-href needed for /app/.
flutter build web --release --base-href /app/

mkdir -p _site/app
cp -r packages/landing/public/. _site/
cp -r build/web/. _site/app/

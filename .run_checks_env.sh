#!/usr/bin/env zsh
set -euo pipefail

export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
else
  echo "nvm not found in $NVM_DIR" >&2
  exit 1
fi

echo "Node version:"; node -v || true

echo "Changing to project dir"
cd "/home/misael/arquivos sites"

echo "Running npm install (this may download Chromium for puppeteer)"
npm install --no-audit --no-fund

echo "Running npm run check"
npm run check || true

#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "1) Running checks"
npm run check

echo "2) Attempt Netlify deploy (if netlify CLI available)"
if command -v netlify >/dev/null 2>&1; then
  echo "-> netlify CLI found, running: netlify deploy --dir=. --prod"
  netlify deploy --dir=. --prod
else
  echo "-> netlify CLI not found. To deploy with Netlify, run:\n  npm install -g netlify-cli\n  netlify login\n  npm run deploy:netlify"
fi

echo "3) Attempt GitHub Pages deploy (if git remote configured)"
if git remote | grep -q .; then
  echo "-> git remote found, running: npm run deploy:gh"
  npm run deploy:gh
else
  echo "-> No git remote configured. To push to GitHub Pages, add a remote and push, e.g.:\n  git remote add origin git@github.com:<user>/<repo>.git\n  git push -u origin master\n  npm run deploy:gh"
fi

echo "Deploy script finished. Check CLI output for results."

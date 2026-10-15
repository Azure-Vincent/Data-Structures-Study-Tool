#!/usr/bin/env bash
# Start DS Study Lab as a desktop window (Electron) on Linux or macOS.
cd "$(dirname "$0")"
command -v npm >/dev/null || { echo "Node.js/npm is not installed. Install Node.js 22.12 or newer from https://nodejs.org and run this again."; exit 1; }
# The desktop runtime (Electron) needs Node.js 22.12+; browser mode works with 18+.
if ! node -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a>22||(a===22&&b>=12)?0:1)'; then
  echo "The desktop window needs Node.js 22.12 or newer (you have $(node --version))."
  echo "Update Node.js from https://nodejs.org, or use ./start-browser.sh, which works with Node.js 18+."
  exit 1
fi
if [ ! -d node_modules/electron ]; then
  echo "First run: installing the desktop runtime..."
  npm install || exit 1
fi
# Some Linux setups (containers, some distros) need --no-sandbox for Electron.
npx electron . "$@" || { echo; echo "If you saw a sandbox error, run:  ./start-desktop.sh --no-sandbox"; }

#!/usr/bin/env bash
# Start DS Study Lab as a desktop window (Electron).
cd "$(dirname "$0")"
command -v npm >/dev/null || { echo "Node.js/npm is not installed. Install Node.js 18+ and run this again."; exit 1; }
if [ ! -d node_modules/electron ]; then
  echo "First run: installing the desktop runtime..."
  npm install || exit 1
fi
# Some Linux setups (containers, some distros) need --no-sandbox for Electron.
npx electron . "$@" || { echo; echo "If you saw a sandbox error, run:  ./start-desktop.sh --no-sandbox"; }

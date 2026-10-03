#!/usr/bin/env bash
# Start DS Study Lab in your web browser (needs Node.js 18+).
cd "$(dirname "$0")"
command -v node >/dev/null || { echo "Node.js is not installed. Install it (e.g. sudo apt install nodejs, or from https://nodejs.org) and run this again."; exit 1; }
echo "Starting DS Study Lab... press Ctrl+C to stop."
exec node server.js "${PORT:-5173}" --open

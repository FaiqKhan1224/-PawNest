#!/usr/bin/env bash
# One-command launcher for macOS / Linux
cd "$(dirname "$0")"
if [ ! -d node_modules ] || [ ! -d backend/node_modules ] || [ ! -d frontend/node_modules ]; then
  echo "Installing dependencies (first run only)..."
  npm install || exit 1
fi
npm run dev

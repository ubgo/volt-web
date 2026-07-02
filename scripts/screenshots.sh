#!/usr/bin/env bash
# Capture demo screenshots into volt/screenshots.
# Run from the repo root (the `task screenshots` task does this):
#   bash scripts/screenshots.sh
#
# The dev server must be running first (e.g. `task dev:guard` → https://volt.localhost).
#
# It launches a VISIBLE Chrome window and drives it over the DevTools Protocol
# (a visible window can't use Chrome's headless-only --screenshot flag), so you
# can watch it navigate each page while it captures.
#
# Env toggles:
#   SHOTS_HEADLESS=1 hide the window (still captures via CDP)
#   SHOTS_WAIT=20    max seconds to wait for each page's load event (default 8)
#   SHOTS_URL=…      base URL (default: derived from portless.json → https://<name>.localhost)
#   CHROME=…         path to the Chrome binary
set -u

CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
[ -x "$CHROME" ] || { echo "Google Chrome not found at: $CHROME (set CHROME=…)" >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo "node not found on PATH" >&2; exit 1; }

NAME="$(sed -n 's/.*"name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' portless.json 2>/dev/null | head -1)"
BASE="${SHOTS_URL:-https://${NAME:-app}.localhost}"
OUT="volt/screenshots"
WAIT="${SHOTS_WAIT:-8}"
PORT="${SHOTS_CDP_PORT:-9222}"
HERE="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$OUT"

MODE="visible window"; [ -n "${SHOTS_HEADLESS:-}" ] && MODE="headless"
echo "▶ Capturing from $BASE   (mode: $MODE)"
echo

# Warm each route first: Vite dev compiles routes on first hit, and portless
# returns 502 if that cold compile is slower than its upstream timeout. curl
# blocks until the route serves 200, so Chrome then loads it warm.
echo "Warming routes…"
for p in /demo /demo/components /demo/server-table /demo/form/kitchen-sink; do
  code="$(curl -sk -o /dev/null -w '%{http_code}' --max-time 60 "$BASE$p" 2>/dev/null || echo 000)"
  echo "  $p → $code"
  if [ "$code" != "200" ]; then
    echo "✗ $BASE$p is not serving (HTTP $code). Start the dev server first: task dev:guard" >&2
    exit 1
  fi
done
echo

# Launch Chrome with the DevTools endpoint. Visible by default.
# (Plain string, not an array — macOS bash 3.2 errors on empty-array expansion under set -u.)
PROF="$(mktemp -d)/p"
HL=""
[ -n "${SHOTS_HEADLESS:-}" ] && HL="--headless=new"
# shellcheck disable=SC2086
"$CHROME" $HL \
  --remote-debugging-port="$PORT" --user-data-dir="$PROF" \
  --no-first-run --no-default-browser-check --ignore-certificate-errors \
  --window-size=1440,900 --window-position=0,0 "about:blank" >/dev/null 2>&1 &
CPID=$!

cleanup() { kill "$CPID" 2>/dev/null; wait "$CPID" 2>/dev/null; }
trap cleanup EXIT

# Wait for the CDP endpoint to be ready.
for _ in $(seq 1 60); do
  curl -sf "http://127.0.0.1:$PORT/json/version" >/dev/null 2>&1 && break
  sleep 0.25
done
if ! curl -sf "http://127.0.0.1:$PORT/json/version" >/dev/null 2>&1; then
  echo "✗ Chrome DevTools endpoint never came up on :$PORT (is another Chrome using it? try SHOTS_CDP_PORT=9333)" >&2
  exit 1
fi

node "$HERE/screenshot-cdp.mjs" "$BASE" "$OUT" "$WAIT" "$PORT"

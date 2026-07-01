#!/usr/bin/env bash
# =============================================================================
# dev-guard.sh — crash-resilient supervisor for the portless dev server.
# =============================================================================
#
# WHAT IT IS
#   A tiny watchdog loop that keeps the local dev server alive. It wraps
#   `portless run` (which serves the app at the fixed domain
#   https://app.localhost) and relaunches it automatically whenever the process
#   exits unexpectedly.
#
# WHY IT EXISTS (the problem it solves)
#   During active development — especially when an AI agent (Claude Code, etc.)
#   edits frontend code — the dev server frequently dies on a bad edit:
#   an undefined import (e.g. "ChevronRight is not defined"), a syntax error,
#   or an SSR render blowup can take down vite/portless entirely. The old
#   workflow was: notice it's dead → switch to the terminal → re-run
#   `task dev:portless` → wait for boot → reload. Doing that dozens of times a
#   day is pure friction. This script removes the manual step: the server comes
#   back on its own so you (and the agent) can just keep working.
#
# HOW IT WORKS (step by step)
#   1. Trap SIGINT/SIGTERM. On Ctrl-C, set STOPPING=1, kill the child process,
#      and let the loop exit WITHOUT restarting — an intentional stop stays
#      stopped.
#   2. Loop forever: launch `portless run --force` in the background.
#      - `--force` makes portless reclaim its .localhost route from the previous
#        (dead) instance, so a restart never collides with a stale route
#        ("route already in use").
#      - Output is sent through `tee` via process substitution, so it shows live
#        on the terminal AND is appended to tmp/dev.log. (A plain pipe would make
#        $! the tee pid instead of portless — process substitution keeps $! as
#        the real child so we can signal it.)
#   3. `wait` on the child until it exits, then capture its exit code.
#   4. If we were stopping (Ctrl-C), break the loop and quit.
#   5. Otherwise it crashed: measure how long it ran.
#      - If it ran >= HEALTHY_AFTER seconds, it was a healthy server that crashed
#        later, so reset backoff to 1s → next restart is fast.
#      - If it died almost immediately, keep the current backoff (the edit is
#        probably still broken) to avoid a hot restart loop.
#   6. Sleep `backoff` seconds, then double it up to MAX_BACKOFF (1→2→4→8s),
#      and go back to step 2.
#
# WHAT IT IS NOT
#   It does not fix broken code. A persistent syntax error will just restart
#   forever (you'll see "[guard] dev exited … restarting" repeating) — that
#   repetition is itself the signal that the code, not the server, is broken.
#
# USAGE
#   task dev:guard          # preferred — use this for day-to-day dev
#   bash dev-guard.sh       # direct
#   Ctrl-C                  # stop the supervisor and the dev server
# =============================================================================
set -u

# `--force` makes portless reclaim its .localhost route from the dead instance on
# every restart, so we never hit "route already in use".
CMD=(portless run --force)
LOG="tmp/dev.log"
MAX_BACKOFF=8        # cap restart delay (seconds)
HEALTHY_AFTER=15     # a run lasting >= this many seconds is "healthy" → reset backoff

mkdir -p tmp

STOPPING=0
CHILD=""

on_signal() {
  STOPPING=1
  echo "[guard] stop requested — shutting down dev…"
  [ -n "$CHILD" ] && kill "$CHILD" 2>/dev/null
}
trap on_signal INT TERM

backoff=1
while :; do
  ts=$(date '+%H:%M:%S')
  echo "[guard] $ts starting: ${CMD[*]}" | tee -a "$LOG"

  start=$SECONDS
  # Process substitution keeps output live on the terminal AND appended to the log,
  # while $! stays the portless pid (a plain pipe would give us tee's pid instead).
  "${CMD[@]}" > >(tee -a "$LOG") 2>&1 &
  CHILD=$!
  wait "$CHILD"
  code=$?
  CHILD=""

  if [ "$STOPPING" = 1 ]; then
    echo "[guard] stopped by user."
    break
  fi

  dur=$(( SECONDS - start ))
  if [ "$dur" -ge "$HEALTHY_AFTER" ]; then
    backoff=1   # it ran fine for a while, this was a fresh crash → restart fast
  fi

  echo "[guard] dev exited (code=$code) after ${dur}s — restarting in ${backoff}s…" | tee -a "$LOG"
  sleep "$backoff"
  [ "$backoff" -lt "$MAX_BACKOFF" ] && backoff=$(( backoff * 2 ))
  [ "$backoff" -gt "$MAX_BACKOFF" ] && backoff="$MAX_BACKOFF"
done

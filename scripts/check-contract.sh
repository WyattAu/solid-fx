#!/usr/bin/env bash
# Executable oracle for the porting contract: src/content must be React-free.
# Usage: scripts/check-contract.sh [--strict]   (--strict also fails on PORT-NOTE markers)
set -euo pipefail
cd "$(dirname "$0")/.."

BANNED="react-dom|motion/react|framer-motion|@hugeicons/react|@gsap/react|@use-gesture/react|@react-three/"
fail=0

filter_comments() { grep -vE ':[0-9]+:\s*(//|\*|/\*)' || true; }

banned_hits=$(grep -rnE "from '(react|${BANNED})" src/content --include='*.tsx' --include='*.ts' | filter_comments || true)
if [ -n "$banned_hits" ]; then
  echo "$banned_hits"
  echo "FAIL: React-only imports found in src/content (listed above)" >&2
  fail=1
fi

hook_hits=$(grep -rnE "use(State|Effect|Ref|Memo|Callback|LayoutEffect|Context)\(" src/content --include='*.tsx' | filter_comments || true)
if [ -n "$hook_hits" ]; then
  echo "$hook_hits"
  echo "FAIL: React hook calls found in src/content (listed above)" >&2
  fail=1
fi

# Estate dependency rule: components are self-contained. No relative-parent
# imports — shared code belongs in src/lib and is imported via @/lib.
cross_hits=$(grep -rnE "from '\.\./" src/content --include='*.tsx' | filter_comments || true)
if [ -n "$cross_hits" ]; then
  echo "$cross_hits"
  echo "FAIL: cross-component imports found in src/content (shared code belongs in src/lib)" >&2
  fail=1
fi

notes=$(grep -rc 'PORT-NOTE' src/content --include='*.tsx' 2>/dev/null | awk -F: '{s+=$2} END {print s+0}' || true)

if [ "$fail" -ne 0 ]; then
  exit 1
fi

echo "OK: src/content is React-free. PORT-NOTE markers: ${notes}"

if [ "${1:-}" = "--strict" ] && [ "${notes}" -gt 0 ]; then
  echo "FAIL: --strict forbids PORT-NOTE markers" >&2
  exit 1
fi

#!/bin/sh
set -eu
cd "$(git rev-parse --show-toplevel)"
current=$(git config --get core.hooksPath || :)
if [ -n "$current" ] && [ "$current" != .githooks ]; then
  echo "Vorhandener core.hooksPath bleibt erhalten: $current" >&2
  exit 1
fi
if [ -z "$current" ] && [ -f "$(git rev-parse --git-path hooks/pre-push)" ]; then
  echo 'Vorhandener nativer pre-push-Hook bleibt erhalten; Installation abgebrochen.' >&2
  exit 1
fi
chmod +x .githooks/pre-push
git config --local core.hooksPath .githooks
echo 'Lokaler pre-push-Hook aktiviert: npm run check:pr.'

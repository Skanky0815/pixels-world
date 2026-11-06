#!/usr/bin/env bash
set -euo pipefail

fail() {
  echo "::error::$*" >&2
  exit 1
}

current_main=$(gh api "repos/$GITHUB_REPOSITORY/git/ref/heads/main" --jq '.object.sha')
[ "$current_main" = "$GITHUB_SHA" ] || fail 'main ist weitergelaufen. Release erneut auf dem aktuellen main starten.'

# Check existing main QA for this exact commit; do not start another test run.
runs=$(gh api --method GET "repos/$GITHUB_REPOSITORY/actions/workflows/qa.yml/runs" \
  -f branch=main -f head_sha="$GITHUB_SHA" -f per_page=1)
jq -e --arg sha "$GITHUB_SHA" '.workflow_runs[0] | .head_sha == $sha and .head_branch == "main" and (.event == "push" or .event == "workflow_dispatch") and .status == "completed" and .conclusion == "success"' <<< "$runs" > /dev/null \
  || fail 'Keine erfolgreiche Main-QA für diesen Commit. Erst den grünen QA-Lauf abwarten; fehlgeschlagene QA beheben und erneut prüfen.'

if [ "$RELEASE_MODE" = publish ]; then
  candidates=$(gh api "repos/$GITHUB_REPOSITORY/commits/$GITHUB_SHA/pulls" | jq --arg sha "$GITHUB_SHA" '[.[] | select(.merged_at != null and .base.ref == "main" and .merge_commit_sha == $sha and any(.labels[]; .name == "autorelease: pending"))] | length')
  [ "$candidates" = 1 ] || fail 'Dieser Commit ist kein ausstehender Versions-Merge. Zuerst prepare starten: einen älteren, unveröffentlichten Kandidaten kontrolliert ablösen, neuen Versions-PR prüfen und mergen; nach grüner Main-QA publish starten.'
  pending=$(gh api --paginate "repos/$GITHUB_REPOSITORY/pulls?state=closed&base=main&per_page=100" | jq -s '[.[][] | select(.merged_at != null and any(.labels[]; .name == "autorelease: pending"))] | length')
  [ "$pending" = 1 ] || fail 'Weitere ausstehende Versions-PRs verhindern einen eindeutigen Publish. Zuerst Kandidaten prüfen; nichts veröffentlicht.'
fi

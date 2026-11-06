#!/usr/bin/env bash
set -euo pipefail

fail() {
  echo "::error::$*" >&2
  exit 1
}

current_main=$(gh api "repos/$GITHUB_REPOSITORY/git/ref/heads/main" --jq '.object.sha')
[ "$current_main" = "$GITHUB_SHA" ] || fail 'main ist weitergelaufen. Release erneut auf dem aktuellen main starten.'

# Check existing push QA for this exact commit; do not start another test run.
runs=$(gh api --method GET "repos/$GITHUB_REPOSITORY/actions/workflows/qa.yml/runs" \
  -f event=push -f branch=main -f head_sha="$GITHUB_SHA" -f per_page=1)
jq -e --arg sha "$GITHUB_SHA" '.workflow_runs[0] | .head_sha == $sha and .head_branch == "main" and .event == "push" and .status == "completed" and .conclusion == "success"' <<< "$runs" > /dev/null \
  || fail 'Keine erfolgreiche Main-QA für diesen Commit. Erst den grünen QA-Lauf abwarten; fehlgeschlagene QA beheben und erneut prüfen.'

if [ "$RELEASE_MODE" = publish ]; then
  candidates=$(gh api "repos/$GITHUB_REPOSITORY/commits/$GITHUB_SHA/pulls" | jq --arg sha "$GITHUB_SHA" '[.[] | select(.merged_at != null and .base.ref == "main" and .merge_commit_sha == $sha and any(.labels[]; .name == "autorelease: pending"))] | length')
  [ "$candidates" = 1 ] || fail 'Dieser Commit ist kein ausstehender Versions-Merge. Zuerst prepare starten, den aktuellen Release-Please-Versions-PR prüfen und mergen; nach grüner Main-QA publish auf diesem Versions-Merge starten.'
fi

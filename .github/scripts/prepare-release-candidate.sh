#!/usr/bin/env bash
set -euo pipefail

fail() {
  echo "::error::$*" >&2
  exit 1
}
output() {
  echo "prepare_needed=$1"
  if [ -n "${GITHUB_OUTPUT:-}" ]; then echo "prepare_needed=$1" >> "$GITHUB_OUTPUT"; fi
}
note() {
  echo "$*"
  if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then echo "$*" >> "$GITHUB_STEP_SUMMARY"; fi
}

# Never apply root-tag recovery to a changed release configuration.
config="$(dirname "$0")/../../release-please-config.json"
jq -e '."include-component-in-tag" == false and ."include-v-in-tag" == true and (.packages | keys) == ["."]' "$config" > /dev/null \
  || fail 'Kandidaten-Recovery unterstützt nur ein Root-Paket mit v-Tags ohne Komponentenpräfix.'

# This repository has one root package; ambiguous pending releases require inspection.
pulls=$(gh api --paginate "repos/$GITHUB_REPOSITORY/pulls?state=closed&base=main&per_page=100" | jq -s '[.[][] | select(.merged_at != null and any(.labels[]; .name == "autorelease: pending"))]')
count=$(jq length <<< "$pulls")
[ "$count" -le 1 ] || fail 'Mehrere ausstehende Versions-PRs gefunden. Keine automatische Ablösung; Status zuerst prüfen.'
if [ "$count" = 0 ]; then
  note 'Kein gemergter, ausstehender Versions-PR: Release Please darf den aktuellen Kandidaten vorbereiten.'
  output true
  exit 0
fi
number=$(jq -r '.[0].number' <<< "$pulls")
sha=$(jq -r '.[0].merge_commit_sha' <<< "$pulls")
branch=$(jq -r '.[0].head.ref' <<< "$pulls")
[[ "$number" =~ ^[0-9]+$ && "$sha" =~ ^[0-9a-f]{40}$ ]] || fail 'Ungültige Kandidatenidentität.'
[[ "$branch" == release-please--branches--main* ]] || fail "PR #$number stammt nicht vom erwarteten Release-Please-Branch. Keine automatische Änderung."
version=$(gh api "repos/$GITHUB_REPOSITORY/contents/.release-please-manifest.json?ref=$sha" --jq '.content | gsub("\n"; "") | @base64d | fromjson | .["."]')
[[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+([+-][a-zA-Z0-9.-]+)?$ ]] || fail 'Ungültige Kandidatenversion.'
if [ "$sha" = "$GITHUB_SHA" ]; then
  note "Versions-PR #$number (v$version, $sha) ist bereits gemergt und aktuell. Kein neuer PR nötig: nach grüner Main-QA publish starten."
  output false
  exit 0
fi
status=$(gh api "repos/$GITHUB_REPOSITORY/compare/$sha...$GITHUB_SHA" --jq '.status')
[ "$status" = ahead ] || fail "PR #$number ist kein älterer Vorfahr dieses Main-Commits. Keine automatische Ablösung."
tags=$(gh api "repos/$GITHUB_REPOSITORY/git/matching-refs/tags/v$version")
releases=$(gh api --paginate "repos/$GITHUB_REPOSITORY/releases?per_page=100" | jq -s add)
jq -e --arg tag "refs/tags/v$version" 'all(.[]; .ref != $tag)' <<< "$tags" > /dev/null || fail "Tag v$version existiert bereits. Kandidat wird nicht verworfen."
jq -e --arg tag "v$version" 'all(.[]; .tag_name != $tag)' <<< "$releases" > /dev/null || fail "Release v$version existiert bereits. Kandidat wird nicht verworfen."
current_main=$(gh api "repos/$GITHUB_REPOSITORY/git/ref/heads/main" --jq '.object.sha')
[ "$current_main" = "$GITHUB_SHA" ] || fail 'main ist während prepare weitergelaufen. Ohne Änderungen erneut starten.'
if [ "${1:-}" = --dry-run ]; then
  note "Trockenlauf: unveröffentlichten Kandidaten #$number (v$version, $sha) zugunsten von Main $GITHUB_SHA ablösen; keine Metadaten geändert."
  output false
  exit 0
fi
message="Unveröffentlichter Release-Kandidat v$version wird durch einen neuen prepare-Lauf auf Main $GITHUB_SHA abgelöst. Seit dem Versions-Merge $sha kamen weitere Änderungen hinzu. Für diese Version existieren weder Tag noch GitHub Release. Es wird ausschließlich das pending-Label entfernt; keine Veröffentlichung behauptet und kein Tag erstellt oder verändert. Der neue Versions-PR benötigt erneut QA und Review. Refs #128."
gh api --method POST "repos/$GITHUB_REPOSITORY/issues/$number/comments" -f body="$message" > /dev/null
gh api --method DELETE "repos/$GITHUB_REPOSITORY/issues/$number/labels/autorelease%3A%20pending" > /dev/null
note "Unveröffentlichten Kandidaten #$number (v$version, $sha) nachvollziehbar abgelöst. Release Please bereitet jetzt einen neuen Versions-PR auf Main $GITHUB_SHA vor."
output true

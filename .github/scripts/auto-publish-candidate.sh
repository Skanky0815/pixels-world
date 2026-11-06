#!/usr/bin/env bash
set -Eeuo pipefail

note() {
  echo "$*"
  if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then echo "$*" >> "$GITHUB_STEP_SUMMARY"; fi
}
output() {
  echo "publish_allowed=$1"
  if [ -n "${GITHUB_OUTPUT:-}" ]; then echo "publish_allowed=$1" >> "$GITHUB_OUTPUT"; fi
}
noop() { note "Kein Publish: $*"; exit 0; }
fail() { note "::error::$*"; exit 1; }
trap 'note "Release-Prüfung fehlgeschlagen; keine Veröffentlichung freigegeben."' ERR
output false

# workflow_run executes trusted default-branch code, never downloaded PR artifacts.
event=$(cat "$GITHUB_EVENT_PATH")
jq -e --arg repo "$GITHUB_REPOSITORY" --arg sha "$GITHUB_SHA" '
  .workflow_run.id > 0 and .workflow_run.run_attempt >= 1 and
  .action == "completed" and .workflow_run.status == "completed" and
  .workflow_run.conclusion == "success" and .workflow_run.head_branch == "main" and
  .workflow_run.head_repository.full_name == $repo and .workflow_run.head_sha == $sha and
  .workflow_run.path == ".github/workflows/qa.yml" and
  (.workflow_run.event == "push" or .workflow_run.event == "workflow_dispatch")
' <<< "$event" > /dev/null || noop 'Keine erfolgreiche Main-QA für diesen Workflow-Commit (PR, anderer Branch/Commit oder fehlgeschlagener Lauf).'

current=$(gh api "repos/$GITHUB_REPOSITORY/git/ref/heads/main" --jq '.object.sha')
[ "$current" = "$GITHUB_SHA" ] || noop 'Main ist inzwischen weitergelaufen.'
runs=$(gh api --method GET "repos/$GITHUB_REPOSITORY/actions/workflows/qa.yml/runs" -f branch=main -f head_sha="$GITHUB_SHA" -f per_page=1)
jq -e --argjson source "$(jq '.workflow_run' <<< "$event")" '
  .workflow_runs[0] | .id == $source.id and .run_attempt == $source.run_attempt and
  .head_sha == $source.head_sha and .head_branch == "main" and
  (.event == "push" or .event == "workflow_dispatch") and
  .status == "completed" and .conclusion == "success"
' <<< "$runs" > /dev/null || noop 'Der auslösende QA-Versuch ist nicht der jüngste erfolgreiche Main-Lauf.'

pulls=$(gh api "repos/$GITHUB_REPOSITORY/commits/$GITHUB_SHA/pulls")
candidates=$(jq --arg sha "$GITHUB_SHA" '[.[] | select(.merged_at != null and .base.ref == "main" and .merge_commit_sha == $sha and any(.labels[]; .name == "autorelease: pending"))]' <<< "$pulls")
count=$(jq length <<< "$candidates")
[ "$count" != 0 ] || noop 'Normaler Merge oder bereits veröffentlichter Versions-PR.'
[ "$count" = 1 ] || fail 'Mehrere Versions-Kandidaten für denselben Commit; Status prüfen.'
branch=$(jq -r '.[0].head.ref' <<< "$candidates")
[[ "$branch" == release-please--branches--main* ]] || noop 'Kein Release-Please-Branch.'
number=$(jq -r '.[0].number' <<< "$candidates")
[[ "$number" =~ ^[0-9]+$ ]] || fail 'Ungültige PR-Nummer.'

# Only the configured root package and a version-only PR may publish automatically.
root=$(cd "$(dirname "$0")/../.." && pwd)
jq -e '."include-component-in-tag" == false and ."include-v-in-tag" == true and (.packages | keys) == ["."]' "$root/release-please-config.json" > /dev/null || fail 'Nicht unterstützte Release-Konfiguration.'
version=$(jq -r '.["."]' "$root/.release-please-manifest.json")
[[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+([+-][a-zA-Z0-9.-]+)?$ ]] || fail 'Ungültige Manifestversion.'
[ "$(jq -r .version "$root/package.json")" = "$version" ] || fail 'Paket- und Manifestversion stimmen nicht überein.'
files=$(gh api --paginate "repos/$GITHUB_REPOSITORY/pulls/$number/files?per_page=100" | jq -s add)
jq -e 'map(.filename) | index("package.json") != null and index(".release-please-manifest.json") != null and all(.[]; . == "package.json" or . == "package-lock.json" or . == "CHANGELOG.md" or . == ".release-please-manifest.json")' <<< "$files" > /dev/null || fail 'Versions-PR enthält unerwartete Dateien oder keine vollständige Versionserhöhung.'
tag="v$version"
tags=$(gh api "repos/$GITHUB_REPOSITORY/git/matching-refs/tags/$tag")
releases=$(gh api --paginate "repos/$GITHUB_REPOSITORY/releases?per_page=100" | jq -s add)
jq -e --arg tag "refs/tags/$tag" 'all(.[]; .ref != $tag)' <<< "$tags" > /dev/null || noop "Tag $tag existiert bereits; kein zweiter Release/Rollout."
jq -e --arg tag "$tag" 'all(.[]; .tag_name != $tag)' <<< "$releases" > /dev/null || noop "Release $tag existiert bereits; kein zweiter Release/Rollout."

# Recheck main/latest QA and globally unique pending candidate immediately before Release Please.
RELEASE_MODE=publish bash "$root/.github/scripts/verify-release-source.sh"
note "Main-QA und Versions-Merge #$number ($GITHUB_SHA) bestätigt. Release Please darf $tag veröffentlichen."
output true

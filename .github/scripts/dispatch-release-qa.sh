#!/usr/bin/env bash
set -Eeuo pipefail
note() {
  echo "$*"
  if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then echo "$*" >> "$GITHUB_STEP_SUMMARY"; fi
}
trap 'note "::error::Versions-PR-QA konnte nicht gestartet werden. PR und Actions-Rechte prüfen; vor dem Merge QA auf dem Release-Branch erneut starten."' ERR
number=$(jq -er '.number | numbers' <<< "$RELEASE_PR")
[[ "$number" =~ ^[0-9]+$ ]]
pr=$(gh api "repos/$GITHUB_REPOSITORY/pulls/$number")
jq -e --arg repo "$GITHUB_REPOSITORY" '.state == "open" and .merged_at == null and .base.ref == "main" and .head.repo.full_name == $repo and (.head.ref | startswith("release-please--branches--main"))' <<< "$pr" > /dev/null
branch=$(jq -r '.head.ref' <<< "$pr")
gh workflow run qa.yml --repo "$GITHUB_REPOSITORY" --ref "$branch" -f scope=smoke
message="Kurze QA für Versions-PR #$number auf $branch automatisch gestartet. Review und Merge bleiben erforderlich."
note "$message"

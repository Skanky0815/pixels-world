#!/usr/bin/env bash
set -Eeuo pipefail
note() {
  echo "$*"
  if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then echo "$*" >> "$GITHUB_STEP_SUMMARY"; fi
}
trap 'note "::error::Versions-PR-QA konnte nicht eindeutig zugeordnet werden. PR-Commit und Actions prüfen; ein gestarteter Lauf ist kein Erfolgsnachweis."' ERR
valid_pr() {
  jq -e --arg repo "$GITHUB_REPOSITORY" '
    .state == "open" and .merged_at == null and .base.ref == "main" and
    .head.repo.full_name == $repo and
    (.head.ref | test("^release-please--branches--main[-a-zA-Z0-9_./]*$")) and
    (.head.sha | test("^[0-9a-f]{40}$"))' <<< "$1" > /dev/null
}
number=$(jq -er '.number | numbers | select(. > 0 and floor == .)' <<< "$RELEASE_PR")
pr=$(gh api "repos/$GITHUB_REPOSITORY/pulls/$number")
valid_pr "$pr"
branch=$(jq -r '.head.ref' <<< "$pr")
sha=$(jq -r '.head.sha' <<< "$pr")
# API 2026-03-10 returns the created run, avoiding races with concurrent dispatches.
dispatch=$(gh api --method POST -H 'X-GitHub-Api-Version: 2026-03-10' \
  "repos/$GITHUB_REPOSITORY/actions/workflows/qa.yml/dispatches" \
  -f ref="$branch" -f 'inputs[scope]=smoke')
run_id=$(jq -er '.workflow_run_id | numbers | select(. > 0 and floor == .)' <<< "$dispatch")
run_url="${GITHUB_SERVER_URL:-https://github.com}/$GITHUB_REPOSITORY/actions/runs/$run_id"
jq -e --arg url "$run_url" '.html_url == $url' <<< "$dispatch" > /dev/null
note "QA-Lauf angefordert: [$run_id]($run_url). Zuordnung wird geprüft."
run=$(gh api "repos/$GITHUB_REPOSITORY/actions/runs/$run_id")
jq -e --argjson id "$run_id" --arg repo "$GITHUB_REPOSITORY" --arg branch "$branch" --arg sha "$sha" --arg url "$run_url" '
  .id == $id and .repository.full_name == $repo and .head_repository.full_name == $repo and
  .event == "workflow_dispatch" and .path == ".github/workflows/qa.yml" and
  .head_branch == $branch and .head_sha == $sha and .html_url == $url and
  .run_attempt == 1' <<< "$run" > /dev/null
current_pr=$(gh api "repos/$GITHUB_REPOSITORY/pulls/$number")
valid_pr "$current_pr"
jq -e --arg branch "$branch" --arg sha "$sha" '.head.ref == $branch and .head.sha == $sha' <<< "$current_pr" > /dev/null
note "Kurze QA zugeordnet: Versions-PR #$number, Branch \`$branch\`, Commit \`$sha\`, [Lauf $run_id, Versuch 1]($run_url/attempts/1). Dies bestätigt die Zuordnung, keinen Testerfolg. Laufstatus prüfen; neue PR-Commits brauchen einen passenden QA-Nachweis. Review und Merge bleiben erforderlich."

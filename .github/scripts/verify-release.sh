#!/usr/bin/env bash
set -euo pipefail

# Only pass verified release identity to the reusable Pages workflow.
[[ "$RELEASE_TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+([+-][a-zA-Z0-9.-]+)?$ ]]
[[ "$RELEASE_SHA" =~ ^[0-9a-f]{40}$ ]]
test "$RELEASE_SHA" = "$GITHUB_SHA"
gh api "repos/$GITHUB_REPOSITORY/releases/tags/$RELEASE_TAG" | jq -e --arg tag "$RELEASE_TAG" '.tag_name == $tag and .draft == false and .published_at != null' > /dev/null
object=$(gh api "repos/$GITHUB_REPOSITORY/git/ref/tags/$RELEASE_TAG" --jq '.object')
for _ in 1 2 3 4 5; do
  type=$(jq -r '.type' <<< "$object")
  sha=$(jq -r '.sha' <<< "$object")
  if [ "$type" = commit ]; then
    test "$sha" = "$RELEASE_SHA"
    exit 0
  fi
  test "$type" = tag
  object=$(gh api "repos/$GITHUB_REPOSITORY/git/tags/$sha" --jq '.object')
done
echo 'Release-Tag konnte nicht auf einen Commit aufgelöst werden.' >&2
exit 1

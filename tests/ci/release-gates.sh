#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "$0")/../.." && pwd)
fixture_dir=$(mktemp -d)
trap 'rm -rf "$fixture_dir"' EXIT
cat > "$fixture_dir/gh" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
case "$*" in
  *git/ref/heads/main*) printf '%s\n' "${MAIN_SHA:-$GITHUB_SHA}" ;;
  *actions/workflows/qa.yml/runs*) cat "$FIXTURE_DIR/runs.json" ;;
  *commits/*/pulls*) cat "$FIXTURE_DIR/pulls.json" ;;
  *) exit 99 ;;
esac
MOCK
chmod +x "$fixture_dir/gh"
export PATH="$fixture_dir:$PATH" FIXTURE_DIR="$fixture_dir"
export GITHUB_REPOSITORY=example/game GITHUB_SHA=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa RELEASE_MODE=publish
printf '[{"merged_at":"2026-11-06","base":{"ref":"main"},"merge_commit_sha":"%s","labels":[{"name":"autorelease: pending"}]}]' "$GITHUB_SHA" > "$fixture_dir/pulls.json"
printf '{"workflow_runs":[{"head_sha":"%s","head_branch":"main","event":"push","status":"completed","conclusion":"success"}]}' "$GITHUB_SHA" > "$fixture_dir/success.json"
cp "$fixture_dir/success.json" "$fixture_dir/runs.json"
bash "$repo_root/.github/scripts/verify-release-source.sh"

expect_failure() {
  if bash "$repo_root/.github/scripts/verify-release-source.sh" > "$fixture_dir/result.log" 2>&1; then
    echo 'Ein negatives Release-Gate hat unerwartet bestanden.' >&2
    exit 1
  fi
}
for replacement in 'failure' 'cancelled' 'skipped' 'null'; do
  sed "s/\"success\"/\"$replacement\"/" "$fixture_dir/success.json" > "$fixture_dir/runs.json"
  expect_failure
done
for pair in 'completed in_progress' 'push pull_request' 'main feature' "$GITHUB_SHA bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"; do
  read -r before after <<< "$pair"
  sed "s/$before/$after/g" "$fixture_dir/success.json" > "$fixture_dir/runs.json"
  expect_failure
done
printf '{"workflow_runs":[]}' > "$fixture_dir/runs.json"
expect_failure
cp "$fixture_dir/success.json" "$fixture_dir/runs.json"
MAIN_SHA=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb expect_failure
printf '[]' > "$fixture_dir/pulls.json"
expect_failure
grep -q 'Zuerst prepare starten' "$fixture_dir/result.log"
RELEASE_MODE=prepare bash "$repo_root/.github/scripts/verify-release-source.sh"
echo 'Release-Gates: publish/prepare akzeptiert; 11 negative Fälle korrekt abgewiesen.'

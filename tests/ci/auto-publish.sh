#!/usr/bin/env bash
set -euo pipefail
repo_root=$(cd "$(dirname "$0")/../.." && pwd)
fixture=$(mktemp -d)
trap 'rm -rf "$fixture"' EXIT
mkdir -p "$fixture/bin" "$fixture/repo/.github/scripts"
cp "$repo_root/.github/scripts/auto-publish-candidate.sh" "$repo_root/.github/scripts/verify-release-source.sh" "$fixture/repo/.github/scripts/"
cp "$repo_root/package.json" "$repo_root/.release-please-manifest.json" "$repo_root/release-please-config.json" "$fixture/repo/"
cat > "$fixture/bin/gh" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
[ "${MOCK_API_FAILURE:-0}" != 1 ] || exit 1
case "$*" in *'--method POST'*|*'--method DELETE'*|*'--method PATCH'*) echo 'Mutation im lesenden Gate' >&2; exit 98 ;; esac
case "$*" in
  *git/ref/heads/main*)
    count=$(cat "$FIXTURE/main-reads")
    echo $((count + 1)) > "$FIXTURE/main-reads"
    if [ "${MOCK_ADVANCE:-0}" = 1 ] && [ "$count" -gt 0 ]; then echo bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    else echo "${MOCK_MAIN:-$GITHUB_SHA}"; fi
    ;;
  *actions/workflows/qa.yml/runs*) cat "$FIXTURE/runs.json" ;;
  *commits/*/pulls*) cat "$FIXTURE/candidates.json" ;;
  *pulls\?state=closed*) cat "$FIXTURE/pending.json" ;;
  *pulls/*/files*) cat "$FIXTURE/files.json" ;;
  *matching-refs*) cat "$FIXTURE/tags.json" ;;
  *releases\?*) cat "$FIXTURE/releases.json" ;;
  *) echo "Unbekannte API-Anfrage: $*" >&2; exit 99 ;;
esac
MOCK
chmod +x "$fixture/bin/gh"
export PATH="$fixture/bin:$PATH" FIXTURE="$fixture"
export GITHUB_REPOSITORY=example/game GITHUB_SHA=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
export GITHUB_EVENT_PATH="$fixture/event.json" GITHUB_OUTPUT="$fixture/output" GITHUB_STEP_SUMMARY="$fixture/summary"
version=$(jq -r '.["."]' "$repo_root/.release-please-manifest.json")
reset_fixture() {
  jq -nc --arg sha "$GITHUB_SHA" --arg repo "$GITHUB_REPOSITORY" '{action:"completed",workflow_run:{id:42,run_attempt:1,path:".github/workflows/qa.yml",head_sha:$sha,head_branch:"main",head_repository:{full_name:$repo},event:"push",status:"completed",conclusion:"success"}}' > "$GITHUB_EVENT_PATH"
  jq '{workflow_runs:[.workflow_run]}' "$GITHUB_EVENT_PATH" > "$fixture/runs.json"
  jq -nc --arg sha "$GITHUB_SHA" '[{number:20,merged_at:"2026-11-06",merge_commit_sha:$sha,base:{ref:"main"},head:{ref:"release-please--branches--main"},labels:[{name:"autorelease: pending"}]}]' > "$fixture/candidates.json"
  cp "$fixture/candidates.json" "$fixture/pending.json"
  echo '[{"filename":"package.json"},{"filename":".release-please-manifest.json"},{"filename":"package-lock.json"},{"filename":"CHANGELOG.md"}]' > "$fixture/files.json"
  echo '[]' > "$fixture/tags.json"
  echo '[]' > "$fixture/releases.json"
  cp "$repo_root/package.json" "$repo_root/release-please-config.json" "$fixture/repo/"
  echo 0 > "$fixture/main-reads"
  : > "$GITHUB_OUTPUT"
  : > "$GITHUB_STEP_SUMMARY"
}
run_gate() { bash "$fixture/repo/.github/scripts/auto-publish-candidate.sh" > "$fixture/result.log" 2>&1; }
allowed() {
  run_gate
  grep -qx 'publish_allowed=true' "$GITHUB_OUTPUT"
  grep -qx "tag=v$version" "$GITHUB_OUTPUT"
  grep -qx "sha=$GITHUB_SHA" "$GITHUB_OUTPUT"
}
no_publish() { run_gate; ! grep -q 'publish_allowed=true' "$GITHUB_OUTPUT"; grep -q 'Kein Publish:' "$GITHUB_STEP_SUMMARY"; }
fails_closed() {
  if run_gate; then echo 'Ungültiger Publish unerwartet akzeptiert' >&2; cat "$fixture/result.log" >&2; exit 1; fi
  ! grep -q 'publish_allowed=true' "$GITHUB_OUTPUT"
}
edit_json() { jq "$2" "$1" > "$fixture/edited.json"; mv "$fixture/edited.json" "$1"; }

reset_fixture
allowed
reset_fixture
edit_json "$GITHUB_EVENT_PATH" '.workflow_run.event="workflow_dispatch"'
edit_json "$fixture/runs.json" '.workflow_runs[0].event="workflow_dispatch"'
allowed
for change in '.workflow_run.conclusion="failure"' '.workflow_run.conclusion="cancelled"' '.workflow_run.conclusion="skipped"' '.workflow_run.conclusion=null' '.workflow_run.status="in_progress"' '.workflow_run.event="pull_request"' '.workflow_run.head_branch="feature"' '.workflow_run.head_repository.full_name="foreign/game"' '.workflow_run.head_sha="bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"' '.workflow_run.id=0' '.workflow_run.path=".github/workflows/other.yml"'; do
  reset_fixture
  edit_json "$GITHUB_EVENT_PATH" "$change"
  no_publish
done
for change in '.workflow_runs[0].id=43' '.workflow_runs[0].run_attempt=2' '.workflow_runs[0].conclusion="failure"' '.workflow_runs[0].status="in_progress"' '.workflow_runs=[]'; do
  reset_fixture
  edit_json "$fixture/runs.json" "$change"
  no_publish
done
reset_fixture
MOCK_MAIN=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb no_publish
reset_fixture
MOCK_ADVANCE=1 fails_closed
reset_fixture
echo '[]' > "$fixture/candidates.json"
no_publish
reset_fixture
edit_json "$fixture/candidates.json" '.[0].labels=[{name:"autorelease: tagged"}]'
no_publish
reset_fixture
edit_json "$fixture/candidates.json" '.[0].merged_at=null'
no_publish
reset_fixture
edit_json "$fixture/candidates.json" '.[0].head.ref="feature"'
no_publish
reset_fixture
edit_json "$fixture/candidates.json" '. + .'
fails_closed
reset_fixture
edit_json "$fixture/pending.json" '. + .'
fails_closed
reset_fixture
edit_json "$fixture/files.json" '. + [{filename:"src/main.ts"}]'
fails_closed
reset_fixture
echo '[{"filename":"CHANGELOG.md"}]' > "$fixture/files.json"
fails_closed
reset_fixture
edit_json "$fixture/repo/package.json" '.version="9.9.9"'
fails_closed
reset_fixture
edit_json "$fixture/repo/release-please-config.json" '."include-component-in-tag"=true'
fails_closed
reset_fixture
jq -nc --arg tag "refs/tags/v$version" '[{ref:$tag}]' > "$fixture/tags.json"
no_publish
reset_fixture
jq -nc --arg tag "v$version" '[{tag_name:$tag,draft:true}]' > "$fixture/releases.json"
no_publish
reset_fixture
jq -nc --arg tag "refs/tags/v${version}0" '[{ref:$tag}]' > "$fixture/tags.json"
allowed
reset_fixture
MOCK_API_FAILURE=1 fails_closed
reset_fixture
echo 'invalid-json' > "$fixture/candidates.json"
fails_closed
# Rechecking after full QA must not keep an earlier approval if main advanced.
reset_fixture
allowed
: > "$GITHUB_OUTPUT"
MOCK_MAIN=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb no_publish
# A repeated event after native Release Please has tagged the candidate is a no-op.
reset_fixture
allowed
: > "$GITHUB_OUTPUT"
edit_json "$fixture/candidates.json" '.[0].labels=[{name:"autorelease: tagged"}]'
no_publish
echo 'Auto-Publish: positive Quellen, No-ops, Wiederholungen und Fehlerzustände geprüft; keine GitHub-Mutationen.'

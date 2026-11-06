#!/usr/bin/env bash
set -euo pipefail
repo_root=$(cd "$(dirname "$0")/../.." && pwd)
fixture_dir=$(mktemp -d)
trap 'rm -rf "$fixture_dir"' EXIT
cat > "$fixture_dir/gh" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
[ "${MOCK_API_FAILURE:-0}" != 1 ] || exit 1
case "$*" in
  *pulls\?state=closed*) cat "$FIXTURE_DIR/pulls.json" ;;
  *commits/*/pulls*) jq --arg sha "$GITHUB_SHA" '[.[] | select(.merge_commit_sha == $sha)]' "$FIXTURE_DIR/pulls.json" ;;
  *contents/.release-please-manifest.json*) echo "${MOCK_VERSION:-0.1.2}" ;;
  *compare/*) echo "${MOCK_COMPARE:-ahead}" ;;
  *matching-refs*) cat "$FIXTURE_DIR/tags.json" ;;
  *releases\?*) cat "$FIXTURE_DIR/releases.json" ;;
  *git/ref/heads/main*) echo "${MOCK_MAIN:-$GITHUB_SHA}" ;;
  *actions/workflows/qa.yml/runs*) printf '{"workflow_runs":[{"head_sha":"%s","head_branch":"main","event":"push","status":"completed","conclusion":"success"}]}' "$GITHUB_SHA" ;;
  *'--method POST'*'/comments'*)
    [ "${MOCK_WRITE_FAILURE:-0}" != 1 ] || exit 1
    echo comment >> "$FIXTURE_DIR/mutations"
    ;;
  *'--method DELETE'*'/labels/autorelease%3A%20pending'*)
    echo remove-pending >> "$FIXTURE_DIR/mutations"
    echo '[]' > "$FIXTURE_DIR/pulls.json"
    ;;
  *) echo "Unbekannte Mock-Anfrage: $*" >&2; exit 99 ;;
esac
MOCK
chmod +x "$fixture_dir/gh"
export PATH="$fixture_dir:$PATH" FIXTURE_DIR="$fixture_dir"
export GITHUB_REPOSITORY=example/game GITHUB_SHA=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa RELEASE_MODE=publish
export GITHUB_OUTPUT="$fixture_dir/output" GITHUB_STEP_SUMMARY="$fixture_dir/summary"
old_sha=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
reset_fixture() {
  printf '[]' > "$fixture_dir/tags.json"
  printf '[]' > "$fixture_dir/releases.json"
  : > "$fixture_dir/mutations"
  : > "$GITHUB_OUTPUT"
  : > "$GITHUB_STEP_SUMMARY"
  jq -nc --arg sha "$old_sha" '[{number:118,merged_at:"2026-11-06",merge_commit_sha:$sha,base:{ref:"main"},head:{ref:"release-please--branches--main--components--game"},labels:[{name:"autorelease: pending"}]}]' > "$fixture_dir/pulls.json"
}
prepare() { bash "$repo_root/.github/scripts/prepare-release-candidate.sh" "$@" > "$fixture_dir/result"; }
expect_failure() {
  if prepare > /dev/null 2>&1; then echo 'Ungültiger Kandidat unerwartet akzeptiert.' >&2; exit 1; fi
  test ! -s "$fixture_dir/mutations"
}
reset_fixture
echo '[]' > "$fixture_dir/pulls.json"
prepare
grep -q 'prepare_needed=true' "$GITHUB_OUTPUT"
test ! -s "$fixture_dir/mutations"
reset_fixture
sed "s/$old_sha/$GITHUB_SHA/g" "$fixture_dir/pulls.json" > "$fixture_dir/current.json"
cp "$fixture_dir/current.json" "$fixture_dir/pulls.json"
prepare
grep -q 'prepare_needed=false' "$GITHUB_OUTPUT"
grep -q '#118 (v0.1.2' "$GITHUB_STEP_SUMMARY"
test ! -s "$fixture_dir/mutations"
reset_fixture
prepare --dry-run
grep -q Trockenlauf "$GITHUB_STEP_SUMMARY"
test ! -s "$fixture_dir/mutations"
# Regression: old version merged, then CI merged; publish blocks, prepare retires it.
if bash "$repo_root/.github/scripts/verify-release-source.sh" > /dev/null 2>&1; then exit 1; fi
prepare
grep -q 'prepare_needed=true' "$GITHUB_OUTPUT"
test "$(cat "$fixture_dir/mutations")" = "$(printf 'comment\nremove-pending')"
prepare
test "$(wc -l < "$fixture_dir/mutations" | tr -d ' ')" = 2
# Model Release Please's next reviewed/merged PR; the new version merge can publish.
cp "$fixture_dir/current.json" "$fixture_dir/pulls.json"
bash "$repo_root/.github/scripts/verify-release-source.sh"
reset_fixture
jq '. + .' "$fixture_dir/pulls.json" > "$fixture_dir/multiple.json"
cp "$fixture_dir/multiple.json" "$fixture_dir/pulls.json"
expect_failure
reset_fixture
printf '[{"ref":"refs/tags/v0.1.2"}]' > "$fixture_dir/tags.json"
expect_failure
for draft in true false; do
  reset_fixture
  printf '[{"tag_name":"v0.1.2","draft":%s}]' "$draft" > "$fixture_dir/releases.json"
  expect_failure
done
reset_fixture
for status in behind diverged identical; do MOCK_COMPARE="$status" expect_failure; done
MOCK_MAIN="$old_sha" expect_failure
MOCK_VERSION=invalid expect_failure
MOCK_API_FAILURE=1 expect_failure
MOCK_WRITE_FAILURE=1 expect_failure
reset_fixture
jq '.[0].head.ref="feature"' "$fixture_dir/pulls.json" > "$fixture_dir/wrong.json"
cp "$fixture_dir/wrong.json" "$fixture_dir/pulls.json"
expect_failure
reset_fixture
jq '.[0].merge_commit_sha="invalid"' "$fixture_dir/pulls.json" > "$fixture_dir/wrong.json"
cp "$fixture_dir/wrong.json" "$fixture_dir/pulls.json"
expect_failure
# A prefix match such as v0.1.20 is not the candidate's exact tag.
reset_fixture
printf '[{"ref":"refs/tags/v0.1.20"}]' > "$fixture_dir/tags.json"
prepare
# Current candidate plus another pending merge must not publish multiple versions.
reset_fixture
jq -s 'add' "$fixture_dir/pulls.json" "$fixture_dir/current.json" > "$fixture_dir/multiple.json"
cp "$fixture_dir/multiple.json" "$fixture_dir/pulls.json"
if bash "$repo_root/.github/scripts/verify-release-source.sh" > /dev/null 2>&1; then exit 1; fi
test ! -s "$fixture_dir/mutations"
echo 'Kandidaten-Recovery: Neuanlage, aktueller No-op, Dry-run, Ablösung, Wiederholung, Publish-Regressionspfad und Negativfälle bestanden.'

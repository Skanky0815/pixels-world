#!/usr/bin/env bash
set -euo pipefail
root=$(cd "$(dirname "$0")/../.." && pwd)
fixture=$(mktemp -d)
trap 'rm -rf "$fixture"' EXIT
cat > "$fixture/gh" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$*" >> "$FIXTURE/calls"
case "$*" in
  'api repos/example/game/pulls/20')
    if [ -f "$FIXTURE/dispatched" ]; then cat "$FIXTURE/current-pr.json"; else cat "$FIXTURE/pr.json"; fi ;;
  'api --method POST -H X-GitHub-Api-Version: 2026-03-10 repos/example/game/actions/workflows/qa.yml/dispatches -f ref=release-please--branches--main -f inputs[scope]=smoke')
    touch "$FIXTURE/dispatched"
    test ! -f "$FIXTURE/api-error"
    cat "$FIXTURE/dispatch.json" ;;
  "api repos/example/game/actions/runs/$RUN_ID") cat "$FIXTURE/run.json" ;;
  *) echo "Unerwarteter API-Aufruf: $*" >&2; exit 99 ;;
esac
MOCK
chmod +x "$fixture/gh"
export PATH="$fixture:$PATH" FIXTURE="$fixture" GITHUB_REPOSITORY=example/game RELEASE_PR='{"number":20}'
export GITHUB_SERVER_URL=https://github.com GITHUB_STEP_SUMMARY="$fixture/summary" RUN_ID=123
sha=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
reset_fixture() {
  rm -f "$fixture/dispatched" "$fixture/summary" "$fixture/calls" "$fixture/api-error"
  jq -n --arg sha "$sha" '{state:"open",merged_at:null,base:{ref:"main"},head:{ref:"release-please--branches--main",sha:$sha,repo:{full_name:"example/game"}}}' > "$fixture/pr.json"
  cp "$fixture/pr.json" "$fixture/current-pr.json"
  jq -n --argjson id "$RUN_ID" '{workflow_run_id:$id,html_url:("https://github.com/example/game/actions/runs/" + ($id|tostring))}' > "$fixture/dispatch.json"
  jq -n --arg sha "$sha" --argjson id "$RUN_ID" '{id:$id,repository:{full_name:"example/game"},head_repository:{full_name:"example/game"},event:"workflow_dispatch",path:".github/workflows/qa.yml",head_branch:"release-please--branches--main",head_sha:$sha,html_url:("https://github.com/example/game/actions/runs/" + ($id|tostring)),run_attempt:1}' > "$fixture/run.json"
}
change_fixture() {
  jq "$2" "$fixture/$1.json" > "$fixture/changed.json"
  mv "$fixture/changed.json" "$fixture/$1.json"
}
reject() {
  if bash "$root/.github/scripts/dispatch-release-qa.sh" > "$fixture/output" 2>&1; then
    echo "Ungültige Zuordnung akzeptiert: $*" >&2; exit 1
  fi
  ! grep -Fq 'Kurze QA zugeordnet' "$fixture/output" "${GITHUB_STEP_SUMMARY}" 2>/dev/null
  grep -Fq 'nicht eindeutig zugeordnet' "$fixture/output"
}
for RUN_ID in 123 456; do
  export RUN_ID
  reset_fixture
  bash "$root/.github/scripts/dispatch-release-qa.sh" > "$fixture/output"
  test -f "$fixture/dispatched"
  grep -Fq "Lauf $RUN_ID, Versuch 1" "$fixture/summary"
  grep -Fq "$sha" "$fixture/summary"
  grep -Fq 'keinen Testerfolg' "$fixture/summary"
  test "$(wc -l < "$fixture/calls" | tr -d ' ')" = 4
  cmp "$fixture/output" "$fixture/summary"
done
for change in '.state="closed"' '.merged_at="2026-11-07"' '.base.ref="feature"' '.head.repo.full_name="foreign/game"' '.head.ref="feature"' '.head.sha=null' '.head.sha="invalid"'; do
  reset_fixture; change_fixture pr "$change"; reject "$change"
  test ! -e "$fixture/dispatched"
done
for change in '.workflow_run_id=null' '.workflow_run_id="456"' '.workflow_run_id=0' '.workflow_run_id=1.5' '.html_url="https://example.com/foreign-run"'; do
  reset_fixture; change_fixture dispatch "$change"; reject "$change"
  test -e "$fixture/dispatched"
done
for change in '.id=789' '.repository.full_name="foreign/game"' '.head_repository.full_name="foreign/game"' '.event="pull_request"' '.path=".github/workflows/release.yml"' '.head_branch="main"' '.head_sha="bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"' '.html_url="https://example.com/foreign-run"' '.run_attempt=2'; do
  reset_fixture; change_fixture run "$change"; reject "$change"
done
for change in '.state="closed"' '.head.sha="bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"' '.head.ref="release-please--branches--main-new"' '.base.ref="other"'; do
  reset_fixture; change_fixture current-pr "$change"; reject "$change"
done
reset_fixture
change_fixture run '.status="completed" | .conclusion="failure"'
bash "$root/.github/scripts/dispatch-release-qa.sh" > "$fixture/output"
grep -Fq 'keinen Testerfolg' "$fixture/summary"
reset_fixture
: > "$fixture/dispatch.json"
reject 'Leere Dispatch-Antwort'
reset_fixture
printf 'invalid-json' > "$fixture/dispatch.json"
reject 'Ungültiges JSON'
reset_fixture
touch "$fixture/api-error"
reject 'API-Fehler'
for number in '"invalid"' 0 -1 1.5; do
  reset_fixture
  RELEASE_PR="{\"number\":$number}" reject "PR-Nummer $number"
  test ! -e "$fixture/dispatched"
done
echo 'Versions-PR-QA: Run-/Commit-Zuordnung, wiederholte Starts, veraltete PRs und ungültige API-Antworten geprüft.'

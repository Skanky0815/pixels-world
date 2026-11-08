#!/usr/bin/env bash
set -euo pipefail
root=$(cd "$(dirname "$0")/../.." && pwd)
fixture=$(mktemp -d)
trap 'rm -rf "$fixture"' EXIT
cat > "$fixture/gh" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
case "$*" in
  *git/ref/heads/main*)
    [ "$MOCK_SCENARIO" != main-api-error ] || exit 1
    count=$(cat "$FIXTURE/main-count"); echo $((count + 1)) > "$FIXTURE/main-count"
    if [ "$MOCK_SCENARIO" = stale ] || { [ "$MOCK_SCENARIO" = moves ] && [ "$count" -gt 0 ]; }; then echo bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    else echo "$GITHUB_SHA"; fi ;;
  *actions/workflows/qa.yml/runs*)
    [ "$MOCK_SCENARIO" != api-error ] || exit 1
    count=$(cat "$FIXTURE/run-count"); echo $((count + 1)) > "$FIXTURE/run-count"
    case "$MOCK_SCENARIO" in
      malformed) echo invalid-json; exit 0 ;;
      no-array) echo '{}'; exit 0 ;;
      missing|dispatch-error|invisible)
        if [ "$count" -lt 2 ] || [ "$MOCK_SCENARIO" = invisible ]; then echo '{"workflow_runs":[]}'; exit 0; fi ;;
    esac
    status=completed
    event=push
    if [ "$MOCK_SCENARIO" = missing ]; then event=workflow_dispatch; fi
    if [ "$MOCK_SCENARIO" = running ] && [ "$count" -lt 2 ]; then status=in_progress; fi
    if [ "$MOCK_SCENARIO" = missing ] && [ "$count" = 2 ]; then status=queued; fi
    if [ "$MOCK_SCENARIO" = timeout ] || [ "$MOCK_SCENARIO" = moves ]; then status=queued; fi
    jq -n --arg sha "$GITHUB_SHA" --arg status "$status" --arg event "$event" --arg conclusion "${MOCK_CONCLUSION:-success}" \
      '{workflow_runs:[{id:7,head_sha:$sha,head_branch:"main",event:$event,status:$status,conclusion:$conclusion}]}' \
      | jq "${MOCK_MUTATION:-.}" ;;
  'workflow run qa.yml --repo example/game --ref main -f scope=smoke')
    [ "$MOCK_SCENARIO" != dispatch-error ] || exit 1
    echo dispatch >> "$FIXTURE/dispatches" ;;
  *) echo "Unerwarteter gh-Aufruf: $*" >&2; exit 99 ;;
esac
MOCK
cat > "$fixture/sleep" <<'MOCK'
#!/usr/bin/env bash
[ "$*" = 5 ] || exit 99
echo sleep >> "$FIXTURE/sleeps"
MOCK
chmod +x "$fixture/gh" "$fixture/sleep"
export PATH="$fixture:$PATH" FIXTURE="$fixture"
export GITHUB_REPOSITORY=example/game GITHUB_SHA=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa RELEASE_MODE=prepare
reset_case() {
  echo 0 > "$fixture/main-count"
  echo 0 > "$fixture/run-count"
  rm -f "$fixture/dispatches" "$fixture/sleeps"
  export MOCK_SCENARIO="$1" MOCK_CONCLUSION=success MOCK_MUTATION=.
}
execute() { bash "$root/.github/scripts/ensure-main-qa.sh" > "$fixture/result.log" 2>&1; }
expect_failure() {
  if execute; then echo 'Ungültige Main-QA-Bereitstellung akzeptiert.' >&2; exit 1; fi
}
reset_case success
execute
test ! -e "$fixture/dispatches" && test ! -e "$fixture/sleeps"
reset_case success
export MOCK_MUTATION='.workflow_runs[0].event="workflow_dispatch"'
execute
test ! -e "$fixture/dispatches"
reset_case success
export MOCK_CONCLUSION=failure MOCK_MUTATION='.workflow_runs += [(.workflow_runs[0] | .id=6 | .conclusion="success")]'
expect_failure
test ! -e "$fixture/dispatches"
reset_case running
execute
test ! -e "$fixture/dispatches"
test "$(wc -l < "$fixture/sleeps" | tr -d ' ')" = 2
reset_case missing
execute
test "$(wc -l < "$fixture/dispatches" | tr -d ' ')" = 1
test "$(cat "$fixture/run-count")" = 4
for result in failure cancelled skipped timed_out neutral action_required; do
  reset_case success
  export MOCK_CONCLUSION="$result"
  expect_failure
  test ! -e "$fixture/dispatches"
done
for mutation in '.workflow_runs[0].head_sha="other"' '.workflow_runs[0].head_branch="feature"' '.workflow_runs[0].event="pull_request"' '.workflow_runs[0].id="bad"'; do
  reset_case success
  export MOCK_MUTATION="$mutation"
  expect_failure
  test ! -e "$fixture/dispatches"
done
for scenario in stale moves main-api-error api-error malformed no-array dispatch-error timeout invisible; do
  reset_case "$scenario"
  expect_failure
  if [ "$scenario" = timeout ]; then
    test "$(cat "$fixture/run-count")" = 240
    test ! -e "$fixture/dispatches"
  fi
  if [ "$scenario" = invisible ]; then test "$(wc -l < "$fixture/dispatches" | tr -d ' ')" = 1; fi
done
reset_case missing
if RELEASE_MODE=publish execute; then exit 1; fi
test ! -e "$fixture/dispatches"
echo 'Main-QA-Bereitstellung: Wiederverwendung, Warten, einmaliger Dispatch und Fehler-/Identitäts-/Timeout-Fälle bestanden.'

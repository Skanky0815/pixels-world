#!/usr/bin/env bash
set -euo pipefail
root=$(cd "$(dirname "$0")/../.." && pwd)
fixture=$(mktemp -d)
trap 'rm -rf "$fixture"' EXIT
cat > "$fixture/gh" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
case "$*" in
  api*) cat "$FIXTURE/pr.json" ;;
  'workflow run qa.yml --repo example/game --ref release-please--branches--main -f scope=smoke') echo dispatched > "$FIXTURE/dispatched" ;;
  *) exit 99 ;;
esac
MOCK
chmod +x "$fixture/gh"
export PATH="$fixture:$PATH" FIXTURE="$fixture" GITHUB_REPOSITORY=example/game RELEASE_PR='{"number":20}'
reset_fixture() {
  echo '{"state":"open","merged_at":null,"base":{"ref":"main"},"head":{"ref":"release-please--branches--main","repo":{"full_name":"example/game"}}}' > "$fixture/pr.json"
  rm -f "$fixture/dispatched"
}
reset_fixture
bash "$root/.github/scripts/dispatch-release-qa.sh"
test -s "$fixture/dispatched"
for change in '.state="closed"' '.merged_at="2026-11-07"' '.base.ref="feature"' '.head.repo.full_name="foreign/game"' '.head.ref="feature"'; do
  reset_fixture
  jq "$change" "$fixture/pr.json" > "$fixture/changed.json"
  mv "$fixture/changed.json" "$fixture/pr.json"
  if bash "$root/.github/scripts/dispatch-release-qa.sh" > /dev/null 2>&1; then echo 'Ungültiger QA-Dispatch akzeptiert' >&2; exit 1; fi
  test ! -e "$fixture/dispatched"
done
reset_fixture
if RELEASE_PR='{"number":"invalid"}' bash "$root/.github/scripts/dispatch-release-qa.sh" > /dev/null 2>&1; then exit 1; fi
test ! -e "$fixture/dispatched"
echo 'Versions-PR-QA: gezielter Smoke-Dispatch und ungültige Quellen geprüft.'

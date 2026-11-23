#!/usr/bin/env bash
set -euo pipefail
repo_root=$(cd "$(dirname "$0")/../.." && pwd)
fixture=$(mktemp -d)
trap 'rm -rf "$fixture"' EXIT
cat > "$fixture/gh" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
[ "${MOCK_API_FAILURE:-0}" != 1 ] || exit 1
case "$*" in
  "api repos/example/game/git/ref/heads/main --jq .object.sha") echo "${MAIN_SHA:-$GITHUB_SHA}" ;;
  "api repos/example/game/releases/tags/$RELEASE_TAG") cat "$FIXTURE/release.json" ;;
  "api repos/example/game/git/ref/tags/$RELEASE_TAG --jq .object") cat "$FIXTURE/tag.json" ;;
  "api repos/example/game/git/tags/"*" --jq .object") cat "$FIXTURE/annotated.json" ;;
  *) echo "Unerwarteter API-Aufruf (nur lesende Identitätsprüfung erlaubt): $*" >&2; exit 99 ;;
esac
MOCK
chmod +x "$fixture/gh"
export PATH="$fixture:$PATH" FIXTURE="$fixture"
export GITHUB_REPOSITORY=example/game GITHUB_SHA=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
export RELEASE_SHA="$GITHUB_SHA" RELEASE_TAG=v0.7.0
printf '{"tag_name":"%s","draft":false,"published_at":"2026-11-23T00:00:00Z"}' "$RELEASE_TAG" > "$fixture/release.json"
printf '{"type":"commit","sha":"%s"}' "$RELEASE_SHA" > "$fixture/tag.json"
cp "$fixture/tag.json" "$fixture/annotated.json"
verify() { bash "$repo_root/.github/scripts/verify-release.sh" > "$fixture/result.log" 2>&1; }
reject() {
  if verify; then echo 'Ungültiger Pages-Wiederanlauf akzeptiert.' >&2; exit 1; fi
}
# An already published release remains valid on repeated deployment attempts;
# no Release Please call, tag write or second release creation is allowed here.
verify
verify
MAIN_SHA=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb reject
grep -q 'main ist weitergelaufen' "$fixture/result.log"
RELEASE_SHA=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb reject
RELEASE_TAG=invalid reject
MOCK_API_FAILURE=1 reject
# A moved lightweight or annotated tag must not deploy the previously tested build.
printf '{"type":"commit","sha":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"}' > "$fixture/tag.json"
reject
printf '{"type":"tag","sha":"cccccccccccccccccccccccccccccccccccccccc"}' > "$fixture/tag.json"
verify
printf '{"type":"commit","sha":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"}' > "$fixture/annotated.json"
reject
printf '{"type":"commit","sha":"%s"}' "$RELEASE_SHA" > "$fixture/annotated.json"
for release in '{"tag_name":"v0.7.0","draft":true,"published_at":null}' '{"tag_name":"v0.8.0","draft":false,"published_at":"2026-11-23"}' 'invalid-json'; do
  printf '%s' "$release" > "$fixture/release.json"
  reject
done
echo 'Pages-Wiederanlauf: veröffentlichte Identität wiederverwendbar; Main-/Tag-Wechsel und ungültige Antworten stoppen ohne Mutation.'

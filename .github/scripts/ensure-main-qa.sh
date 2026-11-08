#!/usr/bin/env bash
set -euo pipefail

note() {
  echo "$*"
  if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then echo "$*" >> "$GITHUB_STEP_SUMMARY"; fi
}
fail() {
  note "::error::$*"
  exit 1
}
check_main() {
  local current
  current=$(gh api "repos/$GITHUB_REPOSITORY/git/ref/heads/main" --jq '.object.sha')
  [ "$current" = "$GITHUB_SHA" ] || fail 'main ist weitergelaufen. Spielrelease auf dem aktuellen main erneut starten.'
}
latest_qa() {
  gh api --method GET "repos/$GITHUB_REPOSITORY/actions/workflows/qa.yml/runs" \
    -f branch=main -f head_sha="$GITHUB_SHA" -f per_page=1 \
    | jq -c 'if (.workflow_runs | type) != "array" then error("Ungültige QA-Antwort") else .workflow_runs[0] // {} end'
}

[ "${RELEASE_MODE:-}" = prepare ] || fail 'Main-QA darf nur bei manueller Release-Vorbereitung gestartet werden.'
dispatched=false
last_id=''
deadline=$((SECONDS + 1200))
# Bound queue + runtime waiting to 20 minutes; leave time for Release Please afterward.
for ((attempt = 0; attempt < 240 && SECONDS < deadline; attempt++)); do
  check_main
  run=$(latest_qa)
  if [ "$run" = '{}' ]; then
    if [ "$dispatched" = false ]; then
      # Recheck immediately before dispatch: never intentionally test another main.
      check_main
      note 'Für diesen Main-Commit fehlt QA. Kurze QA wird automatisch gestartet.'
      gh workflow run qa.yml --repo "$GITHUB_REPOSITORY" --ref main -f scope=smoke
      dispatched=true
    fi
  else
    jq -e --arg sha "$GITHUB_SHA" '.head_sha == $sha and .head_branch == "main" and (.event == "push" or .event == "workflow_dispatch") and (.id | type == "number" and . > 0)' <<< "$run" > /dev/null \
      || fail 'Unerwartete QA-Quelle. Kein Versions-PR vorbereitet.'
    id=$(jq -r '.id' <<< "$run")
    url="https://github.com/$GITHUB_REPOSITORY/actions/runs/$id"
    if [ "$id" != "$last_id" ]; then
      note "Main-QA für $GITHUB_SHA: $url"
      last_id=$id
    fi
    if [ "$(jq -r '.status' <<< "$run")" = completed ]; then
      [ "$(jq -r '.conclusion' <<< "$run")" = success ] \
        || fail "Main-QA ist nicht erfolgreich: $url. Fehler beheben und QA erneut prüfen."
      check_main
      note 'Main-QA erfolgreich. Versions-PR wird vorbereitet.'
      exit 0
    fi
  fi
  if [ "$attempt" -lt 239 ]; then sleep 5; fi
done
fail 'Main-QA ist nach 20 Minuten nicht abgeschlossen. QA-Lauf prüfen und Spielrelease nach erfolgreichem Abschluss erneut starten.'

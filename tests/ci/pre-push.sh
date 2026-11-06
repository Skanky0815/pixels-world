#!/usr/bin/env bash
set -euo pipefail
repo_root=$(cd "$(dirname "$0")/../.." && pwd)
fixture_dir=$(mktemp -d)
trap 'rm -rf "$fixture_dir"' EXIT
export GIT_CONFIG_GLOBAL=/dev/null
mkdir -p "$fixture_dir/repo/.githooks" "$fixture_dir/repo/tools" "$fixture_dir/bin"
cp "$repo_root/.githooks/pre-push" "$fixture_dir/repo/.githooks/"
cp "$repo_root/tools/install-hooks.sh" "$fixture_dir/repo/tools/"
cat > "$fixture_dir/bin/npm" <<'MOCK'
#!/bin/sh
printf '%s\n' "$*" >> "$NPM_LOG"
exit "${NPM_RESULT:-0}"
MOCK
chmod +x "$fixture_dir/bin/npm"
export PATH="$fixture_dir/bin:$PATH" NPM_LOG="$fixture_dir/npm.log"
cd "$fixture_dir/repo"
git init -q
git config user.name 'Hook test fixture'
git config user.email 'hook-test@example.invalid'
git add .
git commit -qm 'test fixture'
first=$(git rev-parse HEAD)
printf 'initial\n' > tracked.txt
git add tracked.txt
git commit -qm 'second fixture'
head=$(git rev-parse HEAD)
update="refs/heads/topic $head refs/heads/topic $first"
printf '# existing hook\n' > .git/hooks/pre-push
if sh tools/install-hooks.sh > /dev/null 2>&1; then exit 1; fi
rm .git/hooks/pre-push
sh tools/install-hooks.sh > /dev/null
test "$(git config --local --get core.hooksPath)" = .githooks
sh tools/install-hooks.sh > /dev/null
printf '%s\n' "$update" | sh .githooks/pre-push
test "$(cat "$NPM_LOG")" = 'run check:pr'
if printf '%s\n' "$update" | NPM_RESULT=1 sh .githooks/pre-push > /dev/null 2>&1; then exit 1; fi
printf 'dirty\n' >> tracked.txt
if printf '%s\n' "$update" | sh .githooks/pre-push > /dev/null 2>&1; then exit 1; fi
git restore tracked.txt
if printf 'refs/heads/other %s refs/heads/other %s\n' "$first" "$head" | sh .githooks/pre-push > /dev/null 2>&1; then exit 1; fi
: > "$NPM_LOG"
printf 'refs/heads/deleted 0000000000000000000000000000000000000000 refs/heads/deleted %s\n' "$head" | sh .githooks/pre-push
test ! -s "$NPM_LOG"
git config --local core.hooksPath custom-hooks
if sh tools/install-hooks.sh > /dev/null 2>&1; then exit 1; fi
test "$(git config --local --get core.hooksPath)" = custom-hooks
echo 'Hook-Tests: Installation, Wiederholung, Prüfbefehl, Fehler, dirty HEAD, anderer Commit, Löschung und Konfigurationsschutz bestanden.'

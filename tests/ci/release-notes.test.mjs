import { URL } from 'node:url';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { parseConventionalCommits } from 'release-please/build/src/commit.js';
import { DefaultChangelogNotes } from 'release-please/build/src/changelog-notes/default.js';
import { releaseNote, generatedVersionPr } from '../../tools/release-note.mjs';

const config = JSON.parse(
  readFileSync(new URL('../../release-please-config.json', import.meta.url)),
);
const silent = { debug() {} };
const sha = 'fc54af906770689ffc4cae08772459489e57d925';
const override = (subject, refs = 'Refs #202\nRefs #204') =>
  `## Änderung\nDeutsche Beschreibung.\n\nCloses #202\n\nBEGIN_COMMIT_OVERRIDE\n${subject}\n\n${refs}\nEND_COMMIT_OVERRIDE`;
const commit = (message, body, hash = sha) => ({
  sha: hash,
  message,
  pullRequest: { number: 204, title: 'Deutscher PR-Titel', body },
});
const parse = (commits) => parseConventionalCommits(commits, silent);
const notes = (commits) =>
  new DefaultChangelogNotes().buildNotes(parse(commits), {
    owner: 'Skanky0815',
    repository: 'pixels-world',
    version: '0.3.0',
    previousTag: 'v0.2.0',
    currentTag: 'v0.3.0',
    changelogSections: config['changelog-sections'],
  });
const changes = (commits) =>
  parse(commits).filter((c) => ['feat', 'fix', 'perf', 'deps', 'docs'].includes(c.type));

test('Reproduziert v0.2.0: wiederholter Squash-Subject erzeugt zwei Einträge derselben SHA', () => {
  const raw = commit(
    'fix(ui): render result hearts with consistent geometry (#204)\n\nfix(ui): render result hearts with consistent geometry\n\nCloses #202',
    '',
  );
  const entries = changes([raw]);
  assert.equal(entries.length, 2);
  assert.equal(new Set(entries.map((c) => c.sha)).size, 1);
});

test('Offizieller Commit-Override liefert genau einen englischen Fix mit beiden Verweisen', async () => {
  const body = override('fix(ui): render result hearts with consistent geometry');
  assert.equal(
    releaseNote(body).split('\n')[0],
    'fix(ui): render result hearts with consistent geometry',
  );
  const raw = commit(
    'fix: Ergebnis-Herzen vereinheitlichen (#204)\n\nfix(ui): render result hearts with consistent geometry',
    body,
  );
  const entries = changes([raw]);
  assert.equal(entries.length, 1);
  const text = await notes([raw]);
  assert.match(text, /### Bug Fixes/);
  assert.equal(text.split('render result hearts with consistent geometry').length - 1, 1);
  assert.match(text, /issues\/202/);
  assert.match(text, /issues\/204/);
  assert.doesNotMatch(text, /Ergebnis|Fehlerkorrekturen/);
});

test('Mehrere interne Commits und deutscher PR-Titel werden durch eine englische Feature-Notiz ersetzt', async () => {
  const raw = commit(
    'feat: Album einführen\n\nfeat(ui): add chapters\n\nfix: repair focus',
    override('feat(album): add a persistent collection with room chapters'),
  );
  const text = await notes([raw]);
  assert.equal(changes([raw]).length, 1);
  assert.match(text, /### Features/);
  assert.match(text, /add a persistent collection with room chapters/);
  assert.doesNotMatch(text, /Album einführen|add chapters|repair focus|Funktionen/);
});

test('Unterschiedliche Änderungen mit derselben SHA werden nicht pauschal dedupliziert', async () => {
  const raw = commit('feat: add chapter navigation\n\nfix: restore keyboard focus', '');
  assert.equal(changes([raw]).length, 2);
  const text = await notes([raw]);
  assert.match(text, /add chapter navigation/);
  assert.match(text, /restore keyboard focus/);
});

test('Gleichlautende Änderungen unterschiedlicher Commits werden nicht weggefiltert', async () => {
  const a = commit('fix: preserve keyboard focus', '', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  const b = commit('fix: preserve keyboard focus', '', 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
  const text = await notes([a, b]);
  assert.equal(changes([a, b]).length, 2);
  assert.match(text, /commit\/aaaaaaaa/);
  assert.match(text, /commit\/bbbbbbbb/);
});

test('Fehlende, leere, mehrdeutige und mehrzeilige Overrides werden abgewiesen', () => {
  for (const body of [
    '',
    'Nur deutscher Text',
    'BEGIN_COMMIT_OVERRIDE\n\nEND_COMMIT_OVERRIDE',
    override('type(scope): English summary'),
    override('fix: TODO'),
    override('fix: first\n\nfix: second'),
    override('fix: valid') + '\n' + override('fix: another'),
    override('fix: valid').replace('END_COMMIT_OVERRIDE', ''),
  ]) {
    assert.throws(() => releaseNote(body));
  }
});

test('Issue-Verweise außerhalb des Overrides dürfen nicht verloren gehen', () => {
  assert.throws(() => releaseNote(override('fix: keep references', 'Refs #204')), /#202/);
  assert.throws(() => releaseNote(override('fix: keep references') + '\nRefs #205, #206'), /#205/);
  assert.doesNotThrow(() => releaseNote(override('fix: keep references', 'Refs #202, #204')));
});

test('Breaking-Change-Marker und Erklärung bleiben für SemVer erhalten', () => {
  const body = override(
    'feat!: replace the collection format',
    'Refs #202\nBREAKING CHANGE: replace the collection format',
  );
  releaseNote(body);
  assert.equal(changes([commit('feat: old title', body)])[0].breaking, true);
});

test('Nur der echte automatisch erzeugte Release-Please-PR ist ausgenommen', () => {
  const pr = {
    user: { login: 'github-actions[bot]' },
    head: { ref: 'release-please--branches--main', repo: { full_name: 'example/game' } },
    base: { ref: 'main', repo: { full_name: 'example/game' } },
    labels: [{ name: 'autorelease: pending' }],
  };
  assert.equal(generatedVersionPr(pr), true);
  assert.ok(!generatedVersionPr({ ...pr, user: { login: 'Sara-Pixel42' } }));
  assert.ok(!generatedVersionPr({ ...pr, head: { ...pr.head, repo: { full_name: 'fork/game' } } }));
  assert.ok(!generatedVersionPr({ ...pr, labels: [] }));
  assert.ok(!generatedVersionPr({ ...pr, base: { ref: 'main' } }));
});

test('Alle sichtbaren Changelog-Überschriften sind Englisch; die Veröffentlichung bleibt bei Release Please', () => {
  assert.deepEqual(
    config['changelog-sections'].map((x) => x.section),
    ['Features', 'Bug Fixes', 'Performance Improvements', 'Dependencies', 'Documentation'],
  );
  const workflow = readFileSync(
    new URL('../../.github/workflows/release.yml', import.meta.url),
    'utf8',
  );
  assert.match(workflow, /googleapis\/release-please-action@/);
  assert.doesNotMatch(workflow, /generate[-_]release[-_]notes|generate-notes/);
  const validation = readFileSync(
    new URL('../../.github/workflows/release-note.yml', import.meta.url),
    'utf8',
  );
  assert.match(
    validation,
    /opened, edited, synchronize, reopened, ready_for_review, labeled, unlabeled/,
  );
  assert.doesNotMatch(validation, /pull_request_target|permissions: write-all/);
});

test('Ein Release mit mehreren PRs enthält je eine englische Feature- und Fix-Zeile', async () => {
  const feature = commit(
    'feat: Deutscher Titel\n\nfeat: duplicate internal subject',
    override('feat(album): collect discovered objects'),
  );
  const fix = commit(
    'fix: Fokus wiederherstellen\n\nfix: duplicate internal subject',
    override('fix(ui): restore focus after closing dialogs'),
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  );
  const text = await notes([feature, fix]);
  assert.equal(changes([feature, fix]).length, 2);
  assert.match(text, /### Features/);
  assert.match(text, /### Bug Fixes/);
  assert.equal(text.split('collect discovered objects').length - 1, 1);
  assert.equal(text.split('restore focus after closing dialogs').length - 1, 1);
  assert.doesNotMatch(text, /Deutscher|Fokus wiederherstellen|duplicate internal subject/);
});

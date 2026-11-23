import { parseConventionalCommits } from 'release-please/build/src/commit.js';

const types = new Set([
  'feat',
  'fix',
  'perf',
  'deps',
  'docs',
  'build',
  'chore',
  'ci',
  'refactor',
  'test',
  'style',
  'revert',
]);
const header = /^(\w+)(?:\([a-z0-9][a-z0-9/-]*\))?!?: \S.*$/;
const reference = /^(?:Refs|Closes|Fixes) #\d+(?:, #\d+)*$/;
const logger = { debug() {} };

export function releaseNote(body) {
  const starts = body.split('BEGIN_COMMIT_OVERRIDE').length - 1;
  const ends = body.split('END_COMMIT_OVERRIDE').length - 1;
  if (starts !== 1 || ends !== 1)
    throw new Error('Genau ein BEGIN_COMMIT_OVERRIDE/END_COMMIT_OVERRIDE-Block ist erforderlich.');
  const block = body
    .match(/^BEGIN_COMMIT_OVERRIDE\r?\n([\s\S]*?)\r?\nEND_COMMIT_OVERRIDE$/m)?.[1]
    .trim();
  if (!block) throw new Error('Der Release-Note-Block ist leer oder falsch begrenzt.');
  const [subject, ...lines] = block.split(/\r?\n/);
  const match = subject.match(header);
  if (!match || !types.has(match[1]))
    throw new Error('Eine englische Conventional-Commit-Zeile als Release Note eintragen.');
  if (
    ['English summary', 'describe the change', 'TODO'].includes(
      subject.slice(subject.indexOf(': ') + 2),
    )
  )
    throw new Error(
      'Die Beispiel-Release-Note durch eine konkrete englische Beschreibung ersetzen.',
    );
  for (const line of lines) {
    if (line && !reference.test(line) && !/^BREAKING CHANGE: \S.+$/.test(line))
      throw new Error(
        'Nach der Release Note sind nur Issue-Verweise und eine BREAKING CHANGE-Erklärung erlaubt.',
      );
  }
  const parsed = parseConventionalCommits(
    [{ sha: 'validation', message: '', pullRequest: { body } }],
    logger,
  ).filter((commit) => types.has(commit.type));
  if (parsed.length !== 1) throw new Error('Der Override muss genau eine Änderung enthalten.');
  const references = new Set(block.match(/#\d+/g) ?? []);
  const outside = body.replace(/^BEGIN_COMMIT_OVERRIDE[\s\S]*?^END_COMMIT_OVERRIDE$/m, '');
  for (const [, group] of outside.matchAll(/(?:Closes|Fixes|Refs)\s+(#\d+(?:,\s*#\d+)*)/gi))
    for (const issue of group.match(/#\d+/g))
      if (!references.has(issue))
        throw new Error(`Issue-Verweis ${issue} fehlt im Release-Note-Block.`);
  return block;
}

export function generatedVersionPr(pr) {
  const repository = pr.base?.repo?.full_name;
  return Boolean(
    repository &&
    pr.user?.login === 'github-actions[bot]' &&
    pr.head?.repo?.full_name === repository &&
    pr.base?.ref === 'main' &&
    pr.head?.ref?.startsWith('release-please--branches--main') &&
    pr.labels?.some((label) => label.name === 'autorelease: pending'),
  );
}

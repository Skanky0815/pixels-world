import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { env, stdout, argv } from 'node:process';
import { pathToFileURL } from 'node:url';
import { selectQa } from './qa-selection.ts';

// Diff commit trees directly: no file-count truncation, API pagination or rename blind spots.
export function changedPaths(base, head, cwd = undefined) {
  if (![base, head].every((sha) => /^[a-f0-9]{40}$/.test(sha ?? '') && !/^0+$/.test(sha)))
    throw new Error('Kein vollständiges Commit-Paar vorhanden');
  execFileSync('git', ['cat-file', '-e', `${head}^{commit}`], { cwd, stdio: 'pipe' });
  try {
    execFileSync('git', ['cat-file', '-e', `${base}^{commit}`], { cwd, stdio: 'pipe' });
  } catch {
    execFileSync('git', ['fetch', '--no-tags', '--depth=1', 'origin', base], {
      cwd,
      stdio: 'pipe',
    });
  }
  const diff = execFileSync(
    'git',
    ['diff', '--name-only', '--no-renames', '-z', base, head, '--'],
    { cwd },
  );

  return diff.toString('utf8').split('\0').filter(Boolean);
}

export function selectionFromEnvironment(context = env) {
  let paths;
  if (['push', 'pull_request'].includes(context.QA_EVENT)) {
    try {
      paths = changedPaths(context.QA_BASE_SHA, context.QA_HEAD_SHA);
    } catch (error) {
      stdout.write(
        `Diff nicht vollständig ermittelbar; konservative Vollprüfung: ${error.message}\n`,
      );
    }
  }
  return selectQa({
    event: context.QA_EVENT,
    fullRound: context.QA_FULL_ROUND === 'true',
    requested: context.QA_REQUESTED_SCOPE || undefined,
    paths,
  });
}

if (argv[1] && import.meta.url === pathToFileURL(argv[1]).href) {
  if (!env.GITHUB_OUTPUT) throw new Error('GITHUB_OUTPUT fehlt');
  const selected = selectionFromEnvironment();
  const outputs = { ...selected, shards: JSON.stringify(selected.shards) };
  appendFileSync(
    env.GITHUB_OUTPUT,
    Object.entries(outputs)
      .map(([key, value]) => `${key}=${value}\n`)
      .join(''),
  );
  stdout.write(`QA-Auswahl: ${JSON.stringify(selected)}\n`);
  if (env.GITHUB_STEP_SUMMARY)
    appendFileSync(
      env.GITHUB_STEP_SUMMARY,
      `### QA-Auswahl\nProfil: **${selected.scope}** · Qualität erforderlich: **${selected.quality}**\n`,
    );
}

import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { URL, fileURLToPath } from 'node:url';
import { cwd, chdir, execPath } from 'node:process';
import { execFileSync, spawnSync } from 'node:child_process';
import { after, test } from 'node:test';
import { parse } from 'yaml';
import { checkImportBoundaries } from '../../tools/check-import-boundaries.mjs';

const repository = fileURLToPath(new URL('../../', import.meta.url));
const previous = cwd();
const root = mkdtempSync(join(tmpdir(), 'pixels-import-boundaries-'));
after(() => {
  chdir(previous);
  rmSync(root, { recursive: true, force: true });
});
function write(path, content) {
  const file = join(root, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}
const areas = ['landingpage', 'play', 'shared', 'dev'];
for (const area of areas)
  write(`game/${area}/a.ts`, 'export const value = 1; export type Value = number;');
write('tools/bridge.ts', "export * from '../game/play/a';");
write('game/shared/barrel.ts', "export * from '../play/a';");
write('game/shared/barrel.js', "export * from '../play/a';");
write('game/unclassified/bridge.ts', "export * from '../play/a';");
write('game/landingpage/entry.ts', "import { value } from '../shared/barrel'; console.log(value);");
write('assets/pixel.png', 'fixture');
write('game/play/theme.css', 'body {}');
write('package.json', JSON.stringify({ type: 'module', dependencies: { phaser: '*' } }));
write(
  'tsconfig.json',
  JSON.stringify({
    compilerOptions: {
      module: 'ESNext',
      moduleResolution: 'Bundler',
      baseUrl: '.',
      paths: Object.fromEntries([
        ...areas.map((area) => [`@${area}/*`, [`game/${area}/*`]]),
        ['#play/*', ['game/play/*']],
        ['@bridge', ['tools/bridge.ts']],
      ]),
    },
  }),
);
symlinkSync(join(repository, 'node_modules'), join(root, 'node_modules'), 'dir');
symlinkSync(join(root, 'game/play/a.ts'), join(root, 'game/shared/shortcut.ts'));
chdir(root);

async function messages(source, file = 'game/landingpage/probe.ts') {
  write(file, source);
  try {
    const { violations } = await checkImportBoundaries();
    return violations.filter(
      (message) => message.startsWith(`${file} →`) || message.startsWith(`${file}:`),
    );
  } finally {
    rmSync(join(root, file));
  }
}
async function rejected(source, file, pattern = /grenzen/) {
  const result = await messages(source, file);
  assert.equal(result.length, 1, JSON.stringify({ source, result }));
  assert.match(result[0], pattern);
}

test('Erlaubte Bereichsbeziehungen bestehen; verbotene Kanten nennen eine Alternative', async () => {
  const permitted = new Set([
    'landingpage/landingpage',
    'landingpage/shared',
    'play/play',
    'play/shared',
    'shared/shared',
    'dev/dev',
    'dev/play',
    'dev/shared',
  ]);
  for (const from of areas)
    for (const to of areas) {
      const source = `import { value } from '../${to}/a';`;
      const file = `game/${from}/probe.ts`;
      if (permitted.has(`${from}/${to}`)) assert.deepEqual(await messages(source, file), []);
      else
        await rejected(
          source,
          file,
          from === 'play' && to === 'dev' ? /dev-nur-dynamisch/ : /grenzen/,
        );
    }
  const [error] = await messages("import '../play/a';");
  assert.match(error, /game\/landingpage\/probe.ts → game\/play\/a.ts/);
  assert.match(error, /Erlaubt: game\/landingpage, game\/shared/);
});

test('Normalisierte Pfade, Aliase, Symlinks, Queries und reine Typimporte bleiben prüfbar', async () => {
  for (const source of [
    "import '../shared/../play/a';",
    "import '@play/a';",
    "import '#play/a';",
    "import '../shared/shortcut';",
    "import '../play/a.ts?raw';",
    "import '@play/a?url';",
    "import '../play/theme.css';",
    "import type { Value } from '../play/a';",
    "import { type Value } from '../play/a';",
    "export type { Value } from '@play/a';",
    "export * from '../play/a';",
    "export { value } from '../play/a';",
    "type T = import('../play/a').Value;",
    "import value = require('../play/a');",
    "require('../play/a');",
    "void import('../play/a');",
    'void import(`../play/a`);',
  ])
    await rejected(source);
  assert.deepEqual(await messages("import '@shared/a'; import '../../assets/pixel.png?url';"), []);
  assert.deepEqual(
    await messages(
      "import Phaser from 'phaser'; import 'virtual:pwa-register';",
      'game/play/probe.ts',
    ),
    [],
  );
});

test('Re-Exports in TS- und JS-Barrels sowie Brücken außerhalb der Anwendungsbereiche blockieren', async () => {
  const { violations } = await checkImportBoundaries();
  for (const extension of ['ts', 'js'])
    assert.ok(
      violations.some((message) =>
        message.startsWith(`game/shared/barrel.${extension} → game/play/a.ts:`),
      ),
    );
  assert.ok(!violations.some((message) => message.startsWith('game/landingpage/entry.ts')));
  await rejected("import '../../tools/bridge';", undefined, /keine-externen-quellbruecken/);
  await rejected("import '@bridge';", undefined, /keine-externen-quellbruecken/);
  await rejected("import '../unclassified/bridge';");
});

test('DEV-Laufzeitimporte brauchen einen positiven DEV-Zweig; Typ- und statische Importe sind verboten', async () => {
  const dev = "import('../dev/a')";
  const file = 'game/play/probe.ts';
  for (const source of [
    `if (import.meta.env.DEV) { void ${dev}; }`,
    `const start = import.meta.env.DEV && location.search ? ${dev} : import('./a');`,
    `import.meta.env.DEV && ${dev};`,
    `if (location.search && import.meta.env.DEV) { void import('@dev/a'); }`,
  ])
    assert.deepEqual(await messages(source, file), []);
  for (const source of [
    `void ${dev};`,
    `if (!import.meta.env.DEV) { void ${dev}; }`,
    `if (import.meta.env.DEV) {} else { void ${dev}; }`,
    `if (import.meta.env.DEV || location.search) { void ${dev}; }`,
    `const dev = import.meta.env.DEV; if (dev) { void ${dev}; }`,
    `import.meta.env.DEV ? import('./a') : ${dev};`,
    `if (import.meta.env.DEV) { void ${dev}; } void ${dev};`,
  ])
    await rejected(source, file, /positiven import.meta.env.DEV-Zweig/);
  for (const source of [
    "import '../dev/a';",
    "import type { Value } from '../dev/a';",
    "if (import.meta.env.DEV) { require('../dev/a'); }",
  ])
    await rejected(source, file, /dev-nur-dynamisch/);
  await rejected(`if (import.meta.env.DEV) { void ${dev}; }`, 'game/shared/probe.ts');
});

test('Unbekannte Aliase, berechnete Imports und Globs blockieren; bestehender Asset-Glob bleibt eng erlaubt', async () => {
  await rejected("import '@vite-only/a';", undefined, /importe-muessen-aufloesbar-sein/);
  await rejected("import 'virtual:unknown';", undefined, /importe-muessen-aufloesbar-sein/);
  await rejected("void import('../play/' + name);", undefined, /statisch lesbar/);
  await rejected('void import(`../play/${name}`);', undefined, /statisch lesbar/);
  await rejected("import.meta.glob('../play/*.ts');", undefined, /Glob-Imports/);
  const file = 'game/play/assets/object-audio.ts';
  assert.deepEqual(
    await messages(
      "import.meta.glob('../../../assets/audio/*.wav', {eager:true, query:'?url', import:'default'});",
      file,
    ),
    [],
  );
  await rejected("import.meta.glob('../../dev/*.ts');", file, /Glob-Imports/);
});

test('Alle Anwendungs-Codeformate werden erfasst; CLI und reguläre QA/CI verwenden dieselbe Prüfung', async () => {
  for (const extension of ['ts', 'js', 'mts', 'mjs', 'cts', 'cjs', 'tsx', 'jsx'])
    await rejected("import '../play/a';", `game/landingpage/probe.${extension}`);
  const script = join(repository, 'tools/check-import-boundaries.mjs');
  assert.match(
    execFileSync(execPath, [script], { cwd: repository, encoding: 'utf8' }),
    /Anwendungsdateien geprüft/,
  );
  const broken = spawnSync(execPath, [script], { cwd: root, encoding: 'utf8' });
  assert.equal(broken.status, 1);
  assert.match(broken.stderr, /shared-grenzen/);
  const pkg = JSON.parse(readFileSync(join(repository, 'package.json'), 'utf8'));
  assert.match(pkg.scripts.qa, /npm run check:imports/);
  const workflow = parse(readFileSync(join(repository, '.github/workflows/qa.yml'), 'utf8'));
  assert.ok(workflow.jobs.quality.steps.some((step) => step.run === 'npm run check:imports'));
});

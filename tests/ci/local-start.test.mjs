import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import process from 'node:process';

const repository = fileURLToPath(new URL('../../', import.meta.url));
const read = (name) => JSON.parse(readFileSync(join(repository, name), 'utf8'));
const manifest = read('package.json');

function fixture(t, engines = manifest.engines) {
  const folder = mkdtempSync(join(tmpdir(), 'pixels-start-'));
  t.after(() => rmSync(folder, { recursive: true, force: true }));
  const project = {
    name: 'pixels-start-fixture',
    version: '1.0.0',
    private: true,
    engines,
    scripts: {
      predev: manifest.scripts.predev,
      dev: `node -e "require('node:fs').writeFileSync('started', 'yes')"`,
    },
  };

  writeFileSync(join(folder, 'package.json'), JSON.stringify(project));
  writeFileSync(
    join(folder, 'package-lock.json'),
    JSON.stringify({
      name: project.name,
      version: project.version,
      lockfileVersion: 3,
      packages: { '': { name: project.name, version: project.version, engines } },
    }),
  );
  cpSync(join(repository, '.npmrc'), join(folder, '.npmrc'));
  mkdirSync(join(folder, 'tools/dev'), { recursive: true });
  cpSync(join(repository, 'tools/dev/check-start.mjs'), join(folder, 'tools/dev/check-start.mjs'));

  return folder;
}

function npm(folder, ...args) {
  return spawnSync('npm', args, {
    cwd: folder,
    encoding: 'utf8',
    env: {
      ...process.env,
      npm_config_cache: join(folder, '.npm-cache'),
      npm_config_userconfig: join(folder, '.user-npmrc'),
      npm_config_offline: 'true',
      npm_config_audit: 'false',
      npm_config_fund: 'false',
    },
  });
}

test('Paket und Lockdatei deklarieren dieselben Laufzeitvoraussetzungen', () => {
  assert.deepEqual(read('package-lock.json').packages[''].engines, manifest.engines);
  assert.equal(typeof manifest.engines.node, 'string');
  assert.equal(typeof manifest.engines.npm, 'string');
});

test('Natives npm ci akzeptiert unterstützte Voraussetzungen und weist ungeeignetes Node/npm ab', (t) => {
  const supported = npm(fixture(t), 'ci');
  assert.equal(supported.status, 0, supported.stderr);

  for (const engine of ['node', 'npm']) {
    const result = npm(fixture(t, { ...manifest.engines, [engine]: '>=999.0.0' }), 'ci');

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /EBADENGINE/);
    assert.match(result.stderr, /999\.0\.0/);
  }
});

test('Fehlende Entwicklungsabhängigkeiten stoppen vor dem Start und nennen den nächsten Schritt', (t) => {
  const folder = fixture(t);
  const missing = npm(folder, 'run', 'dev');

  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /npm ci --include=dev/);
  assert.equal(existsSync(join(folder, 'started')), false);
  mkdirSync(join(folder, 'node_modules/vite/bin'), { recursive: true });
  writeFileSync(join(folder, 'node_modules/vite/bin/vite.js'), '');
  const installed = npm(folder, 'run', 'dev');

  assert.equal(installed.status, 0, installed.stderr);
  assert.equal(readFileSync(join(folder, 'started'), 'utf8'), 'yes');
});

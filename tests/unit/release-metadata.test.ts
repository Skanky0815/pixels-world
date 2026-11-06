import assert from 'node:assert/strict';
import { test } from 'node:test';
import { releaseUrl } from '../../tools/release-metadata.ts';

test('Entwicklung, E2E und normale Produktionsvorschau verlinken keinen Release', () => {
  for (const mode of ['development', 'e2e', 'preview'])
    assert.equal(releaseUrl(mode, 'build', '1.2.3', 'v1.2.3'), null);
  assert.equal(releaseUrl('production', 'serve', '1.2.3', 'v1.2.3'), null);
  assert.equal(releaseUrl('production', 'build', '1.2.3'), null);
});

test('Verifizierter Release-Build verlinkt nur den genauen Paketstand', () => {
  assert.equal(
    releaseUrl('production', 'build', '1.2.3', 'v1.2.3'),
    'https://github.com/Skanky0815/pixels-world/releases/tag/v1.2.3',
  );
  assert.equal(
    releaseUrl('production', 'build', '1.2.3-rc.1+test', 'v1.2.3-rc.1+test'),
    'https://github.com/Skanky0815/pixels-world/releases/tag/v1.2.3-rc.1%2Btest',
  );
});

test('Abweichende oder ungültige Release-Tags brechen den Build ab', () => {
  for (const tag of ['v1.2.2', '1.2.3', 'https://example.org', 'v1.2.3/../../other'])
    assert.throws(() => releaseUrl('production', 'build', '1.2.3', tag));
  assert.throws(() => releaseUrl('production', 'build', '../other', 'v../other'));
});

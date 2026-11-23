const areas = {
  landingpage: ['landingpage', 'shared'],
  play: ['play', 'shared', 'dev'],
  shared: ['shared'],
  dev: ['dev', 'play', 'shared'],
};

export default {
  forbidden: [
    ...Object.entries(areas).map(([area, allowed]) => ({
      name: `${area}-grenzen`,
      severity: 'error',
      comment: `Erlaubt: ${allowed.map((name) => `game/${name}`).join(', ')}. Gemeinsame Grundlagen gehören nach game/shared.`,
      from: { path: `^game/${area}/` },
      to: { path: '^game/', pathNot: `^game/(${allowed.join('|')})/` },
    })),
    {
      name: 'keine-externen-quellbruecken',
      severity: 'error',
      comment:
        'Anwendungsquellen gehören nach game/landingpage, game/play, game/shared oder game/dev; keine Umgehung über Tools oder Tests.',
      from: { path: '^game/' },
      to: {
        path: '\\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)($|\\?)',
        pathNot: '^game/',
        dependencyTypesNot: ['npm', 'npm-dev', 'npm-peer', 'npm-optional', 'npm-bundled', 'core'],
      },
    },
    {
      name: 'dev-nur-dynamisch',
      severity: 'error',
      comment:
        'DEV-Code aus game/play ausschließlich dynamisch im positiven import.meta.env.DEV-Zweig laden. Reine Typverträge gehören ins Spiel.',
      from: { path: '^game/play/' },
      to: { path: '^game/dev/', dynamic: false },
    },
    {
      name: 'importe-muessen-aufloesbar-sein',
      severity: 'error',
      comment:
        'Lokale Module und Aliase müssen auflösbar sein. Aliase in tsconfig.json pflegen; nur virtual:pwa-register ist als virtuelles Modul freigegeben.',
      from: { path: '^game/' },
      to: { couldNotResolve: true, pathNot: '^virtual:pwa-register$' },
    },
  ],
  options: {
    tsPreCompilationDeps: true,
    doNotFollow: { path: '(?:^|/)node_modules/|^(?!game/)' },
    tsConfig: { fileName: 'tsconfig.json' },
  },
};

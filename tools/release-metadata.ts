/** Release identity is supplied only after the Pages workflow verified tag, commit and publication. */
export function releaseUrl(mode: string, command: string, version: string, tag?: string) {
  if (mode !== 'production' || command !== 'build' || !tag) return null;

  if (tag !== `v${version}` || !/^v\d+\.\d+\.\d+(?:-[\w.-]+)?(?:\+[\w.-]+)?$/.test(tag))
    throw new Error('Release tag does not match package version');

  return `https://github.com/Skanky0815/pixels-world/releases/tag/${encodeURIComponent(tag)}`;
}

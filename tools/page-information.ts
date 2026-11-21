import type { Plugin } from 'vite';
import { buildInfoMarkup, type BuildInfo } from '../game/shared/footer-content';
import { AGE_RATING, ageRatingMarkup } from '../game/shared/ui/page-shell.ts';

/** Public HTML, including the loading screen, receives its information before scripts run. */
export function pageInformation(info: BuildInfo): Plugin {
  return {
    name: 'page-information',
    transformIndexHtml: (html) =>
      html
        .replaceAll('<!-- BUILD_INFO -->', () => buildInfoMarkup(info))
        .replaceAll('<!-- AGE_META -->', `age=${AGE_RATING}`)
        .replaceAll('<!-- AGE_RATING -->', () => ageRatingMarkup()),
  };
}

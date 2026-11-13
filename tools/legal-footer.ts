import type { Plugin } from 'vite';
import { buildInfoMarkup, type BuildInfo } from '../src/footer-content';

// eslint-disable-next-line max-lines-per-function -- Ein zusammengehöriger HTML-Transform liefert beide statischen Footer-Bausteine ohne Browser-JavaScript aus.
export function legalFooter(info: BuildInfo, aiDisclosure: string): Plugin {
  return {
    name: 'legal-footer',
    transformIndexHtml(html, context) {
      if (!/\/(?:impressum|datenschutz|update|help|index)\.html$/.test(context.filename))
        return html;

      return html
        .replace('<!-- BUILD_INFO -->', buildInfoMarkup(info))
        .replace('<!-- AI_DISCLOSURE -->', aiDisclosure);
    },
  };
}

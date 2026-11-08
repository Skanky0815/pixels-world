import { t } from '../../i18n/locale';
import { roomIcon } from './album-room-icons';
import './game-action.css';
import { buttonMarkup, configureButton } from '../../ui/button';

type GameAction = 'album' | 'options';
const LABELS = { album: 'albumOpen', options: 'gameOptions' } as const;

function icon(action: GameAction) {
  return action === 'album' ? roomIcon('study') : optionsIcon();
}

export function configureAction(button: HTMLButtonElement, action: GameAction) {
  configureButton(button, { label: t(LABELS[action]), icon: icon(action) });
  button.setAttribute('aria-haspopup', 'dialog');
}

export function actionButton(action: GameAction, hook: string) {
  return buttonMarkup(
    { label: t(LABELS[action]), icon: icon(action) },
    `${hook} aria-haspopup="dialog"`,
  );
}

function optionsIcon() {
  return `<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path fill="currentColor" fill-rule="evenodd" d="M21.91,10.69 L21.91,13.31 L19.44,12.98 L17.95,16.57 L19.93,18.09 L18.09,19.93 L16.57,17.95 L12.98,19.44 L13.31,21.91 L10.69,21.91 L11.02,19.44 L7.43,17.95 L5.91,19.93 L4.07,18.09 L6.05,16.57 L4.56,12.98 L2.09,13.31 L2.09,10.69 L4.56,11.02 L6.05,7.43 L4.07,5.91 L5.91,4.07 L7.43,6.05 L11.02,4.56 L10.69,2.09 L13.31,2.09 L12.98,4.56 L16.57,6.05 L18.09,4.07 L19.93,5.91 L17.95,7.43 L19.44,11.02 Z M15.2,12 A3.2,3.2 0 1 0 8.8,12 A3.2,3.2 0 1 0 15.2,12 Z" /></svg>`;
}

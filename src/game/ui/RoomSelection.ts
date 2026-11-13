import preview from '../../../assets/landing/living-room.png';
import { ROOM_CHOICES, playableRoom } from '../../content/rooms/selection';
import { t, translateExact, onLanguageChange } from '../../i18n/locale';
import { roomIcon } from './album-room-icons';
import './room-selection.css';

/** Menu presentation only: the scene owns room selection, reset and start state. */
export class RoomSelection {
  private readonly root = document.createElement('section');
  private readonly back = document.createElement('button');
  private readonly abort = new AbortController();
  private readonly unsubscribe: () => void;
  // eslint-disable-next-line max-lines-per-function -- Auswahl und Rückkehr teilen eine szenengebundene DOM-Lebensdauer und dieselben vorhandenen Menübuttons.
  constructor(
    visible: boolean,
    choose: (id: string) => void,
    returnToRooms: () => void,
    openMenu: () => void,
  ) {
    this.root.className = 'room-selection';
    this.root.inert = true;
    this.back.className = 'ui-button room-selection-return';
    this.back.type = 'button';
    this.back.hidden = true;
    const options = { signal: this.abort.signal };

    this.back.addEventListener('click', returnToRooms, options);
    this.root.addEventListener('keydown', this.key, options);
    this.root.addEventListener('keyup', this.key, options);
    this.root.addEventListener(
      'click',
      (event) => {
        if ((event.target as Element).closest('[data-rooms-menu]')) return openMenu();
        const id = (event.target as Element).closest<HTMLButtonElement>('[data-room-start]')
          ?.dataset.roomStart;

        if (id && playableRoom(id)) choose(id);
      },
      options,
    );
    document.getElementById('play-area')?.before(this.root);
    document.getElementById('game')?.append(this.back);
    this.unsubscribe = onLanguageChange(() => this.refresh());
    this.refresh();
    this.setVisible(visible);
  }

  get opened() {
    return !this.root.hidden;
  }

  enable() {
    this.root.inert = false;

    if (this.opened && !document.documentElement.classList.contains('menu-open'))
      this.root.querySelector<HTMLButtonElement>('[data-room-start]')?.focus();
  }

  private readonly key = (event: KeyboardEvent) => {
    if (!['Escape', 'F2'].includes(event.code)) event.stopPropagation();
  };

  setVisible(visible: boolean) {
    this.root.hidden = !visible;
    document.documentElement.classList.toggle('room-selecting', visible);
  }

  showReturn(visible: boolean) {
    this.back.hidden = !visible || this.opened;
  }

  private refresh() {
    const focused = this.root.contains(document.activeElement);

    this.root.setAttribute('aria-label', t('roomsTitle'));
    this.root.innerHTML = markup();
    this.back.textContent = t('roomsBack');

    if (focused) this.root.querySelector<HTMLButtonElement>('[data-room-start]')?.focus();
  }

  destroy() {
    this.setVisible(false);
    this.abort.abort();
    this.unsubscribe();
    this.root.remove();
    this.back.remove();
  }
}

function roomCard(choice: (typeof ROOM_CHOICES)[number]) {
  const playable = Boolean(choice.definition);
  const picture = playable
    ? `<img src="${preview}" alt="${t('roomsPreview')}" width="936" height="527">`
    : roomIcon(choice.id);

  return `<button type="button" class="room-choice${playable ? ' room-choice-selected' : ''}" ${playable ? `data-room-choice="${choice.id}" aria-pressed="true"` : 'disabled'}>
    <span class="room-choice-picture">${picture}</span><span class="room-choice-copy"><strong>${translateExact(choice.name)}</strong><span>${t(playable ? 'roomsAvailable' : 'roomsLater')}</span></span></button>`;
}

function markup() {
  const selected = ROOM_CHOICES.find((choice) => choice.definition);

  return `<div class="room-selection-heading"><h2>${t('roomsTitle')}</h2><button type="button" class="ui-button" data-rooms-menu>${t('menuBack')}</button></div><div class="room-choices">${ROOM_CHOICES.map(roomCard).join('')}</div>
    <div class="room-selection-start"><button type="button" class="ui-button" data-room-start="${selected?.id ?? ''}" ${selected ? '' : 'disabled'}>${t('roomsEnter')}</button></div>`;
}

import { closeButtonMarkup } from '../../ui/button';
import { albumEntries } from '../../content/album';
import type { AlbumEntry, AlbumRoom } from '../../content/album/discovery';
import { albumCollection } from '../../settings/album';
import { t, onLanguageChange } from '../../i18n/locale';
import {
  albumPage,
  albumPagination,
  ALBUM_PAGE_SIZE,
  albumTabs,
  albumTile,
  ALBUM_ROOMS,
  roomName,
  escape,
} from './album-markup';
import './album.css';

export class AlbumView {
  private readonly root = document.createElement('dialog');
  private readonly abort = new AbortController();
  private readonly compact = window.matchMedia('(max-height: 550px) and (orientation: landscape)');
  private pageSize = this.compact.matches ? 6 : ALBUM_PAGE_SIZE;
  private readonly entries: readonly AlbumEntry[] = albumEntries(
    import.meta.env.DEV || import.meta.env.MODE === 'e2e',
  );

  private readonly unsubscribe: () => void;
  private readonly language: () => void;
  private room: AlbumRoom = 'living-room';
  private selected?: string;
  private confirming = false;
  private page = 0;
  private detail = false;

  // eslint-disable-next-line max-lines-per-function -- Dialog, Fokusgrenze und sämtliche Ressourcen teilen eine szenengebundene Lebensdauer.
  constructor(private readonly onClose: () => void) {
    this.root.className = 'album-dialog';
    document.body.append(this.root);
    const options = { signal: this.abort.signal };

    this.compact.addEventListener('change', () => this.resizePages(), options);
    this.root.addEventListener('click', (event) => this.click(event), options);
    this.root.addEventListener(
      'cancel',
      (event) => {
        event.preventDefault();
        this.close();
      },
      options,
    );
    this.root.addEventListener('keydown', (event) => this.key(event), options);
    this.root.addEventListener('keyup', (event) => event.stopPropagation(), options);
    this.unsubscribe = albumCollection.subscribe(() => this.refresh());
    this.language = onLanguageChange(() => this.refresh());
  }

  get opened() {
    return this.root.open;
  }

  open() {
    if (this.opened) return;
    this.confirming = false;
    this.render();
    this.root.showModal();
  }

  close() {
    this.root.close();
    this.onClose();
  }

  private refresh() {
    if (this.opened) this.render();
  }

  private resizePages() {
    const selected = this.visibleEntries().findIndex((entry) => entry.id === this.selected);
    const anchor = this.detail && selected >= 0 ? selected : this.page * this.pageSize;

    this.pageSize = this.compact.matches ? 6 : ALBUM_PAGE_SIZE;
    this.page = Math.floor(anchor / this.pageSize);
    this.refresh();
  }

  private visibleEntries() {
    return this.entries.filter((entry) => entry.rooms.includes(this.room));
  }

  // eslint-disable-next-line max-lines-per-function -- Re-Render erhält den Fokus und zeigt Metadaten ausschließlich für bereits freigeschaltete IDs.
  private render() {
    const focus = (document.activeElement as HTMLElement | null)?.dataset.focus;
    const snapshot = albumCollection.snapshot();
    const found = new Set(
      snapshot.discovered.filter((id) => this.entries.some((entry) => entry.id === id)),
    );
    const entries = this.visibleEntries();
    const selected =
      entries.find((entry) => entry.id === this.selected && found.has(entry.id)) ??
      entries.find((entry) => found.has(entry.id));

    this.selected = selected?.id;
    this.root.setAttribute('aria-label', t('albumTitle'));
    this.root.dataset.detail = String(this.detail);
    this.root.innerHTML = `<header class="popup-heading">${closeButtonMarkup(t('albumClose'), 'data-action="close" data-focus="close"')}<div><span class="album-eyebrow">PIXEL’S WORLD</span><h2>${t('albumTitle')}</h2><p class="album-overall">${t('albumOverall', { found: found.size, total: this.entries.length })}</p></div></header>
      ${albumTabs(this.room, this.entries)}
      <div id="album-room" role="tabpanel" aria-labelledby="album-tab-${this.room}">${this.roomMarkup(entries, found, selected)}</div>
      <footer>${this.resetMarkup()}${this.storageMessage(snapshot.storage)}</footer>`;

    if (focus) this.root.querySelector<HTMLElement>(`[data-focus="${focus}"]`)?.focus();
  }

  // eslint-disable-next-line max-lines-per-function -- Kapitel, Zähler und eine begrenzte Objektseite bilden einen gemeinsamen Buchaufbau.
  private roomMarkup(
    entries: readonly AlbumEntry[],
    found: ReadonlySet<string>,
    selected?: AlbumEntry,
  ) {
    if (!entries.length)
      return `<section class="album-empty"><h3>${escape(roomName(this.room))}</h3><p>${t('albumEmptyRoom')}</p></section>`;
    const count = entries.filter((entry) => found.has(entry.id)).length;
    const pages = Math.ceil(entries.length / this.pageSize);

    this.page = Math.max(0, Math.min(this.page, pages - 1));
    const offset = this.page * this.pageSize;
    const tiles = entries.slice(offset, offset + this.pageSize);

    return `<div class="album-spread">${albumPage(selected)}<section class="album-index"><div class="album-index-header"><h3>${escape(roomName(this.room))}</h3><p class="album-progress" aria-live="polite">${t('albumProgress', { found: count, total: entries.length })}</p></div><div class="album-grid">${tiles.map((entry, index) => albumTile(entry, index + offset, found, selected?.id)).join('')}</div>${albumPagination(this.page, pages)}</section></div>`;
  }

  private storageMessage(status: string) {
    const key = {
      unavailable: 'albumStorageUnavailable',
      recovered: 'albumStorageRecovered',
      newer: 'albumStorageNewer',
    } as const;

    return status in key ? `<p role="status">${t(key[status as keyof typeof key])}</p>` : '';
  }

  private resetMarkup() {
    if (!this.confirming)
      return `<button type="button" class="ui-button" data-action="reset" data-focus="reset">${t('albumReset')}</button>`;

    return `<p id="album-reset-question" role="status">${t('albumResetQuestion')}</p><div class="album-reset-actions"><button type="button" class="ui-button" data-action="confirm" data-focus="confirm" aria-describedby="album-reset-question">${t('albumResetConfirm')}</button><button type="button" class="ui-button" data-action="cancel" data-focus="cancel">${t('albumCancel')}</button></div>`;
  }

  // eslint-disable-next-line max-lines-per-function -- Delegierte Aktionen dürfen ausschließlich Kapitel, Auswahl und ausdrücklich bestätigten Album-Reset ändern.
  private click(event: MouseEvent) {
    const target =
      event.target instanceof Element ? event.target.closest<HTMLButtonElement>('button') : null;

    if (!target) return;
    target.focus({ preventScroll: true });

    if (target.dataset.action) {
      this.action(target.dataset.action);

      return;
    }

    if (ALBUM_ROOMS.includes(target.dataset.room as AlbumRoom))
      this.selectRoom(target.dataset.room as AlbumRoom);

    this.selectEntry(target.dataset.entry);

    this.confirming = false;
    this.render();
    const back = this.root.querySelector<HTMLElement>('.album-overview');

    if (this.detail && back?.getClientRects().length) back.focus();
  }

  private selectEntry(index?: string) {
    if (index === undefined) return;
    const entry = this.visibleEntries()[Number(index)];

    if (!entry || !albumCollection.snapshot().discovered.includes(entry.id)) return;
    this.selected = entry.id;
    this.detail = true;
  }

  // eslint-disable-next-line max-lines-per-function -- Bestätigter Reset, Dialogschluss und Fokuswiederherstellung bleiben ein zusammenhängender Bedienablauf.
  private action(action: string) {
    if (action === 'close') {
      this.close();

      return;
    }

    if (action === 'overview') {
      this.overview();

      return;
    }

    if (this.pageAction(action)) return;

    if (action === 'confirm' && this.confirming) {
      this.detail = false;
      albumCollection.reset();
    }

    this.confirming = action === 'reset';
    this.render();
    this.root
      .querySelector<HTMLElement>(
        this.confirming ? '[data-action="cancel"]' : '[data-action="reset"]',
      )
      ?.focus();
  }

  private overview() {
    this.detail = false;
    this.render();
    this.root.querySelector<HTMLElement>('.album-tile[aria-pressed="true"]')?.focus();
  }

  // eslint-disable-next-line max-lines-per-function -- Seitenwechsel begrenzen die Objektliste und halten den Tastaturfokus an einer bedienbaren Seitentaste.
  private pageAction(action: string) {
    const step = ({ 'page-next': 1, 'page-previous': -1 } as Record<string, number>)[action];

    if (!step) return false;
    this.page += step;
    this.render();
    const target =
      this.root.querySelector<HTMLElement>(`[data-action="${action}"]:not(:disabled)`) ??
      this.root.querySelector<HTMLElement>('.album-pagination button:not(:disabled)');

    target?.focus();

    return true;
  }

  private key(event: KeyboardEvent) {
    event.stopPropagation();
    this.tabKey(event);

    if (event.code === 'Escape') {
      event.preventDefault();
      this.close();
    }
  }

  private selectRoom(room: AlbumRoom) {
    this.room = room;
    this.page = 0;
    this.detail = false;
  }

  // eslint-disable-next-line max-lines-per-function -- Raumreihenfolge, Seitenauswahl und Fokus wechseln gemeinsam über die Pfeiltasten.
  private tabKey(event: KeyboardEvent) {
    if (!(event.target instanceof HTMLElement) || event.target.getAttribute('role') !== 'tab')
      return;

    if (!['ArrowLeft', 'ArrowRight'].includes(event.code)) return;
    event.preventDefault();
    const index = ALBUM_ROOMS.indexOf(this.room);

    this.selectRoom(
      ALBUM_ROOMS[(index + (event.code === 'ArrowRight' ? 1 : 3)) % ALBUM_ROOMS.length],
    );
    this.render();
    this.root.querySelector<HTMLElement>(`[data-room="${this.room}"]`)?.focus();
  }

  destroy() {
    this.abort.abort();
    this.unsubscribe();
    this.language();
    this.root.close();
    this.root.remove();
  }
}

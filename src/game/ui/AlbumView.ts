import { ACHIEVEMENTS } from '../../content/achievements';
import { achievementsMarkup } from './achievement-markup';
import { closeButtonMarkup } from '../../ui/button';
import { albumEntries } from '../../content/album';
import type { AlbumEntry } from '../../content/album/discovery';
import { albumCollection } from '../../settings/album';
import { t, onLanguageChange } from '../../i18n/locale';
import {
  albumPage,
  albumPagination,
  ALBUM_PAGE_SIZE,
  albumTabs,
  albumTile,
  ALBUM_CHAPTERS,
  type AlbumChapter,
  roomName,
  escape,
} from './album-markup';
import './album.css';
import './achievements.css';

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
  private room: AlbumChapter = 'living-room';
  private selected?: string;
  private selectedAchievement = ACHIEVEMENTS[0].id;
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
    this.render();
    this.root.showModal();
  }

  close() {
    this.root.close();
    this.onClose();
  }

  private refresh() {
    if (this.room !== 'achievements' && !albumCollection.snapshot().discovered.length)
      this.detail = false;

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
    const room = this.room;

    return room === 'achievements'
      ? []
      : this.entries.filter((entry) => entry.rooms.includes(room));
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

    if (this.room !== 'achievements') this.selected = selected?.id;
    this.root.setAttribute('aria-label', t('albumTitle'));
    this.root.dataset.detail = String(this.detail);
    this.root.dataset.chapter = this.room;
    const message = this.storageMessage(snapshot.storage);

    this.root.innerHTML = `<header class="popup-heading">${closeButtonMarkup(t('albumClose'), 'data-action="close" data-focus="close"')}<div><span class="album-eyebrow">PIXEL’S WORLD</span><h2>${t('albumTitle')}</h2><p class="album-overall">${this.overall(found.size)}${this.sessionHint(snapshot.storage)}</p></div></header>
      ${this.bookmarks()}
      <div id="album-room" role="tabpanel" aria-labelledby="album-tab-${this.room}">${this.chapterMarkup(entries, found, selected)}</div>
      ${message ? `<footer>${message}</footer>` : ''}`;

    if (focus) this.root.querySelector<HTMLElement>(`[data-focus="${focus}"]`)?.focus();
  }

  private bookmarks() {
    return albumTabs(this.room, this.entries, this.detail && this.compact.matches);
  }

  private overall(found: number) {
    return this.room === 'achievements'
      ? t('achievementRounds', { count: albumCollection.achievementSnapshot().reconciliations })
      : t('albumOverall', { found, total: this.entries.length });
  }

  private chapterMarkup(
    entries: readonly AlbumEntry[],
    found: ReadonlySet<string>,
    selected?: AlbumEntry,
  ) {
    return this.room === 'achievements'
      ? achievementsMarkup(albumCollection.achievementSnapshot(), this.selectedAchievement)
      : this.roomMarkup(entries, found, selected);
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

  private sessionHint(status: string) {
    return this.compact.matches && status === 'session' ? ` · ${t('albumSession')}` : '';
  }

  private storageMessage(status: string) {
    if (this.sessionHint(status)) return '';

    const key = {
      session: 'albumSession',
      unavailable: 'albumStorageUnavailable',
      recovered: 'albumStorageRecovered',
      newer: 'albumStorageNewer',
    } as const;

    return status in key ? `<p role="status">${t(key[status as keyof typeof key])}</p>` : '';
  }

  // eslint-disable-next-line max-lines-per-function -- Delegierte Aktionen ändern nur Kapitel und Auswahl oder schließen die Ansicht.
  private click(event: MouseEvent) {
    const target =
      event.target instanceof Element ? event.target.closest<HTMLButtonElement>('button') : null;

    if (!target) return;
    target.focus({ preventScroll: true });

    if (target.dataset.action) {
      this.action(target.dataset.action);

      return;
    }

    if (ALBUM_CHAPTERS.includes(target.dataset.room as AlbumChapter))
      this.selectRoom(target.dataset.room as AlbumChapter);

    this.selectEntry(target.dataset.entry);
    this.selectAchievement(target.dataset.achievement);

    this.render();
    const back = this.root.querySelector<HTMLElement>('.album-overview');

    if (this.detail && back?.getClientRects().length) back.focus();
  }

  private selectAchievement(id?: string) {
    if (!id || !ACHIEVEMENTS.some((entry) => entry.id === id)) return;
    this.selectedAchievement = id;
    this.detail = true;
  }

  private selectEntry(index?: string) {
    if (index === undefined) return;
    const entry = this.visibleEntries()[Number(index)];

    if (!entry || !albumCollection.snapshot().discovered.includes(entry.id)) return;
    this.selected = entry.id;
    this.detail = true;
  }

  // eslint-disable-next-line max-lines-per-function -- Dialogschluss, Übersicht und Seitenwechsel teilen denselben Aktionspfad.
  private action(action: string) {
    if (action === 'close') {
      this.close();

      return;
    }

    if (action === 'overview') {
      this.overview();

      return;
    }

    this.pageAction(action);
  }

  private overview() {
    this.detail = false;
    this.render();
    this.root
      .querySelector<HTMLElement>(
        '.album-tile[aria-pressed="true"], .achievement-tile[aria-pressed="true"]',
      )
      ?.focus();
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

  private selectRoom(room: AlbumChapter) {
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
    const index = ALBUM_CHAPTERS.indexOf(this.room);

    this.selectRoom(
      ALBUM_CHAPTERS[
        (index + (event.code === 'ArrowRight' ? 1 : ALBUM_CHAPTERS.length - 1)) %
          ALBUM_CHAPTERS.length
      ],
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

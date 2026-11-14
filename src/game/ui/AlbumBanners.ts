import { ACHIEVEMENTS } from '../../content/achievements';
import { ACHIEVEMENT_ART } from './achievement-markup';
import './album-banners.css';
import { motionPreferences } from '../../settings/motion';
import { AlbumBannerQueue } from '../album/banner-queue';
import { INTERACTABLE_ALBUM } from '../../content/album';
import { currentLanguage, t } from '../../i18n/locale';
import { ALBUM_ART } from './album-art';

const BANNER_ENTRIES = [
  ...Object.values(INTERACTABLE_ALBUM).map((entry) => ({
    id: entry.id,
    name: entry.name,
    image: ALBUM_ART[entry.asset],
    label: 'albumEntryUnlocked' as const,
  })),
  ...ACHIEVEMENTS.map((entry) => ({
    id: entry.id,
    name: entry.name,
    image: ACHIEVEMENT_ART[entry.art],
    label: 'achievementNew' as const,
  })),
];

/** A scene-owned, non-interactive announcement inside the existing game field. */
export class AlbumBanners {
  private readonly queue = new AlbumBannerQueue();
  private readonly root = document.createElement('aside');
  private readonly art = document.createElement('img');
  private readonly label = document.createElement('span');
  private readonly title = document.createElement('strong');
  private rendered = '';

  // eslint-disable-next-line max-lines-per-function -- Ein einzelner Live-Bereich und seine Bild-/Textknoten teilen dieselbe Szenenlebensdauer.
  constructor() {
    this.root.className = 'album-banner';
    this.root.hidden = true;
    this.root.setAttribute('role', 'status');
    this.root.setAttribute('aria-live', 'polite');
    this.root.setAttribute('aria-atomic', 'true');
    this.art.alt = '';
    const text = document.createElement('div');

    text.append(this.label, this.title);
    this.root.append(this.art, text);
    document.getElementById('game')?.append(this.root);
  }

  show(entries: readonly string[], elapsed: number) {
    if (!this.queue.start(entries)) this.queue.advance(elapsed);
    this.root.dataset.reduced = String(motionPreferences.snapshot().reduced);
    this.render();
  }

  // eslint-disable-next-line max-lines-per-function -- Nur ein neuer Eintrag oder Sprachwechsel verändert den Live-Bereich; Frames erzeugen keine Wiederholungen.
  private render() {
    const id = this.queue.current();
    const key = `${id}/${currentLanguage()}`;

    if (key === this.rendered) return;
    this.rendered = key;
    const entry = BANNER_ENTRIES.find((entry) => entry.id === id);

    this.root.hidden = !entry;
    this.root.dataset.entry = entry?.id ?? '';
    this.label.textContent = entry ? t(entry.label) : '';
    this.title.textContent = entry?.name[currentLanguage()] ?? '';

    if (entry) this.art.src = entry.image;
    else this.art.removeAttribute('src');
  }

  destroy() {
    this.root.remove();
  }
}

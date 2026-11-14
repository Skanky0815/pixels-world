import { SHELF_TARGET_NAMES } from '../../content/achievement-categories.ts';
import { ACHIEVEMENT_ROOMS } from '../../content/achievement-rooms.ts';
import { INTERACTABLE_ALBUM } from '../../content/album/index.ts';
import {
  ACHIEVEMENTS,
  DESTRUCTION_TARGETS,
  type AchievementDefinition,
} from '../../content/achievements.ts';
import type { AchievementData } from '../album/achievements.ts';
import { currentLanguage, t } from '../../i18n/locale.ts';
import { escape, albumPagination } from './album-markup.ts';

export const ACHIEVEMENT_ART = {
  love: new URL('../../../assets/community/slack-v1/pixel_love.png', import.meta.url).href,
  chaos: new URL('../../../assets/community/slack-v1/pixel_chaos.png', import.meta.url).href,
} as const;

export const ACHIEVEMENT_PAGE_SIZE = 4;

export function achievementCount(entry: AchievementDefinition, data: AchievementData) {
  if (entry.targets)
    return entry.targets.filter((id) => achievementTargets(entry, data).includes(id)).length;

  return Math.min(
    entry.threshold,
    entry.metric === 'reconciliations' ? data.reconciliations : data.ruined.length,
  );
}

export function achievementOverall(data: AchievementData) {
  return t('achievementOverall', { found: data.unlocked.length, total: ACHIEVEMENTS.length });
}

// eslint-disable-next-line max-lines-per-function -- Auswahl nur freigespielter Erfolge und begrenzte Buchseiten bilden eine gemeinsame Ansicht.
export function achievementsMarkup(data: AchievementData, selected: string, page = 0) {
  const unlocked = ACHIEVEMENTS.filter((entry) => data.unlocked.includes(entry.id));
  const visible = ACHIEVEMENTS.slice(
    page * ACHIEVEMENT_PAGE_SIZE,
    (page + 1) * ACHIEVEMENT_PAGE_SIZE,
  );
  const entry = unlocked.find((entry) => entry.id === selected) ?? unlocked[0];

  return `<div class="album-spread achievements-spread">
    ${entry ? achievementStory(entry, data) : achievementPlaceholder()}
    <section class="achievement-index"><div class="album-index-header"><h3>${t('albumAchievements')}</h3><p class="album-progress" aria-label="${escape(achievementOverall(data))}"><span class="achievement-total-wide">${achievementOverall(data)}</span><span class="achievement-total-compact" aria-hidden="true">${data.unlocked.length} / ${ACHIEVEMENTS.length}</span></p></div>
    <div class="achievement-list">${visible.map((item) => achievementTile(item, data, entry?.id)).join('')}</div>
    ${albumPagination(page, Math.ceil(ACHIEVEMENTS.length / ACHIEVEMENT_PAGE_SIZE))}</section></div>`;
}

function progress(entry: AchievementDefinition, data: AchievementData) {
  const key = {
    variants: 'achievementVariants',
    rooms: 'achievementRooms',
    all: 'achievementGoals',
    reconciliations: 'achievementReconciliations',
    destruction: 'achievementObjects',
  } as const;

  return t(key[entry.metric], { count: achievementCount(entry, data), total: entry.threshold });
}

function achievementTile(entry: AchievementDefinition, data: AchievementData, selected?: string) {
  const earned = data.unlocked.includes(entry.id);

  return `<button type="button" class="achievement-tile" ${earned ? '' : 'disabled'} data-achievement="${entry.id}" data-focus="${entry.id}" aria-pressed="${entry.id === selected}"><span class="achievement-mark" aria-hidden="true">${earned ? '✓' : '○'}</span><strong>${escape(entry.name[currentLanguage()])}</strong><small>${earned ? t('achievementUnlocked') : progress(entry, data)}</small></button>`;
}

// eslint-disable-next-line max-lines-per-function -- Zugänglicher Status, Fortschritt und feste Objektziele teilen eine Detailansicht ohne zweite Fortschrittsquelle.
function achievementStory(entry: AchievementDefinition, data: AchievementData) {
  const lang = currentLanguage();
  const earned = data.unlocked.includes(entry.id);
  const count = achievementCount(entry, data);
  const targets = entry.metric !== 'reconciliations' ? targetList(data, entry) : '';

  return `<section class="achievement-story" data-metric="${entry.metric}">
    <button type="button" class="album-overview ui-button" data-action="overview" data-focus="achievement-overview">${t('albumOverview')}</button>
    <div class="achievement-heading"><img src="${ACHIEVEMENT_ART[entry.art]}" alt=""><div><p class="achievement-state">${earned ? `✓ ${t('achievementUnlocked')}` : t('achievementLocked')}</p><h3>${escape(entry.name[lang])}</h3></div></div>
    <p class="achievement-description">${escape(entry.description[lang])}</p>
    <progress max="${entry.threshold}" value="${count}" aria-label="${escape(progress(entry, data))}"></progress>
    <p class="achievement-count">${progress(entry, data)}</p>${targets}
    <blockquote>${escape(entry.quote[lang])}<cite>— Sara</cite></blockquote></section>`;
}

function targetName(id: string) {
  return (
    ACHIEVEMENTS.find((entry) => entry.id === id)?.name ??
    ACHIEVEMENT_ROOMS.find((room) => room.id === id.split('/')[1])?.name ??
    Object.values(INTERACTABLE_ALBUM).find((entry) => entry.id === id)?.name ??
    SHELF_TARGET_NAMES[id] ?? { de: id, en: id }
  );
}

function targetList(data: AchievementData, entry: AchievementDefinition) {
  const targets = entry.targets
    ? (entry.targets ?? []).map((id) => ({ id, name: targetName(id) }))
    : DESTRUCTION_TARGETS;
  const found = achievementTargets(entry, data);

  return `<ul class="achievement-targets" aria-label="${t(entry.metric === 'rooms' ? 'achievementRoomTargets' : entry.metric === 'all' ? 'achievementGoalTargets' : 'achievementObjectTargets')}">${targets.map((target) => `<li><span aria-hidden="true">${found.includes(target.id) ? '✓' : '○'}</span> <span class="sr-only">${found.includes(target.id) ? t('achievementDone') : t('achievementMissing')}: </span>${escape(target.name[currentLanguage()])}</li>`).join('')}</ul>`;
}

function achievementTargets(entry: AchievementDefinition, data: AchievementData) {
  if (entry.metric === 'all') return data.unlocked;

  if (entry.metric === 'rooms') return data.completedRooms ?? [];

  return entry.metric === 'variants' ? (data.ruinedVariants ?? []) : data.ruined;
}

function achievementPlaceholder() {
  return `<section class="achievement-story achievement-empty"><div class="album-mystery" aria-hidden="true">★</div><h3>${t('achievementEmptyTitle')}</h3><p>${t('achievementEmptyText')}</p></section>`;
}

import {
  ACHIEVEMENTS,
  DESTRUCTION_TARGETS,
  type AchievementDefinition,
} from '../../content/achievements.ts';
import type { AchievementData } from '../album/achievements.ts';
import { currentLanguage, t } from '../../i18n/locale.ts';
import { escape } from './album-markup.ts';

export const ACHIEVEMENT_ART = {
  love: new URL('../../../assets/community/slack-v1/pixel_love.png', import.meta.url).href,
  chaos: new URL('../../../assets/community/slack-v1/pixel_chaos.png', import.meta.url).href,
} as const;

export function achievementCount(entry: AchievementDefinition, data: AchievementData) {
  return Math.min(
    entry.threshold,
    entry.metric === 'reconciliations' ? data.reconciliations : data.ruined.length,
  );
}

export function achievementOverall(data: AchievementData) {
  return t('achievementOverall', { found: data.unlocked.length, total: ACHIEVEMENTS.length });
}

export function achievementsMarkup(data: AchievementData, selected: string) {
  const entry = ACHIEVEMENTS.find((entry) => entry.id === selected) ?? ACHIEVEMENTS[0];

  return `<div class="album-spread achievements-spread">
    ${achievementStory(entry, data)}
    <section class="achievement-index"><div class="album-index-header"><h3>${t('albumAchievements')}</h3><p class="album-progress" aria-label="${escape(achievementOverall(data))}"><span class="achievement-total-wide">${achievementOverall(data)}</span><span class="achievement-total-compact" aria-hidden="true">${data.unlocked.length} / ${ACHIEVEMENTS.length}</span></p></div>
    <div class="achievement-list">${ACHIEVEMENTS.map((entry) => achievementTile(entry, data, selected)).join('')}</div>
    </section></div>`;
}

function progress(entry: AchievementDefinition, data: AchievementData) {
  const key =
    entry.metric === 'reconciliations' ? 'achievementReconciliations' : 'achievementObjects';

  return t(key, { count: achievementCount(entry, data), total: entry.threshold });
}

function achievementTile(entry: AchievementDefinition, data: AchievementData, selected: string) {
  const earned = data.unlocked.includes(entry.id);

  return `<button type="button" class="achievement-tile" data-achievement="${entry.id}" data-focus="${entry.id}" aria-pressed="${entry.id === selected}"><span class="achievement-mark" aria-hidden="true">${earned ? '✓' : '○'}</span><strong>${escape(entry.name[currentLanguage()])}</strong><small>${earned ? t('achievementUnlocked') : progress(entry, data)}</small></button>`;
}

// eslint-disable-next-line max-lines-per-function -- Zugänglicher Status, Fortschritt und feste Objektziele teilen eine Detailansicht ohne zweite Fortschrittsquelle.
function achievementStory(entry: AchievementDefinition, data: AchievementData) {
  const lang = currentLanguage();
  const earned = data.unlocked.includes(entry.id);
  const count = achievementCount(entry, data);
  const targets = entry.metric === 'destruction' ? targetList(data) : '';

  return `<section class="achievement-story" data-metric="${entry.metric}">
    <button type="button" class="album-overview ui-button" data-action="overview" data-focus="achievement-overview">${t('albumOverview')}</button>
    <div class="achievement-heading"><img src="${ACHIEVEMENT_ART[entry.art]}" alt=""><div><p class="achievement-state">${earned ? `✓ ${t('achievementUnlocked')}` : t('achievementLocked')}</p><h3>${escape(entry.name[lang])}</h3></div></div>
    <p class="achievement-description">${escape(entry.description[lang])}</p>
    <progress max="${entry.threshold}" value="${count}" aria-label="${escape(progress(entry, data))}"></progress>
    <p class="achievement-count">${progress(entry, data)}</p>${targets}
    <blockquote>${escape(entry.quote[lang])}<cite>— Sara</cite></blockquote></section>`;
}

function targetList(data: AchievementData) {
  return `<ul class="achievement-targets" aria-label="${t('achievementObjectTargets')}">${DESTRUCTION_TARGETS.map((target) => `<li><span aria-hidden="true">${data.ruined.includes(target.id) ? '✓' : '○'}</span> <span class="sr-only">${data.ruined.includes(target.id) ? t('achievementDone') : t('achievementMissing')}: </span>${escape(target.name[currentLanguage()])}</li>`).join('')}</ul>`;
}

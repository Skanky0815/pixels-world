import { t } from '../../i18n/locale';

// eslint-disable-next-line max-lines-per-function -- Statische Menüseiten und vorhandene Einstellungen bilden einen gemeinsamen deklarativen Aufbau.
export function menuMarkup() {
  return `<header class="menu-heading"><button type="button" class="ui-button" data-menu-back data-menu-text="menuBack"></button><h2 data-menu-heading></h2></header>
    <div class="menu-welcome" data-menu-view="home"><img src="${import.meta.env.BASE_URL}icons/pixel-192.png" width="192" height="192" alt="Pixel"><p data-menu-text="menuWelcome"></p></div>
    <div class="menu-settings" data-menu-view="settings" hidden>
    <section data-pause-updates></section>
    <section><label for="pause-difficulty"><span data-menu-text="difficultyLabel"></span></label>
      <select id="pause-difficulty" data-difficulty aria-describedby="difficulty-help difficulty-current">
        <option value="easy" data-menu-text="difficultyEasy"></option>
        <option value="normal" data-menu-text="difficultyNormal"></option>
        <option value="hard" data-menu-text="difficultyHard"></option>
      </select>
      <p id="difficulty-help" class="difficulty-help" aria-live="polite"></p>
      <p id="difficulty-current" data-difficulty-current></p></section>
    <section><h3 data-menu-text="language"></h3><div data-pause-language></div></section>
    <section><h3 data-menu-text="audioSettings"></h3>
      <label for="pause-master-volume"><span data-menu-text="masterVolume"></span><output data-audio-value="master"></output>
        <input id="pause-master-volume" type="range" data-audio="master" min="0" max="100" step="1"></label>
      <label for="pause-effects-volume"><span data-menu-text="effectsVolume"></span><output data-audio-value="effects"></output>
        <input id="pause-effects-volume" type="range" data-audio="effects" min="0" max="100" step="1"></label>
    </section>
    <section><label class="motion-setting"><input type="checkbox" data-reduce-motion><span data-menu-text="reduceMotion"></span></label>
      <p data-system-motion data-menu-text="systemMotion" hidden></p></section>
    <section data-pause-storage></section>
    <section data-pause-album-reset></section>
    </div>
    <section data-menu-view="information" hidden><div data-game-information></div></section>
    <section data-menu-view="confirm" hidden><p data-menu-text="menuConfirmBody"></p><div class="menu-confirm-actions"><button type="button" class="ui-button" data-menu-cancel data-menu-text="albumCancel"></button><button type="button" class="ui-button" data-menu-confirm data-menu-text="menuConfirmAction"></button></div></section>
    <nav class="pause-actions" aria-label="${t('mainMenu')}">
      <button type="button" class="ui-button menu-primary" data-menu-play data-menu-text="menuPlay"></button>
      <button type="button" class="ui-button menu-primary" data-pause-resume data-menu-text="menuResume"></button>
      <button type="button" class="ui-button" data-pause-album aria-haspopup="dialog"></button>
      <button type="button" class="ui-button" data-menu-settings data-menu-text="gameOptions"></button>
      <a class="ui-button" href="./help.html" target="_blank" rel="noopener noreferrer" data-menu-text="menuHelp"></a>
      <button type="button" class="ui-button" data-menu-information data-menu-text="gameInformation"></button>
      <button type="button" class="ui-button" data-pause-rooms data-menu-text="roomsBack"></button>
      <button type="button" class="ui-button" data-pause-restart data-menu-text="newRoundLabel"></button>
      <a class="ui-button" href="./" data-menu-text="quitGame"></a>
    </nav>`;
}

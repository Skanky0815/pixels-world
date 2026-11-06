import type { ResolvedGoal } from '../domain/main-goal';
import bannerUrl from '../../../assets/banner.png?url';

/** Responsive introduction only; gameplay and keyboard transitions remain scene-owned. */
export class StartScreen {
  private readonly root: HTMLElement;

  // eslint-disable-next-line max-lines-per-function -- Die zusammengehörige DOM-Initialisierung bindet Einführung, Zieltext und Sichtbarkeit atomar an den Spielbereich.
  constructor(visible: boolean, goal: ResolvedGoal) {
    const host = document.getElementById('game');

    if (!host) throw new Error('Game host missing');
    this.root = document.createElement('section');
    this.root.className = 'start-screen';
    this.root.setAttribute('aria-label', 'Spieleinführung');
    this.root.innerHTML = introMarkup();
    this.describeGoal(goal);
    this.root.hidden = !visible;
    host.append(this.root);
  }

  private describeGoal(goal: ResolvedGoal) {
    const text = this.root.querySelector('.start-goal-text');
    const seconds = (goal.dwellMs / 1000).toLocaleString('de-DE');

    if (text)
      text.textContent = `${goal.label}: ${goal.motivation} (${seconds} Sekunden ohne Eingabe.)`;
  }

  hide() {
    this.root.hidden = true;
  }

  snapshot() {
    return Object.freeze({ visible: !this.root.hidden });
  }

  destroy() {
    this.root.remove();
  }
}

// eslint-disable-next-line max-lines-per-function -- Die statische zugängliche Einführung bleibt als vollständiger HTML-Aufbau zusammen lesbar.
function introMarkup() {
  return `<div class="start-copy">
    <img src="${bannerUrl}" alt="Pixel’s World" width="2172" height="724" />
    <h2>Ein Zimmer. Eine Katze. Dein Chaos.</h2>
    <p>Pixel ist allein zu Hause und hat ein Ziel.
    Spring auf Möbel und erkunde das Zimmer – ob dabei Chaos entsteht, entscheidest du.
    Wenn Sara zurückkommt, versuchst du sie mit Schnurren und einer Charmeoffensive zu versöhnen.</p>
    <aside class="start-goal" aria-label="Dein Hauptziel">
      <strong>Dein Hauptziel</strong>
      <p class="start-goal-text"></p>
    </aside>
    <dl>
      <div><dt>← →</dt><dd>Laufen und im Sprung steuern</dd></div>
      <div><dt>Leertaste</dt><dd>Springen und vom Vorhang abspringen</dd></div>
      <div><dt>↑ ↓</dt><dd>Am Vorhang klettern</dd></div>
      <div><dt>R</dt><dd>Runde neu starten</dd></div>
    </dl>
    <p>Bei der Versöhnung: die große Pfeiltaste rechtzeitig drücken.
    Texte liest du in Ruhe und bestätigst mit Leertaste. Bei Fokusverlust pausiert das Spiel.</p>
    <p class="touch-prompt">Die Pfeile bewegen Pixel und steuern die Charmeoffensive.
    „Sprung“ springt. Bei Start und Dialogen heißt die Taste „Weiter“.
    Am Rundenende kannst du mit „Neue Runde“ weiterspielen.</p>
  </div><p class="start-prompt"><span class="keyboard-prompt">Leertaste drücken, um zu starten</span>
  <span class="touch-prompt">„Weiter“ antippen, um zu starten</span></p>`;
}

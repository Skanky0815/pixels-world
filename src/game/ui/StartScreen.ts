import bannerUrl from '../../../assets/banner.png?url';

/** Responsive introduction only; gameplay and keyboard transitions remain scene-owned. */
export class StartScreen {
  private readonly root: HTMLElement;

  constructor(visible: boolean) {
    const host = document.getElementById('game');

    if (!host) throw new Error('Game host missing');
    this.root = document.createElement('section');
    this.root.className = 'start-screen';
    this.root.setAttribute('aria-label', 'Spieleinführung');
    this.root.innerHTML = introMarkup();
    this.root.hidden = !visible;
    host.append(this.root);
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
    <p>Pixel ist allein zu Hause. Spring auf Möbel, entdecke das Zimmer und richte Unfug an.
    Wenn Sara zurückkommt, versuchst du sie mit Schnurren und einer Charmeoffensive zu versöhnen.</p>
    <dl>
      <div><dt>← →</dt><dd>Laufen und im Sprung steuern</dd></div>
      <div><dt>Leertaste</dt><dd>Springen und vom Vorhang abspringen</dd></div>
      <div><dt>↑ ↓</dt><dd>Am Vorhang klettern</dd></div>
      <div><dt>R</dt><dd>Runde neu starten</dd></div>
    </dl>
    <p>Bei der Versöhnung: die große Pfeiltaste rechtzeitig drücken.
    Texte liest du in Ruhe und bestätigst mit Leertaste. Bei Fokusverlust pausiert das Spiel.</p>
  </div><p class="start-prompt">Leertaste drücken, um zu starten</p>`;
}

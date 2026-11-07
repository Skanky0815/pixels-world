import type Phaser from 'phaser';
import { FEEDBACK } from '../../content/feedback';
import { onLanguageChange, t } from '../../i18n/locale';
import { motionPreferences } from '../../settings/motion';
import type { ChaosEvent } from '../domain/chaos-event';
import {
  FeedbackModel,
  type FeedbackState,
  type FeedbackMessage,
  type FeedbackChannel,
} from './feedback-model';
import './game-feedback.css';

export class GameFeedback {
  private readonly root = document.createElement('div');
  private readonly model = new FeedbackModel();
  private readonly nodes = new Map<FeedbackChannel, HTMLElement>();
  private readonly unsubscribe: () => void;
  private readonly unsubscribeMotion: () => void;
  private readonly damage = (event: ChaosEvent) => this.model.damage(event);

  // eslint-disable-next-line max-lines-per-function -- Drei begrenzte Darstellungskanäle und ihre Szenen-/Sprach-/Motion-Bindungen teilen dieselbe Lebensdauer.
  constructor(private readonly scene: Phaser.Scene) {
    this.root.className = 'game-feedback-layer';
    this.root.setAttribute('aria-live', 'polite');

    for (const channel of ['score', 'phase', 'charm'] as const) {
      const node = document.createElement('p');

      node.className = `game-feedback-${channel}`;
      node.hidden = true;
      this.nodes.set(channel, node);
      this.root.append(node);
    }

    document.getElementById('game')?.append(this.root);
    scene.events.on('object-damaged', this.damage);
    this.unsubscribe = onLanguageChange(() => this.render());
    this.unsubscribeMotion = motionPreferences.subscribe(() => this.render());
  }

  advance(delta: number, state: FeedbackState) {
    this.model.advance(delta, state);
    this.render();
  }

  private render() {
    const { messages } = this.model.snapshot();
    const reduced = motionPreferences.snapshot().reduced;

    for (const [channel, node] of this.nodes) renderMessage(node, messages[channel], reduced);
  }

  readable() {
    const messages = this.model.snapshot().messages;
    const message = messages.charm ?? messages.phase ?? messages.score;

    return { text: message ? caption(message) : '', tone: message?.tone ?? 'none' };
  }

  snapshot() {
    return Object.freeze({
      ...this.model.snapshot(),
      reduced: motionPreferences.snapshot().reduced,
      text: this.readable().text,
    });
  }

  destroy() {
    this.scene.events.off('object-damaged', this.damage);
    this.unsubscribe();
    this.unsubscribeMotion();
    this.root.remove();
  }
}

function caption(message: FeedbackMessage) {
  const symbol = message.tone === 'negative' ? '✕' : message.tone === 'positive' ? '✓' : '◆';

  return `${symbol} ${t(message.key, { v0: message.value })}`;
}

// eslint-disable-next-line max-lines-per-function -- Transforms und Transparenz folgen ausschließlich aktiver Präsentationszeit; reduzierte Bewegung bleibt statisch.
function renderMessage(node: HTMLElement, message: FeedbackMessage | undefined, reduced: boolean) {
  node.hidden = !message;

  if (!message) return;
  const text = caption(message);
  const progress = message.elapsedMs / message.durationMs;

  if (node.textContent !== text) node.textContent = text;
  node.dataset.tone = message.tone;
  node.dataset.reduced = String(reduced);
  node.style.transform = reduced ? 'none' : `translateY(${-FEEDBACK.liftPx * progress}px)`;
  node.style.opacity = String(
    reduced ? 1 : Math.min(1, (message.durationMs - message.elapsedMs) / FEEDBACK.fadeMs),
  );
}

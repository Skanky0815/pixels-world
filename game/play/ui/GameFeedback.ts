import type Phaser from 'phaser';
import { FEEDBACK } from '../content/feedback';
import { onLanguageChange, t } from '../../shared/i18n/locale';
import { motionPreferences } from '../settings/motion';
import type { ChaosEvent } from '../domain/chaos-event';
import {
  FeedbackModel,
  mergeDamage,
  type FeedbackState,
  type FeedbackMessage,
  type FeedbackChannel,
} from './feedback-model';
import './game-feedback.css';
import { feedbackOverlap, feedbackPosition } from './feedback-position';

interface PixelAnchor {
  readonly x: number;
  readonly top: number;
  readonly bottom: number;
}

export class GameFeedback {
  private readonly root = document.createElement('div');
  private readonly announcement = document.createElement('span');
  private readonly model = new FeedbackModel();
  private readonly nodes = new Map<FeedbackChannel, HTMLElement>();
  private readonly scoreRows = Array.from({ length: FEEDBACK.scoreGroups }, () =>
    document.createElement('p'),
  );

  private readonly unsubscribe: () => void;
  private readonly unsubscribeMotion: () => void;
  private readonly damage = (event: ChaosEvent, kind?: string) => this.model.damage(event, kind);
  private readonly position = () => this.positionScore();

  // eslint-disable-next-line max-lines-per-function -- Drei begrenzte Darstellungskanäle und ihre Szenen-/Sprach-/Motion-Bindungen teilen dieselbe Lebensdauer.
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly anchor: () => PixelAnchor,
  ) {
    this.root.className = 'game-feedback-layer';
    this.root.setAttribute('aria-live', 'polite');

    for (const channel of ['phase', 'score', 'charm'] as const) {
      const node = document.createElement(channel === 'score' ? 'div' : 'p');

      node.className = `game-feedback-${channel}`;
      node.hidden = true;

      if (channel === 'score') {
        node.append(...this.scoreRows, this.announcement);

        for (const row of this.scoreRows) row.setAttribute('aria-hidden', 'true');
        node.setAttribute('aria-live', 'off');
      }

      this.nodes.set(channel, node);
      this.root.append(node);
    }

    this.announcement.className = 'game-feedback-announcement';
    this.announcement.setAttribute('aria-atomic', 'true');
    this.announcement.setAttribute('aria-live', 'polite');
    document.getElementById('game')?.append(this.root);
    scene.events.on('object-damaged', this.damage);
    scene.events.on('render', this.position);
    this.unsubscribe = onLanguageChange(() => this.render());
    this.unsubscribeMotion = motionPreferences.subscribe(() => this.render());
  }

  advance(delta: number, state: FeedbackState) {
    this.model.advance(delta, state);
    this.render();
  }

  private render() {
    const { messages, scores } = this.model.snapshot();
    const reduced = motionPreferences.snapshot().reduced;

    for (const [channel, node] of this.nodes) {
      if (channel !== 'score') renderMessage(node, messages[channel], reduced);
    }

    this.renderScores(scores);
    this.announce(scores);
  }

  private announce(scores: readonly FeedbackMessage[]) {
    const announcement = scores.map(caption).join('. ');

    if (this.announcement.textContent !== announcement)
      this.announcement.textContent = announcement;
  }

  // eslint-disable-next-line max-lines-per-function -- Ein zusammenhängender Stapelhub verhindert überlappende Zeilen bei unabhängigem Ausblenden.
  private renderScores(scores: readonly FeedbackMessage[]) {
    const stack = this.nodes.get('score');

    if (!stack) return;
    const reduced = motionPreferences.snapshot().reduced;

    stack.hidden = scores.length === 0;
    stack.style.transform =
      reduced || !scores.length
        ? 'none'
        : `translateY(${-FEEDBACK.liftPx * Math.min(...scores.map((score) => score.elapsedMs / score.durationMs))}px)`;

    for (const [index, row] of this.scoreRows.entries()) {
      renderMessage(row, scores[index], reduced);
      row.style.transform = 'none';
    }
  }

  // eslint-disable-next-line max-lines-per-function -- Rendergrenzen und reale Overlayrechtecke werden gemeinsam gegen denselben Canvas projiziert.
  private positionScore() {
    const node = this.nodes.get('score');
    const scores = this.model.snapshot().scores;

    if (!node || !scores.length) return;
    const canvas = this.scene.game.canvas.getBoundingClientRect();

    if (canvas.width <= 0 || canvas.height <= 0) return;
    const layer = this.root.getBoundingClientRect();

    node.style.maxWidth = `${Math.max(0, Math.min(280, canvas.width - 16))}px`;
    this.renderScores(scores);
    const anchor = this.projectAnchor(canvas);
    const obstacles = this.obstacles(canvas);
    let size = node.getBoundingClientRect();
    let position = feedbackPosition(anchor, size, canvas, FEEDBACK.liftPx, obstacles);

    if (scores.length > 1 && feedbackOverlap(position, size, obstacles, FEEDBACK.liftPx) > 0) {
      this.renderScores([scores.reduce((first, second) => mergeDamage(first, second))]);
      size = node.getBoundingClientRect();
      position = feedbackPosition(anchor, size, canvas, FEEDBACK.liftPx, obstacles);
    }

    node.style.left = `${canvas.left - layer.left + position.left}px`;
    node.style.top = `${canvas.top - layer.top + position.top}px`;
  }

  // eslint-disable-next-line max-lines-per-function -- Sichtbarkeit und Koordinaten aller dynamischen Overlaygrenzen bilden eine gemeinsame Layoutprobe.
  private obstacles(canvas: DOMRect) {
    const selector =
      '.touch-directions, .touch-actions, .room-selection-return, .album-banner, .mobile-hud, .mobile-dialogue';
    const nodes = document.querySelectorAll<HTMLElement>(selector);
    const overlays = [...Array.from(nodes), ...this.nodes.values()].filter(
      (node) =>
        node !== this.nodes.get('score') &&
        !node.closest('[hidden]') &&
        getComputedStyle(node).display !== 'none',
    );

    return overlays
      .map((node) => {
        const bounds = node.getBoundingClientRect();

        return {
          left: bounds.left - canvas.left,
          top: bounds.top - canvas.top,
          width: bounds.width,
          height: bounds.height,
        };
      })
      .filter((bounds) => bounds.width > 0 && bounds.height > 0);
  }

  // eslint-disable-next-line max-lines-per-function -- Ober-/Unterkante teilen denselben aktuellen Kameraausschnitt und Canvas-Maßstab.
  private projectAnchor(canvas: DOMRect) {
    const camera = this.scene.cameras.main;
    const anchor = this.anchor();
    const scaleX = (camera.zoom * canvas.width) / this.scene.scale.width;
    const scaleY = (camera.zoom * canvas.height) / this.scene.scale.height;

    return {
      x: (anchor.x - camera.worldView.x) * scaleX,
      top: (anchor.top - camera.worldView.y) * scaleY,
      bottom: (anchor.bottom - camera.worldView.y) * scaleY,
    };
  }

  readable() {
    const messages = this.model.snapshot().messages;
    const message = messages.charm ?? messages.phase;

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
    this.scene.events.off('render', this.position);
    this.unsubscribe();
    this.unsubscribeMotion();
    this.root.remove();
  }
}

function caption(message: FeedbackMessage) {
  const symbol = message.tone === 'negative' ? '✕' : message.tone === 'positive' ? '✓' : '◆';

  const count = message.count > 1 ? ` ×${message.count}` : '';

  return `${symbol} ${t(message.key, { v0: message.value })}${count}`;
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

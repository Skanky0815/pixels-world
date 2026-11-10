import './dev-shell.css';
import './portrait-preview.css';
import sara from '../../assets/team/sara-portrait-v1.png?url';
import pixel from '../../assets/team/pixel-portrait-v3.png?url';
import annoyed from '../../assets/dialogue-portraits/sara-annoyed-v1.png?url';
import surprised from '../../assets/dialogue-portraits/sara-surprised-v1.png?url';
import friendly from '../../assets/dialogue-portraits/sara-friendly-v1.png?url';
import { resolveText, type TextKey, type Language } from '../i18n/locale';

if (!import.meta.env.DEV) throw new Error('Porträtvorschau ist nur im Dev-Betrieb verfügbar.');
const variants = [
  {
    id: 'neutral',
    name: 'Sara · ruhig',
    image: sara,
    source: 'Landingpage-Master',
    speaker: 'SARA',
    text: 'saraLivingRoomTrio',
  },
  {
    id: 'surprised',
    name: 'Sara · überrascht',
    image: surprised,
    source: 'Ausdrucksentwurf v1',
    speaker: 'SARA',
    text: 'thisUsedToBeALiving',
  },
  {
    id: 'annoyed',
    name: 'Sara · genervt',
    image: annoyed,
    source: 'Ausdrucksentwurf v1',
    speaker: 'SARA',
    text: 'saraDamageSofa3',
  },
  {
    id: 'friendly',
    name: 'Sara · versöhnt',
    image: friendly,
    source: 'Ausdrucksentwurf v1',
    speaker: 'SARA',
    text: 'thatPurringIsUnfair',
  },
  {
    id: 'pixel',
    name: 'Pixel · unschuldig',
    image: pixel,
    source: 'Landingpage-Master v3',
    speaker: 'PIXEL',
    text: 'makeAmendsPixelTurnsOnThe',
  },
] as const satisfies readonly {
  id: string;
  name: string;
  image: string;
  source: string;
  speaker: string;
  text: TextKey;
}[];
const expression = required<HTMLSelectElement>('#expression');
const size = required<HTMLSelectElement>('#portrait-size');
const language = required<HTMLSelectElement>('#language');
const longText = required<HTMLInputElement>('#long-text');
const noPortrait = required<HTMLInputElement>('#no-portrait');
const abort = new AbortController();

for (const variant of variants) {
  expression.add(new Option(variant.name, variant.id));
  required('#gallery').append(card(variant));
}

for (const input of [expression, size, language, longText, noPortrait])
  input.addEventListener('change', render, { signal: abort.signal });
required('#next-expression').addEventListener('click', next, { signal: abort.signal });
render();
import.meta.hot?.dispose(() => abort.abort());

// eslint-disable-next-line max-lines-per-function -- Die Karte verbindet die tatsächliche Quelle mit genau derselben Auswahl wie das Formular.
function card(variant: (typeof variants)[number]) {
  const button = document.createElement('button');
  const image = document.createElement('img');
  const name = document.createElement('span');
  const source = document.createElement('small');

  button.type = 'button';
  button.className = 'portrait-card';
  button.dataset.variant = variant.id;
  button.dataset.speaker = variant.speaker;
  image.src = variant.image;
  image.alt = '';
  name.textContent = variant.name;
  source.textContent = variant.source;
  button.append(image, name, source);
  button.addEventListener(
    'click',
    () => {
      expression.value = variant.id;
      render();
    },
    { signal: abort.signal },
  );

  return button;
}

// eslint-disable-next-line max-lines-per-function -- Beide statischen Gerätegrößen teilen Auswahl, Sprache und tatsächliche Bildquellen.
function render() {
  const variant = variants.find((variant) => variant.id === expression.value) ?? variants[0];
  const lang = language.value as Language;
  const quote = previewQuote(variant, lang, longText.checked);

  document
    .querySelector<HTMLElement>('.desktop-scene')
    ?.style.setProperty('--portrait-width', `${Number(size.value) / 9.6}cqw`);
  document.documentElement.lang = lang;

  for (const dialogue of Array.from(document.querySelectorAll<HTMLElement>('.sample-dialogue'))) {
    const portrait = dialogue.querySelector<HTMLImageElement>('.dialogue-portrait');

    if (portrait) portrait.src = variant.image;
    dialogue.dataset.fallback = String(noPortrait.checked);
    dialogue.dataset.speaker = variant.speaker;
    setText(dialogue, '.sample-speaker', variant.speaker);
    setText(dialogue, '.sample-quote', quote);
    setText(dialogue, '.sample-hint', lang === 'de' ? '␣ Weiter' : '␣ Continue');
  }

  for (const button of Array.from(document.querySelectorAll<HTMLElement>('.portrait-card')))
    button.setAttribute('aria-pressed', String(button.dataset.variant === variant.id));
  required('#selection-note').textContent =
    `${variant.name} · ${variant.source} · Desktop ${size.value} px, Handy 48 px. Die Master bleiben unverändert.`;
}

function previewQuote(variant: (typeof variants)[number], lang: Language, long: boolean) {
  if (variant.id === 'pixel') return pixelCaption(lang, long);

  if (!long) return resolveText(variant.text, lang);

  return ['saraLivingRoomTrio', 'saraDamageSofa3', 'saraCozyAdventure']
    .map((key) => resolveText(key as TextKey, lang))
    .join(' ');
}

function pixelCaption(lang: Language, long: boolean) {
  if (lang === 'de')
    return long
      ? 'Pixel blinzelt unschuldig, legt den Kopf schief und schiebt ganz vorsichtig eine Pfote nach vorn. Dann beginnt er zu schnurren. Vom zerkratzten Sofa weiß er offenbar überhaupt nichts. Mrrp?'
      : 'Pixel blinzelt unschuldig. Mrrp?';

  return long
    ? 'Pixel blinks innocently, tilts his head and carefully reaches out one paw. Then he starts purring. Apparently, he knows absolutely nothing about the scratched sofa. Mrrp?'
    : 'Pixel blinks innocently. Mrrp?';
}

function next() {
  expression.selectedIndex = (expression.selectedIndex + 1) % variants.length;
  render();
}

function setText(root: HTMLElement, selector: string, value: string) {
  const element = root.querySelector(selector);

  if (element) element.textContent = value;
}

function required<T extends HTMLElement = HTMLElement>(selector: string) {
  const element = document.querySelector<T>(selector);

  if (!element) throw new Error(`Porträtvorschau fehlt: ${selector}`);

  return element;
}

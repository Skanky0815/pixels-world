const VARIANTS = ['primary', 'cta', 'link', 'language', 'loading'] as const;

interface ButtonContent {
  label: string;
  icon?: string;
  text?: string;
  variant?: (typeof VARIANTS)[number];
}

function escape(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ??
      character,
  );
}

export function configureButton(button: HTMLButtonElement, content: ButtonContent) {
  button.type = 'button';
  configureAppearance(button, content);
  button.setAttribute('aria-label', content.label);
  button.title = content.label;
  button.innerHTML = contentMarkup(content);
}

export function buttonMarkup(content: ButtonContent, attributes = '') {
  const label = escape(content.label);
  const variant = content.variant ? ` ui-button--${content.variant}` : '';
  const icon = content.icon ? ' ui-button--icon' : '';

  return `<button type="button" class="ui-button${icon}${variant}" ${attributes} aria-label="${label}" title="${label}">${contentMarkup(content)}</button>`;
}

function configureAppearance(button: HTMLButtonElement, content: ButtonContent) {
  button.classList.add('ui-button');
  button.classList.toggle('ui-button--icon', Boolean(content.icon));

  for (const variant of VARIANTS)
    button.classList.toggle(`ui-button--${variant}`, content.variant === variant);
}

function contentMarkup(content: ButtonContent) {
  return content.icon ?? escape(content.text ?? content.label);
}

const CLOSE_ICON = '<span aria-hidden="true">×</span>';

export function closeButtonMarkup(label: string, attributes = '') {
  return buttonMarkup({ label, icon: CLOSE_ICON }, `data-popup-close ${attributes}`);
}

export function configureCloseButton(button: HTMLButtonElement, label: string) {
  configureButton(button, { label, icon: CLOSE_ICON });
  button.dataset.popupClose = '';
}

interface ButtonContent {
  label: string;
  icon?: string;
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
  button.classList.add('ui-button');
  button.classList.toggle('ui-button--icon', Boolean(content.icon));
  button.setAttribute('aria-label', content.label);
  button.title = content.label;
  button.innerHTML = content.icon ?? escape(content.label);
}

export function buttonMarkup(content: ButtonContent, attributes = '') {
  const label = escape(content.label);
  const variant = content.icon ? ' ui-button--icon' : '';

  return `<button type="button" class="ui-button${variant}" ${attributes} aria-label="${label}" title="${label}">${content.icon ?? label}</button>`;
}

const CLOSE_ICON = '<span aria-hidden="true">×</span>';

export function closeButtonMarkup(label: string, attributes = '') {
  return buttonMarkup({ label, icon: CLOSE_ICON }, `data-popup-close ${attributes}`);
}

export function configureCloseButton(button: HTMLButtonElement, label: string) {
  configureButton(button, { label, icon: CLOSE_ICON });
  button.dataset.popupClose = '';
}

/** Reuse the localized page information without copying document identifiers. */
export function gameInformation() {
  const information = document.querySelector('main > footer')?.cloneNode(true);

  if (!(information instanceof HTMLElement)) return document.createElement('div');
  information.className = 'game-information';

  for (const node of Array.from(information.querySelectorAll('[id]'))) node.removeAttribute('id');

  return information;
}

const footer = document.querySelector('#build-info');

if (!footer) throw new Error('Build footer missing');
footer.textContent = `© ${new Date().getFullYear()} Pixel's World · v${__APP_VERSION__}`;

export {};

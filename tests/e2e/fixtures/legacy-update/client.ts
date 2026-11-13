import { registerSW } from 'virtual:pwa-register';

// Registration behavior from v0.4.1, 893853d12918c880cd48eb77f0a08e0e8c0eaea4.
// Genuine historical build reproduction is documented in issue #296.
registerSW({ immediate: true });

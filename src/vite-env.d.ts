/// <reference types="vite/client" />

declare const __APP_VERSION__: string;
declare const __APP_RELEASE_URL__: string | null;
declare const __E2E_ROUND_CONFIG__:
  import('./game/domain/round-controller').RoundConfig | undefined;

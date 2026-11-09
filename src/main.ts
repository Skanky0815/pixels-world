import './i18n/settings';
import { loadingScreen } from './loading-screen';

const start =
  import.meta.env.DEV && new URLSearchParams(location.search).has('loading-preview')
    ? import('./dev/loading-preview')
    : import('./world');

void start.catch(() => loadingScreen.fail());

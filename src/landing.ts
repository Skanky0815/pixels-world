import { InstallApp } from './pwa/install';
import './i18n/settings';
import './landing.css';
import './footer';
import { createLanguageSetting } from './i18n/language-setting';

const picker = document.getElementById('landing-language');

if (picker) createLanguageSetting(picker);

const install = document.querySelector<HTMLButtonElement>('#install-app');

if (install) new InstallApp(install);

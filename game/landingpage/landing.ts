import { InstallApp } from '../shared/pwa/install';
import '../shared/i18n/settings';
import './landing.css';
import '../shared/footer';
import { createLanguageSetting } from '../shared/i18n/language-setting';

const picker = document.getElementById('landing-language');

if (picker) createLanguageSetting(picker);

const install = document.querySelector<HTMLButtonElement>('#install-app');

if (install) new InstallApp(install);

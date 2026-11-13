import './i18n/settings';
import './help.css';
import './footer';
import { createLanguageSetting } from './i18n/language-setting';

const picker = document.getElementById('landing-language');

if (picker) createLanguageSetting(picker);

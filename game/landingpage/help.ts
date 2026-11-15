import '../shared/i18n/settings';
import './help.css';
import '../shared/footer';
import '../shared/pwa/recovery';
import { createLanguageSetting } from '../shared/i18n/language-setting';

const picker = document.getElementById('landing-language');

if (picker) createLanguageSetting(picker);

import zhHans from './zh-hans.js';
import zhHant from './zh-hant.js';
import en from './en.js';
import '../types/i18n.js';

/**
 * @type {I18nGenerator}
 * @param {string} lang
 * @return {I18n}
 */
export default function i18n(lang) {
    switch (lang.toLowerCase()) {
        case 'cn':
        case 'zh-cn':
        case 'zh-hans':
            return zhHans;
        case 'zh-tw':
        case 'zh-hk':
        case 'zh-mo':
        case 'zh-hant':
            return zhHant;
        default:
            return en;
    }
}

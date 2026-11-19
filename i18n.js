// English / Kuwaiti Arabic switch for STEM Campus Quest.
//   tr(en, ar)  picks the string for the current language (used by index.html and widgets.js)
//   LTR(s)      keeps a formula or coordinate reading left to right inside Arabic text
//   BANK_AR     (questions.ar.js) holds the Arabic text for every challenge, matched to BANK by position
let LANG = 'ar';
try { LANG = localStorage.getItem('stemCampus.lang') || 'ar'; } catch {}
const tr = (en, ar) => LANG === 'ar' ? ar : en;
const LTR = s => `⁦${s}⁩`;

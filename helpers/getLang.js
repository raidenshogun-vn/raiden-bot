// helpers/getLang.js
const path = require('path');
const fs = require('fs');

let cachedLanguages = null;

function loadLanguages() {
  if (cachedLanguages) return cachedLanguages;

  const languageDir = path.join(__dirname, '/../language');
  const languages = {};

  try {
    const files = fs.readdirSync(languageDir);
    files.forEach(file => {
      if (file.endsWith('.js')) {
        const langCode = path.basename(file, '.js');
        languages[langCode] = require(path.join(languageDir, file));
      }
    });

    cachedLanguages = languages;
    return languages;
  } catch (err) {
    console.error('❌ Không thể đọc thư mục language:', err);
    return {};
  }
}

const languages = loadLanguages();

function getLang(code) {
  return languages[code] || languages.vn;
}

function getLangMessage(langCode, key) {
  const lang = languages[langCode] || languages.vn;
  const value = key.split('.').reduce((obj, k) => obj?.[k], lang);
  if (!value) {
    console.warn(`⚠️ Missing translation for key "${key}" in language "${langCode}"`);
  }
  return value || `🔸 Missing translation: ${key}`;
}

module.exports = {
  getLang,
  getLangMessage,
  loadLanguages,
};

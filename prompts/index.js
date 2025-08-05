const fs = require('fs');
const path = require('path');

const baseDir = __dirname;
const promptModes = {
  DM: {},
  SERVER: {}
};

['DM', 'SERVER'].forEach(context => {
  const contextDir = path.join(baseDir, context);

  if (!fs.existsSync(contextDir)) return;

  fs.readdirSync(contextDir).forEach(modeName => {
    const modePath = path.join(contextDir, modeName);
    if (!fs.lstatSync(modePath).isDirectory()) return;

    const languages = {};

    fs.readdirSync(modePath).forEach(file => {
      if (file.endsWith('.js')) {
        const langCode = file.replace(`${modeName.toLowerCase()}_`, '').replace('.js', '');
        try {
          const promptModule = require(path.join(modePath, file));
          if (typeof promptModule === 'function') {
            languages[langCode] = promptModule;
          } else {
            console.warn(`⚠️ File ${file} trong ${context}/${modeName} không export function`);
          }
        } catch (err) {
          console.error(`❌ Lỗi khi load file ${file} trong ${context}/${modeName}:`, err.message);
        }
      }
    });

    // Ghi vào promptModes theo dạng: promptModes.DM.DYNAMIC
    promptModes[context][modeName.toUpperCase()] = languages;
  });
});

module.exports = promptModes;

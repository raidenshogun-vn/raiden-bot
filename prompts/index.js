const fs = require('fs');
const path = require('path');

const baseDir = __dirname;
const promptModes = {
  DM: {},
  SERVER: {}
};

['DM', 'SERVER'].forEach(context => {
  const contextDir = path.join(baseDir, context);

  if (!fs.existsSync(contextDir)) {
    console.warn(`⚠️ Context folder không tồn tại: ${contextDir}`);
    return;
  }

  fs.readdirSync(contextDir).forEach(modeName => {
    const modePath = path.join(contextDir, modeName);
    if (!fs.existsSync(modePath) || !fs.lstatSync(modePath).isDirectory()) {
      console.warn(`⚠️ Mode folder không tồn tại hoặc không phải thư mục: ${modePath}`);
      return;
    }

    const languages = {};

    fs.readdirSync(modePath).forEach(file => {
      const lowerFile = file.toLowerCase();
      const prefix = `${modeName.toLowerCase()}_`;

      if (lowerFile.startsWith(prefix) && file.endsWith('.js')) {
        const langCode = file.slice(prefix.length).replace('.js', '');
        const fullPath = path.join(modePath, file);
        try {
          const promptModule = require(fullPath);
          if (typeof promptModule === 'function') {
            languages[langCode] = promptModule;
            console.log(`✅ Loaded: ${context}/${modeName}/${file}`);
          } else {
            console.warn(`⚠️ File ${file} trong ${context}/${modeName} không export function`);
          }
        } catch (err) {
          console.error(`❌ Lỗi khi load file ${file} trong ${context}/${modeName}:`, err.message);
        }
      }
    });

    promptModes[context][modeName.toUpperCase()] = languages;
  });
});

module.exports = promptModes;

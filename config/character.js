const { ActivityType } = require('discord.js');

const lang_vn = require('../character_language/character_vn');
const lang_en = require('../character_language/character_en');


module.exports = {
  name: 'raiden',
  displayName: 'Raiden Shogun',
  aiPromptName: 'Raiden Shogun',
  imageFolder: 'raiden',
  imageHistoryModel: 'raidenHistory',
  birthday: '26-06',
  weapon: 'Polearm',
  vision: 'Electro',
  height: '172cm',
  statusPresets: [
    { text: 'Genshin Impact UID 864667104', type: ActivityType.Playing },
    { text: 'nấu ăn với Xiangling và Escoffier ', type: ActivityType.Streaming },
    { text: 'công thức nấu ăn mới', type: ActivityType.Watching },
  ],

  languages: {
    vn: lang_vn,
    en: lang_en,
  }
};

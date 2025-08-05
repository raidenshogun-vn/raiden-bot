// helpers/server/getLangCodeFromChannel.js
const ServerChatHistory = require('../../models/ServerChatHistory');
const ServerSettings = require('../../models/ServerSettings');

function detectFromLocale(locale) {
  const localeMap = {
    vi: 'vn',
    en: 'en',
    ja: 'jp',
    zh: 'cn',
    fr: 'fr',
    de: 'de',
    es: 'es',
    ru: 'ru',
    pt: 'pt',
    ko: 'kr',
    id: 'id',
    th: 'th',
  };

  const raw = locale?.split('-')[0];
  return localeMap[raw] || 'en';
}

// ✅ Ưu tiên ngôn ngữ của channel → nếu không có thì đến server → fallback cuối là locale của Discord
async function getLangCodeFromChannel(serverId, channelId, guild) {
  // 1. Check ngôn ngữ của channel
  const channelData = await ServerChatHistory.findOne({ serverId, channelId });
  if (channelData?.language) return channelData.language;

  // 2. Check ngôn ngữ của server
  const settings = await ServerSettings.findOne({ serverId });
  if (settings?.language) return settings.language;

  // 3. Fallback Discord preferredLocale
  return detectFromLocale(guild?.preferredLocale);
}

module.exports = getLangCodeFromChannel;

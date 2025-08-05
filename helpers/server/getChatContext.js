const ServerChatHistory = require('../../models/ServerChatHistory');
const getLangCodeFromChannel = require('./getLangCodeFromChannel');

async function getChatContext(serverId, channelId, guild, limit = 1000) {
  try {
    const history = await ServerChatHistory.findOne({ serverId, channelId });
    if (!history || !Array.isArray(history.chats)) return '';

    // ✅ Ưu tiên lấy language từ ServerChatHistory
    let langCode;
    if (history.language) {
      langCode = history.language;
    } else {
      langCode = await getLangCodeFromChannel(serverId, channelId, guild) || 'en';
    }

    const lang = require(`../../language/${langCode}.js`);
    const label = lang.promptContext?.historyHeader || '***Previous conversation context (most recent first):***';

    const recentChats = history.chats.slice(-limit);
    const context = recentChats.map((chat, index) => {
      const time = new Date(chat.timestamp).toLocaleString();
      return `[${index + 1}] [${time}] ${chat.displayName}: ${chat.message}\n`;
    }).join('\n\n');

    return `\n\n${label}\n${context}`;
  } catch (err) {
    console.error('❌ Error loading SERVER mode chat context:', err);
    return '';
  }
}

module.exports = getChatContext;

// 📄 formatChatContext.js
// 🧠 Mục đích: Định dạng lịch sử chat thành chuỗi context (dùng cho AI tiếp tục trả lời)
// 📥 Đầu vào: chatHistory (mảng), langCode ('vn', 'en'...), botName (tên nhân vật bot)
// 📤 Đầu ra: Chuỗi đã định dạng
// 🧩 Phụ thuộc: luxon, languages, timeZoneMap

const { DateTime } = require('luxon');
const { loadLanguages } = require('../helpers/getLang');
const character = require('../config/character');
const languages =loadLanguages()
const timeZoneMap = {
  vn: 'Asia/Ho_Chi_Minh',
  en: 'America/New_York',
  jp: 'Asia/Tokyo',
  fr: 'Europe/Paris',
  de: 'Europe/Berlin',
  es: 'Europe/Madrid',
  ru: 'Europe/Moscow',
  pt: 'Europe/Lisbon',
  kr: 'Asia/Seoul',
  id: 'Asia/Jakarta',
  th: 'Asia/Bangkok',
  cn: 'Asia/Shanghai',
};

function formatChatContext(chatHistory, langCode = 'vn') {
  if (!chatHistory || chatHistory.length === 0) return '';
  // Có thể lấy lang sai trong vài trường hợp ở DM hay server nhưng có thể bỏ qua vì không ảnh hưởng nhiề
  const lang = languages[langCode] || languages.vn;
  const label = lang.promptContext?.historyHeader || "***Previous conversation context (from beginning to present):***";
  
  const timeZone = timeZoneMap[langCode] || 'Asia/Ho_Chi_Minh';

  const context = chatHistory.map((chat, index) => {
    let timeStr = 'Unknown time';
    let dateTime = null;

    if (chat.timestamp) {
      if (typeof chat.timestamp === 'string') {
        dateTime = DateTime.fromISO(chat.timestamp);
      } else if (typeof chat.timestamp === 'number') {
        dateTime = DateTime.fromMillis(chat.timestamp);
      } else if (chat.timestamp instanceof Date) {
        dateTime = DateTime.fromJSDate(chat.timestamp);
      }

      if (dateTime?.isValid) {
        timeStr = dateTime.setZone(timeZone).toFormat('yyyy-MM-dd HH:mm');
      } else {
        console.warn(`⚠️ Invalid dateTime in entry #${index + 1}:`, dateTime);
      }
    }

    const userName = chat.displayName || chat.username || 'Unknown';
    const userLine = `[${index + 1}] [${timeStr}] ${userName}: ${chat.message}`;
    const botLine = chat.response ? `\n${character.displayName}: ${chat.response}` : '';

    return userLine + botLine;
  }).join('\n\n');

  return `\n\n${label}\n${context}`;
}

module.exports = formatChatContext;

const DMChatHistory = require('../../models/DMChatHistory'); // hoặc đường dẫn phù hợp

async function getChatContext(userId, limit = 200) {
  try {
    const dmHistory = await DMChatHistory.findOne({ userId });
    if (!dmHistory || !Array.isArray(dmHistory.chats)) return [];

    // Lấy những tin nhắn gần nhất, không cần lọc theo source nữa
    const recentChats = dmHistory.chats.slice(-limit);

    return recentChats;
  } catch (error) {
    console.error('❌ Lỗi trong getChatContext_dm:', error);
    return [];
  }
}

module.exports = getChatContext;

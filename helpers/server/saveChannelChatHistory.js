// 📄 saveChannelChatHistory.js
// 🧠 Mục đích: Lưu lịch sử chat của 1 channel trong server (theo serverId + channelId)
// 📥 Đầu vào: serverId, channelId, chatData = { messageId, userId, username, displayName, message }
// 📤 Đầu ra: không trả về, chỉ lưu DB
// 🧩 Phụ thuộc: models/ServerChatHistory

const ServerChatHistory = require('../../models/ServerChatHistory');

async function saveChannelChatHistory(serverId, channelId, chatData) {
  try {
    const { messageId, userId, username, displayName, message } = chatData;

    if (!messageId || !message) {
      console.warn('⚠️ Thiếu messageId hoặc message trong chatData');
      return;
    }

    let channelHistory = await ServerChatHistory.findOne({ serverId, channelId });

    if (!channelHistory) {
      // Nếu chưa có document, tạo mới
      channelHistory = new ServerChatHistory({
        serverId,
        channelId,
        chats: [],
        mode: null // có thể set theo nhu cầu nếu muốn
      });
    }

    const newChat = {
      messageId,
      userId,
      username,
      displayName,
      message,
      timestamp: new Date()
    };

    channelHistory.chats.push(newChat);

    // Giới hạn số lượng lịch sử chat (nếu cần)
    if (channelHistory.chats.length > 1000) {
      channelHistory.chats = channelHistory.chats.slice(-1000);
    }

    await channelHistory.save();
  } catch (error) {
    console.error('❌ Error saving channel chat history:', error);
  }
}

module.exports = saveChannelChatHistory;

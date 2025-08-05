// 📄 saveChatHistory_dm.js
// 🧠 Mục đích: Lưu lịch sử chat của người dùng ở chế độ DM vào MongoDB
// 📥 Đầu vào: userId, username, message, response, language
// 📤 Đầu ra: Không trả về gì, chỉ lưu vào DB
// 🧩 Phụ thuộc: models/DMChatHistory

const DMChatHistory = require('../../models/DMChatHistory');

async function saveChatHistory(userId, username, message, response, language = 'vn') {
  try {
    let userHistory = await DMChatHistory.findOne({ userId });

    if (!userHistory) {
      userHistory = new DMChatHistory({
        userId,
        username,
        chats: [],
      });
    }

    const newChat = {
      username,
      message,
      response,
      language,
      timestamp: new Date(),
    };

    userHistory.chats.push(newChat);

    // Giới hạn lịch sử 1000 dòng để tránh phình to quá
    if (userHistory.chats.length > 1000) {
      userHistory.chats = userHistory.chats.slice(-1000);
    }

    await userHistory.save();
  } catch (error) {
    console.error('❌ Error saving DM chat history:', error);
  }
}

module.exports = saveChatHistory;

// 📄 clearChannelChatHistory.js
// 🧠 Mục đích: Xóa toàn bộ lịch sử chat của một kênh trong server (theo serverId + channelId)
// 📥 Đầu vào: serverId (String), channelId (String)
// 📤 Đầu ra: true nếu xóa thành công, false nếu không
// 🧩 Phụ thuộc: models/ServerChatHistory

const ServerChatHistory = require('../../models/ServerChatHistory');

async function clearChannelChatHistory(serverId, channelId) {
  try {
    const result = await ServerChatHistory.findOneAndUpdate(
      { serverId, channelId },
      { $set: { chats: [] } },
      { new: true }
    );

    if (!result) {
      console.warn(`⚠️ Không tìm thấy dữ liệu để xóa: serverId=${serverId}, channelId=${channelId}`);
      return false;
    }

    console.log(`✅ Đã xóa lịch sử chat tại kênh ${channelId} (server ${serverId})`);
    return true;
  } catch (error) {
    console.error('❌ Lỗi khi xóa lịch sử chat kênh:', error);
    return false;
  }
}

module.exports = clearChannelChatHistory;

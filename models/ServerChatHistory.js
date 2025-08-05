const mongoose = require('mongoose');

const serverChatSchema = new mongoose.Schema({
  serverId: { type: String, required: true },
  channelId: { type: String, required: true },

  // 👇 Thêm mode, mặc định là null
  mode: { type: String, default: null },

  chats: [
    {
      messageId: { type: String, required: true },
      userId: String,
      username: String,
      displayName: String,
      message: String,
      timestamp: { type: Date, default: Date.now },
    }
  ],
  language: { type: String, default: null }
});

serverChatSchema.index({ serverId: 1, channelId: 1 });

module.exports = mongoose.model('ServerChatHistory', serverChatSchema);

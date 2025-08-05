const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  username: String,
  message: String,
  response: String,
  language: String,
  timestamp: { type: Date, default: Date.now }
});

const dmChatHistorySchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  username: String,
  chats: [chatSchema],
});

module.exports = mongoose.model('DMChatHistory', dmChatHistorySchema);

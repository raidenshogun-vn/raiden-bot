const mongoose = require('mongoose');

const userNoticeSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  noticeType: { type: String, required: true }, // e.g., 'language', 'intro'
  guildId: { type: String, default: null }, // 🆕 nếu là DM thì để null
  sentAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserNotice', userNoticeSchema);

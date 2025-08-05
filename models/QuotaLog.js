// models/QuotaLog.js
const mongoose = require('mongoose');

const quotaLogSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    expires: '7d' // 👈 Tự động xóa sau 7 ngày
  }
});

module.exports.QuotaLog = mongoose.model('QuotaLog', quotaLogSchema);

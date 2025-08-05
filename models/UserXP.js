const mongoose = require('mongoose');

const userXPSchema = new mongoose.Schema({
  userId: String,
  guildId: String,
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  lastMessage: { type: Number, default: 0 }
});

module.exports = mongoose.model('UserXP', userXPSchema);

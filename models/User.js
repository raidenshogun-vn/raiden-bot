const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },

  language: { type: String, default: 'vn' },

  dmMode: { type: String, default: null },

  serverModes: {
    type: Map,
    of: String,
    default: {}
  }

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

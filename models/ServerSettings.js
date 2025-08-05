const mongoose = require('mongoose');

const serverSettingsSchema = new mongoose.Schema({
  serverId: {
    type: String,
    required: true,
    unique: true
  },
  nameTriggerEnabled: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('ServerSettings', serverSettingsSchema);

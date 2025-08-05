// models/CharacterHistory.js
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  userId: String,
  seenDM: [{
    imageId: String,
    lastUsedAt: Date
  }],
  seenServer: [{
    serverId: String,
    images: [{
      imageId: String,
      lastUsedAt: Date
    }]
  }]
});

module.exports = (displayName) => {
  const safeModelName = displayName.replace(/\s+/g, '').toLowerCase() + 'History';
  return mongoose.model(safeModelName, schema);
};

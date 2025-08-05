const ServerChatHistory = require('../../models/ServerChatHistory');
const getLangCodeFromChannel = require('./getLangCodeFromChannel.js');
const getBasePrompt = require('./getBasePrompt');
const buildExtraInfo = require('./buildExtraInfo');
const character = require('../../config/character.js');
const User = require('../../models/User');
const fixUserMaps = require('../fixUserMaps');

async function getPromptForUser(userId, serverId, channelId, guild) {
  let user;
  try {
    user = await User.findOne({ userId });
  } catch (err) {
    console.warn(`[⚠] Không thể truy vấn MongoDB (Server):`, err.message);
  }

  fixUserMaps(user);

  // ✅ Lấy thông tin mode + language từ ServerChatHistory
  const chatDoc = await ServerChatHistory.findOne({ serverId, channelId });

  const mode = chatDoc?.mode || 'TEACHER';
  const langCode = chatDoc?.language || await getLangCodeFromChannel(serverId, channelId, guild) || 'en';

  const prompt = await getBasePrompt(langCode, mode, character);

  if (!prompt) {
    console.warn(`⚠️ Prompt bị undefined trong Server cho user ${userId} | mode: ${mode} | language: ${langCode}`);
  }

  const extraInfo = await buildExtraInfo(character, guild, channelId);
  return `${prompt || '[❌ Prompt not found]'}\n${extraInfo}`;
}

module.exports = getPromptForUser;

const User = require('../../models/User');
const fixUserMaps = require('../fixUserMaps');
const getBasePrompt = require('./getBasePrompt');
const  character = require('../../config/character.js');
async function getPromptForUser(userId) {
  let user;
  try {
    user = await User.findOne({ userId });
  } catch (err) {
    console.warn(`[⚠] Không thể truy vấn MongoDB (DM):`, err.message);
  }

  fixUserMaps(user);

  const mode = user?.dmMode || 'AUTORES';
  const language = user?.language || 'vn';

  const prompt = await getBasePrompt(language, mode, character);

  if (!prompt) {
    console.warn(`⚠️ Prompt bị undefined trong DM cho user ${userId} | mode: ${mode} | language: ${language}`);
    return '[❌ Prompt not found]'; // hoặc dùng getErrorMessage(language) nếu anh muốn
  }

  return prompt;
}

module.exports = getPromptForUser;

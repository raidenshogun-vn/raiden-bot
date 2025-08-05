const User = require('../../models/User');
const fixUserMaps = require('../../helpers/fixUserMaps');
const { loadLanguages } = require('../../helpers/getLang');
const clearChatHistory = require('../../helpers/dm/clearChatHistory')
const { safeUpdate } = require('../../utils/interactionHelpers');

const languages = loadLanguages();

module.exports = async (interaction) => {
  const userId = interaction.user.id;
  const serverId = interaction.guildId;
  const source = interaction.channel.isDMBased() ? 'dm' : 'server';

  let user = await User.findOne({ userId });
  if (!user) user = new User({ userId });
  fixUserMaps(user);

  const lang = languages[user.language || 'vn']?.setMode;

  // Lưu NSFW vào DB
  if (source === 'dm') {
    user.dmMode = 'NSFW';
  } else {
    user.serverModes.set(serverId, 'NSFW');
  }

  await user.save();
  await clearChatHistory(userId);

  // ✅ Chỉ dùng 1 lần safeUpdate, không followUp nữa
  const finalMsg = typeof lang.modeChanged === 'function'
    ? lang.modeChanged('NSFW')
    : '✅ Switched to NSFW mode successfully.';

  await safeUpdate(interaction, finalMsg, []);
};

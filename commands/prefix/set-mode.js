const { PermissionFlagsBits, ChannelType } = require('discord.js');
const character = require('../config/character');
const User = require('../models/User');
const { clearChatHistory, getLang, fixUserMaps } = require('../utils/characterHelpers');

// ✅ Dễ mở rộng: thêm mode tại đây
const adminOnlyModes = ['COOKING'];

module.exports = {
  name: '!set-mode',
  description: `Choose a chat mode for ${character.displayName}`,

  async execute(message) {
    const args = message.content.slice(1).trim().split(/\s+/g);
    const command = args[0]?.toLowerCase();
    const botNameArg = args[1]?.toLowerCase();
    const selectedMode = args[2]?.toUpperCase();

    // ❌ Nếu không đúng tên bot thì im lặng
    if (!botNameArg || botNameArg !== character.displayName.toLowerCase()) return;

    // ❌ Không có mode
    if (!selectedMode) {
      return await message.reply(`❌ You must specify a mode. Example: \`!set-mode ${character.displayName.toLowerCase()} cooking\``);
    }

    // ❌ Mode không hợp lệ
    if (!['COOKING'].includes(selectedMode)) {
      return await message.reply(`❌ Invalid mode: ${selectedMode}`);
    }

    const isDM = message.channel.type === ChannelType.DM;
    const userId = message.author.id;
    const serverId = message.guild?.id || null;
    const source = isDM ? 'dm' : 'server';

    // ❌ Nếu là admin-only mode trong server → kiểm tra quyền
    if (!isDM && adminOnlyModes.includes(selectedMode)) {
      const member = await message.guild.members.fetch(userId);
      if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
        return await message.reply(`❌ Only server admins can use the "${selectedMode}" mode here.`);
      }
    }

    let user = await User.findOne({ userId });
    if (!user) user = new User({ userId });
    fixUserMaps(user);

    const lang = getLang(user.language || 'vn').setMode;

    // ✅ Cập nhật mode
    if (isDM) {
      user.dmMode = selectedMode;
      user.dmSituation = '';
    } else {
      user.serverModes.set(serverId, selectedMode);
      user.serverSituations.set(serverId, '');
    }

    await user.save();

    // ✅ Xoá lịch sử
    await clearChatHistory(userId, source, serverId, true);

    // ✅ Gửi phản hồi
    const replyMsg = typeof lang.modeChanged === 'function'
      ? lang.modeChanged(selectedMode)
      : `✅ Mode changed to ${selectedMode}.`;

    await message.reply(replyMsg);
  }
};

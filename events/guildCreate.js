// events/guildCreate.js
const { ChannelType, PermissionFlagsBits } = require('discord.js');
const character = require('../config/character');
module.exports = {
  name: 'guildCreate',
  async execute(guild) {
    try {
      let systemChannel = guild.systemChannel;

      // ✅ Kiểm tra null trước khi dùng permissionsFor
      if (
        systemChannel &&
        guild.members.me &&
        !systemChannel
          .permissionsFor(guild.members.me)
          ?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages])
      ) {
        systemChannel = null;
      }

      // ✅ Tìm kênh thay thế nếu cần
      if (!systemChannel) {
        const channels = await guild.channels.fetch();
        systemChannel = channels.find(
          c =>
            c.type === ChannelType.GuildText &&
            c.permissionsFor(guild.members.me)?.has([
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
            ])
        );
      }

      // ✅ Gửi chào mừng nếu có kênh phù hợp
        if (systemChannel) {
          await systemChannel.send(
    `🌟 **Thank you for adding ${character.displayName} to your server!**\n` +
    `If you're interested in new Genshin Impact bots or want to receive the latest updates and announcements,\n` +
    `feel free to join our official support server: [click here](https://discord.gg/GkRRamE3Zh)\n\n` +
    `Thank you for using this bot!`
  );

        console.log(`📬 Đã gửi chào mừng đến ${guild.name}`);
      } else {
        console.warn(`⚠️ Không tìm được kênh phù hợp để gửi chào mừng trong ${guild.name}`);
      }
    } catch (err) {
      console.error('❌ Lỗi gửi chào mừng:', err);
    }
  },
};

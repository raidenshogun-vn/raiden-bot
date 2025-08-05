const {
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require('discord.js');

const { getLang } = require('../../../helpers/getLang');
const clearChannelChatHistory = require('../../../helpers/server/clearChannelChatHistory');
const character = require('../../../config/character');
const ServerChatHistory = require('../../../models/ServerChatHistory');
const getLangCodeFromChannel = require('../../../helpers/server/getLangCodeFromChannel');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set-channel-mode')
    .setDescription(`Chọn chế độ trò chuyện cho ${character.displayName} tại kênh hiện tại`)
    .addStringOption(option =>
      option.setName('mode')
        .setDescription('Chọn chế độ')
        .setRequired(true)
        .addChoices(
          { name: 'TEACHER (Raiden dạy nấu ăn)', value: 'TEACHER' },
          { name: 'NSFW (18+)', value: 'NSFW' },
        )
    ),

  async execute(interaction) {
    try {
      const serverId = interaction.guildId;
      const channelId = interaction.channelId;
      const selectedMode = interaction.options.getString('mode');

      // ✅ Lấy language từ ServerChatHistory nếu có
      let langCode;
      const existing = await ServerChatHistory.findOne({ serverId, channelId });
      if (existing?.language) {
        langCode = existing.language;
      } else {
        // ❗ Fallback nếu chưa có
        langCode = await getLangCodeFromChannel(serverId, channelId, interaction.guild) || 'en';
      }

      const lang = getLang(langCode).setMode;

      // ✅ Cập nhật mode trong ServerChatHistory
      await ServerChatHistory.findOneAndUpdate(
        { serverId, channelId },
        { mode: selectedMode },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // ✅ Xoá lịch sử chat trong kênh hiện tại
      await clearChannelChatHistory(serverId, channelId);

      // ✅ Phản hồi thành công
      await interaction.reply({
        content: lang.modeChanged(selectedMode),
        ephemeral: true,
      });

    } catch (err) {
      console.error('❌ Lỗi khi xử lý /set-channel-mode:', err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ Đã xảy ra lỗi không mong muốn.',
          ephemeral: true,
        });
      }
    }
  },
};

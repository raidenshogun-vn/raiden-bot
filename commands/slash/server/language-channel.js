const { SlashCommandBuilder } = require('discord.js');
const ServerChatHistory = require('../../../models/ServerChatHistory');
const languageMap = require('../../../config/languageMap');
const clearChannelChatHistory = require('../../../helpers/server/clearChannelChatHistory');

const languageChoices = Object.entries(languageMap).map(([code, label]) => ({
  name: label,
  value: code,
}));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('language-channel')
    .setDescription('Set custom language for this channel')
    .addStringOption(option =>
      option
        .setName('language')
        .setDescription('Choose a language for this channel')
        .setRequired(true)
        .addChoices(...languageChoices)
    ),

  async execute(interaction) {
    const lang = interaction.options.getString('language');
    const serverId = interaction.guild.id;
    const channelId = interaction.channel.id;

    // 👉 Xóa lịch sử trước để tránh lẫn ngôn ngữ
    const cleared = await clearChannelChatHistory(serverId, channelId);

    // 👉 Cập nhật ngôn ngữ cho kênh
    await ServerChatHistory.findOneAndUpdate(
      { serverId, channelId },
      { $set: { language: lang } },
      { upsert: true }
    );

    await interaction.reply(
      `✅ Language for this channel has been set to: **${languageMap[lang]}**${
        cleared ? '\n🧹Previous chat history has been cleared.' : ''
      }`
    );
  },
};

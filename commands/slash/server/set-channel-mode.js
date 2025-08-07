const {
  SlashCommandBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ComponentType,
} = require('discord.js');
const { getLang } = require('../../../helpers/getLang');
const clearChannelChatHistory = require('../../../helpers/server/clearChannelChatHistory');
const character = require('../../../config/character');
const ServerChatHistory = require('../../../models/ServerChatHistory');
const getLangCodeFromChannel = require('../../../helpers/server/getLangCodeFromChannel');
const safeUpdate = require('../../../utils/interactionHelpers').safeUpdate;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set-channel-mode')
    .setDescription(`Select the chat mode for ${character.displayName} in this channel`)
    .addStringOption(option =>
      option.setName('mode')
        .setDescription('Choose a mode')
        .setRequired(true)
        .addChoices(
          { name: 'TEACHER (Raiden teaches cooking)', value: 'TEACHER' },
          { name: 'NSFW (18+)', value: 'NSFW' },
        )
    ),

  async execute(interaction) {
    try {
      const serverId = interaction.guildId;
      const channelId = interaction.channelId;
      const selectedMode = interaction.options.getString('mode');
      const userId = interaction.user.id;

      const existing = await ServerChatHistory.findOne({ serverId, channelId });
      const langCode = existing?.language || await getLangCodeFromChannel(serverId, channelId, interaction.guild) || 'en';
      const lang = getLang(langCode);
      const t = lang.setMode;
      // Nếu không phải NSFW → vẫn update và xoá lịch sử
      await ServerChatHistory.findOneAndUpdate(
        { serverId, channelId },
        { mode: selectedMode },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      await clearChannelChatHistory(serverId, channelId);
      
      const modeText = typeof t.modeChanged === 'function'
        ? t.modeChanged(selectedMode)
        : `✅ Mode changed to ${selectedMode}.`;

      await interaction.reply({
        content: modeText,
        ephemeral: false,
      });

    } catch (err) {
      console.error('❌ Error while processing /set-channel-mode:', err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ An unexpected error occurred.',
          ephemeral: true,
        });
      }
    }
  },
};

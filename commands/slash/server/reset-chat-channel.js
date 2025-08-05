const {
  SlashCommandBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ComponentType
} = require('discord.js');

const character = require('../../../config/character');
const User = require('../../../models/User');
const {getLangMessage} = require('../../../helpers/getLang');
const clearChannelChatHistory = require('../../../helpers/server/clearChannelChatHistory');
const { safeUpdate } = require('../../../utils/interactionHelpers');
const ServerChatHistory = require('../../../models/ServerChatHistory');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('reset-chat-channel')
    .setDescription(`Reset your chat history with ${character.displayName} in this channel`),

  async execute(interaction) {
    try {

      const userId = interaction.user.id;
      const serverId = interaction.guildId;
      const channelId = interaction.channelId;
      let user = await User.findOne({ userId });
      if (!user) user = new User({ userId });

    const serverSettings = await ServerChatHistory.findOne({ serverId });
const guildLangCode = serverSettings?.language;
console.log('Guild Language Code:', guildLangCode);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`confirm_reset_server_${interaction.id}`)
          .setLabel(getLangMessage(guildLangCode, 'resetChat.button.server'))
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`cancel_reset_${interaction.id}`)
          .setLabel(getLangMessage(guildLangCode, 'resetChat.button.cancel'))
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.reply({
        content: getLangMessage(guildLangCode, 'resetChat.confirmServer'),
        components: [row],
        ephemeral: false,
      });

      const collector = interaction.channel.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 30_000,
        filter: i => i.user.id === userId && i.customId.endsWith(interaction.id),
      });

      collector.on('collect', async i => {
        try {
          if (i.customId.startsWith('cancel_reset_')) {
            await safeUpdate(i, getLangMessage(guildLangCode, 'resetChat.cancelled'));
            return collector.stop();
          }

          // ✅ Gọi đúng hàm để xóa lịch sử của kênh cụ thể
          const cleared = await clearChannelChatHistory(serverId, channelId);

          if (cleared) {
            await safeUpdate(i, getLangMessage(guildLangCode, 'resetChat.successServer'));
          } else {
            await safeUpdate(i, getLangMessage(guildLangCode, 'resetChat.error'));
          }

          collector.stop();
        } catch (err) {
          console.error(`❌ Error during reset-chat-server:`, err);
          await safeUpdate(i, getLangMessage(guildLangCode, 'resetChat.error'));
          collector.stop();
        }
      });

      collector.on('end', async collected => {
        if (collected.size === 0) {
          try {
            await interaction.editReply({
              content: getLangMessage(guildLangCode, 'resetChat.cancelled'),
              components: [],
            });
          } catch (e) {
            console.error('❌ Failed to clean up buttons:', e);
          }
        }
      });

    } catch (error) {
      console.error('❌ Error executing /reset-chat-server:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ Unexpected error occurred.',
          ephemeral: true
        });
      }
    }
  },
};

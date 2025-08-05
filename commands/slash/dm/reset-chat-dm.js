const {
  SlashCommandBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ComponentType,
} = require('discord.js');

const character = require('../../../config/character');
const User = require('../../../models/User');
const {getLangMessage}= require('../../../helpers/getLang');
const clearChatHistory = require('../../../helpers/dm/clearChatHistory');
const { safeUpdate } = require('../../../utils/interactionHelpers');



module.exports = {
  data: new SlashCommandBuilder()
    .setName('reset-chat-dm')
    .setDescription(`Reset your DM chat history with ${character.displayName}`),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      let user = await User.findOne({ userId });
      if (!user) user = new User({ userId });

      const userLanguage = user.language || 'vn';

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`reset_dm_${interaction.id}`)
          .setLabel(getLangMessage(userLanguage, 'resetChat.button.dm'))
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`cancel_reset_${interaction.id}`)
          .setLabel(getLangMessage(userLanguage, 'resetChat.button.cancel'))
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.reply({
        content: getLangMessage(userLanguage, 'resetChat.confirm'),
        components: [row],
        ephemeral: true
      });

      const collector = interaction.channel.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 30_000,
        filter: i => i.user.id === userId && i.customId.endsWith(interaction.id),
      });

      collector.on('collect', async i => {
        try {
          if (i.customId.startsWith('reset_dm_')) {
            await clearChatHistory(userId); // ✅ không truyền source/guildId/flag gì hết
            await safeUpdate(i, getLangMessage(userLanguage, 'resetChat.success'));
          } else {
            await safeUpdate(i, getLangMessage(userLanguage, 'resetChat.cancelled'));
          }
          collector.stop();
        } catch (err) {
          console.error('❌ Error during reset:', err);
          await safeUpdate(i, getLangMessage(userLanguage, 'resetChat.error'));
          collector.stop();
        }
      });

      collector.on('end', async collected => {
        if (collected.size === 0) {
          try {
            await interaction.editReply({
              content: getLangMessage(userLanguage, 'resetChat.timeout'),
              components: []
            });
          } catch (e) {
            console.error('❌ Failed to edit reply after timeout:', e);
          }
        }
      });

    } catch (error) {
      console.error('❌ Unexpected error in /reset-chat-dm:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ Unexpected error occurred.',
          ephemeral: true
        });
      }
    }
  }
};

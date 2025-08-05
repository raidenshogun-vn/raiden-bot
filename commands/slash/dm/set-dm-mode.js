const { SlashCommandBuilder } = require('discord.js');
const { getLang } = require('../../../helpers/getLang');
const clearChatHistory = require('../../../helpers/dm/clearChatHistory');
const character = require('../../../config/character');
const User = require('../../../models/User');
const fixUserMaps = require('../../../helpers/fixUserMaps');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('set-dm-mode')
    .setDescription(`Select a private chat mode with ${character.displayName}`)
    .addStringOption(option =>
      option
        .setName('mode')
        .setDescription('Choose a chat mode')
        .setRequired(true)
        .addChoices(
          { name: 'AUTORES (Raiden Modern)', value: 'AUTORES' },
          { name: 'Tender (Warm)', value: 'TENDER' },
          { name: 'NSFW (18+) Soft', value: 'NSFW' },
          { name: 'Euthymia (Quiet Raiden)', value: 'EUTHYMIA' } // ✅ Added mode
        )
    ),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      const selectedMode = interaction.options.getString('mode');

      let user = await User.findOne({ userId });
      if (!user) user = new User({ userId });
      fixUserMaps(user);

      const lang = getLang(user.language || 'vn').setMode;

      user.dmMode = selectedMode;
      await user.save();

      await clearChatHistory(userId);

      await interaction.reply({
        content: lang.modeChanged(selectedMode),
        ephemeral: true,
      });
    } catch (err) {
      console.error('❌ Error in /set-dm-mode:', err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ An error occurred while processing the command.',
          ephemeral: true,
        });
      }
    }
  },
};

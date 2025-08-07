const { SlashCommandBuilder } = require('discord.js');
const character = require('../../../config/character');
const languageDisplayNames = require('../../../config/languageMap');
const { loadLanguages } = require('../../../helpers/getLang');
const clearChatHistory = require('../../../helpers/dm/clearChatHistory');
const User = require('../../../models/User');
const { safeUpdate } = require('../../../utils/interactionHelpers');

const allLanguages = loadLanguages();
const availableLanguages = Object.keys(allLanguages);

const languageChoices = availableLanguages.map(langCode => ({
  name: languageDisplayNames[langCode] || langCode.toUpperCase(),
  value: langCode
}));

function getSafeLangCode(langCode) {
  return availableLanguages.includes(langCode) ? langCode : 'en';
}

function getLangMessages(langCode) {
  const lang = getSafeLangCode(langCode);
  return allLanguages[lang]?.language || allLanguages.en.language;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('language-dm')
    .setDescription(`Change ${character.displayName}'s language`)
    .addStringOption(option =>
      option.setName('lang')
        .setDescription('The language you want to use')
        .setRequired(true)
        .addChoices(...languageChoices)
    ),

  async execute(interaction) {
    const userId = interaction.user.id;

    const selectedLang = getSafeLangCode(interaction.options.getString('lang'));
    const msg = getLangMessages(selectedLang);

    try {
      let user = await User.findOne({ userId });
      if (!user) user = new User({ userId });

      const currentLang = getSafeLangCode(user.language);
      if (selectedLang === currentLang) {
        return interaction.reply({ content: msg.alreadySet, ephemeral: true });
      }

      const confirmRow = {
        type: 1,
        components: [
          {
            type: 2,
            style: 4,
            custom_id: 'confirm_language_change',
            label: msg.confirm,
          },
          {
            type: 2,
            style: 2,
            custom_id: 'cancel_language_change',
            label: msg.cancel,
          }
        ]
      };

      const sentMessage = await interaction.reply({
        content: msg.warning,
        components: [confirmRow],
        ephemeral: true,
        fetchReply: true
      });

      const collector = sentMessage.createMessageComponentCollector({
        filter: i => i.user.id === userId,
        time: 15_000
      });

      let handled = false;

      collector.on('collect', async i => {
        handled = true;
        collector.stop();

        if (i.customId === 'confirm_language_change') {
          user.language = selectedLang;
          await user.save();
          await clearChatHistory(userId);
          await safeUpdate(i, msg.success, [], true);
        } else {
          await safeUpdate(i, msg.cancelled, [], true);
        }
      });

      collector.on('end', async () => {
        if (!handled) {
          try {
            await safeUpdate(interaction, msg.timeout, [], true);
          } catch (err) {
            console.error('❌ Timeout error:', err);
          }
        }
      });

    } catch (err) {
      console.error('[LANGUAGE-DM] ❌ Error:', err);

      const errorMessage = `❌ An error occurred: \`${err.message}\``;

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    }
  }
};

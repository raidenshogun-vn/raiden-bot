const {
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ComponentType,
  ChannelType,
} = require('discord.js');

const character = require('../config/character');
const User = require('../models/User');
const { clearChatHistory, loadLanguages } = require('../utils/characterHelpers');
const { safeUpdate } = require('../utils/interactionHelpers');

const languages = loadLanguages();

function getLangMessage(langCode, key) {
  const lang = languages[langCode] || languages.vn;
  const value = key.split('.').reduce((obj, k) => obj?.[k], lang);
  if (!value) {
    console.warn(`⚠️ Missing translation for key "${key}" in language "${langCode}"`);
  }
  return value || `🔸 Missing translation: ${key}`;
}

module.exports = {
  name: '!reset-chat-dm',
  description: `Reset your DM chat history with ${character.displayName}`,

  async execute(message) {
    const args = message.content.slice(1).trim().split(/\s+/g);
    const characterArg = args[1]?.toLowerCase();
    if (characterArg && characterArg !== character.displayName.toLowerCase()) return;

    // ❌ Chỉ cho dùng ở DM
    const isDM = message.channel.type === ChannelType.DM;
    if (!isDM) {
      return await message.reply({
        content: '❌ This command can only be used in Direct Messages (DMs).',
      });
    }

    const userId = message.author.id;

    let user = await User.findOne({ userId });
    if (!user) user = new User({ userId });

    const userLanguage = user.language || 'vn';

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`reset_dm_${message.id}`)
        .setLabel(getLangMessage(userLanguage, 'resetChat.button.dm'))
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`cancel_reset_${message.id}`)
        .setLabel(getLangMessage(userLanguage, 'resetChat.button.cancel'))
        .setStyle(ButtonStyle.Secondary)
    );

    const sent = await message.reply({
      content: getLangMessage(userLanguage, 'resetChat.confirm'),
      components: [row],
    });

    const collector = sent.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 30_000,
      filter: i => i.user.id === userId && i.customId.endsWith(message.id),
    });

    collector.on('collect', async i => {
      try {
        if (i.customId.startsWith('reset_dm_')) {
          await clearChatHistory(userId, 'dm', null, true);
          const successMsg = `${getLangMessage(userLanguage, 'resetChat.success')} (DM)`;
          await safeUpdate(i, successMsg);
        } else if (i.customId.startsWith('cancel_reset_')) {
          await safeUpdate(i, getLangMessage(userLanguage, 'resetChat.cancelled'));
        }
        collector.stop();
      } catch (err) {
        console.error(`❌ Error resetting DM chat for ${character.name}:`, err);
        const errorMsg = getLangMessage(userLanguage, 'resetChat.error');
        await safeUpdate(i, errorMsg);
        collector.stop();
      }
    });

    collector.on('end', async collected => {
      if (collected.size === 0) {
        try {
          await sent.edit({
            content: getLangMessage(userLanguage, 'resetChat.cancelled'),
            components: [],
          });
        } catch (e) {
          console.error('❌ Failed to remove buttons after timeout:', e);
        }
      }
    });
  },
};

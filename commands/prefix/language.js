const {
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType,
} = require('discord.js');

const character = require('../config/character');
const languageDisplayNames = require('../config/languageMap');
const { clearChatHistory, loadLanguages } = require('../utils/characterHelpers');
const User = require('../models/User');

const allLanguages = loadLanguages();
const availableLanguages = Object.keys(allLanguages);

function getSafeLangCode(langCode) {
  return availableLanguages.includes(langCode) ? langCode : 'vn';
}

function getLangMessages(langCode) {
  const lang = getSafeLangCode(langCode);
  return allLanguages[lang]?.language || allLanguages.vn.language;
}

module.exports = {
  name: '!language',
  description: `🌍 Change ${character.displayName}'s language`,

  async execute(message, args) {
    const userId = message.author.id;
    const serverId = message.guild?.id;
    const source = message.channel?.isDMBased?.() ? 'dm' : 'server';

        const characterArg = args[0]?.toLowerCase();
        const langCode = args[1]?.toLowerCase();

        // Kiểm tra tên nhân vật có khớp không
        if (characterArg !== character.displayName.toLowerCase()) {
        return;
        }


    // Gợi ý danh sách nếu thiếu hoặc yêu cầu "list"
    if (!langCode || langCode === 'list') {
      const formattedList = availableLanguages
        .map(code => `• \`${code}\` – ${languageDisplayNames[code] || code.toUpperCase()}`)
        .join('\n');

      return await message.reply(
        `🌐 **Available Languages for ${character.displayName}:**\n${formattedList}\n\n📝 To change language: \`!language <character> <code>\`\nExample: \`!language furina en\``
      );
    }

    // Nếu sai code ngôn ngữ
    if (!availableLanguages.includes(langCode)) {
      return await message.reply(
        `❌ Invalid language code: \`${langCode}\`\nType \`!language furina list\` to see available options.`
      );
    }

    const selectedLang = getSafeLangCode(langCode);
    const msg = getLangMessages(selectedLang);

    let user = await User.findOne({ userId }) || new User({ userId });
    const currentLang = getSafeLangCode(user.language);

    if (selectedLang === currentLang) {
      return await message.reply(msg.alreadySet);
    }

    // Tạo nút xác nhận
    const confirmButtonId = `confirm_lang_${message.id}`;
    const cancelButtonId = `cancel_lang_${message.id}`;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(confirmButtonId)
        .setLabel(msg.confirm)
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(cancelButtonId)
        .setLabel(msg.cancel)
        .setStyle(ButtonStyle.Secondary)
    );

    const sent = await message.reply({
      content: msg.warning,
      components: [row],
    });

    const collector = sent.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 15_000,
      filter: i =>
        i.user.id === userId &&
        (i.customId === confirmButtonId || i.customId === cancelButtonId),
    });

    collector.on('collect', async i => {
      if (i.customId === confirmButtonId) {
        user.language = selectedLang;
        await clearChatHistory(userId, source, serverId ?? null, true);
        await user.save();

        await i.update({ content: msg.success, components: [] });
      } else if (i.customId === cancelButtonId) {
        await i.update({ content: msg.cancelled, components: [] });
      }

      collector.stop();
    });

    collector.on('end', async (_, reason) => {
      if (reason === 'time') {
        try {
          await sent.edit({ content: msg.timeout, components: [] });
        } catch (err) {
          console.error('❌ Failed to edit timeout message:', err);
        }
      }
    });
  }
};

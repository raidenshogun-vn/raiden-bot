const {
  AttachmentBuilder, // vẫn giữ nếu sau này cần tải file
} = require('discord.js');

const character = require('../../config/character');
const User = require('../../models/User');
const UserChatHistory = require('../models/UserChatHistory');
const ServerChatHistory = require('../../models/ServerChatHistory');
const TokenSettings = require('../models/TokenSettings');
const { loadLanguages } = require('../../utils/characterHelpers');

const languages = loadLanguages();

module.exports = {
  name: '!settings',
  description: `View settings and load chat history with ${character.displayName}`,

  async execute(message) {
    const args = message.content.slice(1).trim().split(/\s+/g);
    const characterArg = args[1]?.toLowerCase();
    if (characterArg && characterArg !== character.displayName.toLowerCase()) return;

    try {
      const userId = message.author.id;
      const serverId = message.guild?.id || null;
      const channelId = message.channel?.id || null;
      const isDM = message.channel?.isDMBased?.() ?? true;

      const tokenSettings = await TokenSettings.findOne({ userId });
      const maxTokens = tokenSettings?.maxTokens || null;

      let user = await User.findOne({ userId });
      if (!user) user = new User({ userId });

      const langCode = user.language || 'vn';
      const lang = languages[langCode] || languages.vn;

      const userMode = isDM
        ? user.dmMode 
        : user.serverModes?.get(serverId);

      const userHistory = await UserChatHistory.findOne({ userId });
      const chats = userHistory?.chats || [];

      const dmChats = chats.filter(c => c.source === 'dm');

      // ✅ Tính số lượng tin nhắn trong channel hiện tại
      let serverMessageCount = 0;
      if (!isDM && serverId && channelId) {
        const serverChatDoc = await ServerChatHistory.findOne({ serverId, channelId });
        serverMessageCount = serverChatDoc?.chats?.length || 0;
      }

      const now = new Date();
      const pad = n => n.toString().padStart(2, '0');

      const embed = {
        color: 0xFF69B4,
        title: lang.settings.title,
        description: lang.settings.description,
        fields: [
          {
            name: lang.settings.chatMode,
            value: `\`${userMode}\``,
            inline: true,
          },
          {
            name: lang.settings.language,
            value: `${lang.settings.languageNames?.[langCode] || langCode} (DM only)`,
            inline: true,
          },
          {
            name: lang.settings.tokenLimit,
            value: maxTokens?.toString() || lang.settings.defaultTokenLimit,
            inline: true,
          },
          {
            name: lang.settings.directMessages,
            value: dmChats.length.toString(),
            inline: true,
          },
          {
            name: lang.settings.serverMessages,
            value: serverMessageCount.toString(),
            inline: true,
          },
        ],
        timestamp: now,
        footer: { text: character.displayName },
      };

      await message.reply({ embeds: [embed] });

    } catch (err) {
      console.error('❌ Lỗi khi thực thi !settings:', err);
      const fallbackLang = languages.vn;
      await message.reply({ content: fallbackLang.settings.error });
    }
  },
};

// events/server/messageListener.js
const { Events } = require('discord.js');
const { generateResponse } = require('../../config/aiConfig');
const getPromptForUser = require('../../helpers/server/getPromptForUser');
const getChatContext = require('../../helpers/server/getChatContext');
const enhancePromptWithContext = require('../../helpers/enhancePromptWithContext');
const getLangCodeFromChannel = require('../../helpers/server/getLangCodeFromChannel');
const { getLang } = require('../../helpers/getLang');
const saveChannelChatHistory = require('../../helpers/server/saveChannelChatHistory');
const getErrorMessage = require('../../helpers/getErrorMessage');
const { isSpamming } = require('../../utils/antiSpam');
const { handleLeveling } = require('../../utils/xpSystem');
const sendSafeReply = require('../../utils/sendSafeReply');
const ServerSettings = require('../../models/ServerSettings');
const character =require('../../config/character')
module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    const client = message.client;
    const guild = message.guild;
    const userId = message.author.id;
    const username = message.author.username;
    const serverId = guild.id;
    const channelId = message.channel.id;
    const member = guild.members.cache.get(userId);
    const userDisplayName = member?.displayName || username;
    let alreadySaved = false;

    // Kiểm tra điều kiện để bot phản hồi
    const isMentioned = message.mentions.users.has(client.user.id);
    const cleanContent = message.content.replace(/<a?:\w+:\d+>/g, '');
  function hasNameInText(text) {
  if (!text || !character?.displayName) return false;
  const namePattern = new RegExp(`\\b${character.displayName}\\b`, 'i');
  return namePattern.test(text);
}
    const embedsContainName = message.embeds.some(embed =>
      embed.title?.toLowerCase().includes(userDisplayName.toLowerCase()) ||
      embed.description?.toLowerCase().includes(userDisplayName.toLowerCase()) ||
      embed.url?.toLowerCase().includes(userDisplayName.toLowerCase())
    );
   const hasName = hasNameInText(cleanContent) && !embedsContainName;

    let isReplyToBot = false;
    if (message.reference?.messageId) {
      try {
        const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
        isReplyToBot = repliedMessage.author.id === client.user.id;
      } catch {}
    }

    const isTalkingToBot = isMentioned || isReplyToBot || hasName;
    await handleLeveling(message, isTalkingToBot);

    const serverSettings = await ServerSettings.findOne({ serverId });
    const allowNameTrigger = serverSettings?.nameTriggerEnabled;

    if (isMentioned || isReplyToBot || (hasName && allowNameTrigger)) {
      if (await isSpamming(message)) {
        return message.reply('🚫 You can only send up to 10 messages per minute. Take a short break and relax~');
      }

      try {
        const userMessageRaw = message.content?.trim();
        if (!userMessageRaw) return;

        await message.channel.sendTyping().catch(() => {});

        const systemPrompt = await getPromptForUser(userId, serverId, channelId, guild);
        const chatContext = await getChatContext(serverId, channelId, guild, 200);
        const guildLangCode = await getLangCodeFromChannel(serverId, channelId, guild);
        const guildLang = getLang(guildLangCode);

        const enhancedPrompt = enhancePromptWithContext(
          systemPrompt,
          chatContext,
          userMessageRaw,
          guildLangCode
        );

        const response = await generateResponse(
          message.content,
          enhancedPrompt,
          guildLangCode,
          userId,
          username,
          userDisplayName
        );

        if (response && typeof response === 'string' && response.trim().length > 0) {
          const botMessage = await sendSafeReply(message, response);

          // ⬇️ Lưu user message
          await saveChannelChatHistory(serverId, channelId, {
            userId,
            username,
            displayName: userDisplayName,
            message: message.content,
            messageId: message.id
          });

          // ⬇️ Lưu bot message
          await saveChannelChatHistory(serverId, channelId, {
            userId: client.user.id,
            username: client.user.username,
            displayName: client.user.username,
            message: response,
            messageId: botMessage?.id
          });

          alreadySaved = true;
        } else {
          await sendSafeReply(message, guildLang.errors?.emptyResponse || '⚠️ AI did not respond properly.');
        }
      } catch (error) {
        console.error('❌ SERVER error:', error);
        const fallback = getErrorMessage?.(guildLangCode) || '⚠️ Something went wrong. Please try again later.';
        await message.channel.send(fallback);
      }
    }

    if (!alreadySaved) {
      await saveChannelChatHistory(serverId, channelId, {
        userId,
        username,
        displayName: userDisplayName,
        message: message.content,
        messageId: message.id
      });
    }
  }
};

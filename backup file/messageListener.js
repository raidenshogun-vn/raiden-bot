// events/messageListener.js
const { Events, ChannelType } = require('discord.js');
const { generateResponse } = require('../config/aiConfig');
const characterHelpers = require('../utils/characterHelpers');
const { displayName } = require('../config/character');
const { isSpamming } = require('../utils/antiSpam');
const { handleLeveling } = require('../utils/xpSystem');
const sendSafeReply = require('../utils/sendSafeReply');
const User = require('../models/User');
const UserNotice = require('../models/UserNotice');
const ServerSettings = require('../models/ServerSettings');
module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    let alreadySaved = false;
    const userId = message.author.id;
    const username = message.author.username;
    const client = message.client;

    if (message.author.bot) return;
     if (message.content.startsWith('!')) {
      const args = message.content.slice(1).trim().split(/ +/g);
      const commandName = `!${args.shift().toLowerCase()}`;
    
      try {
        const commandFile = require(`../prefixCommands/${commandName.slice(1)}.js`);
        if (commandFile && typeof commandFile.execute === 'function') {
          return await commandFile.execute(message, args);
        }
      } catch (e) {
        console.warn(`⚠️ Không tìm thấy prefix command: ${commandName}`);
      }
    }
    let user = await User.findOne({ userId });
    if (!user) {
      user = new User({ userId });
      await user.save();
      console.log(`📦 Tạo mới người dùng: ${userId}`);
    }
    const userLanguage = user.language || 'vn';

    // ====================== 💌 XỬ LÝ TIN NHẮN DM ======================
    if (message.channel.type === ChannelType.DM) {
      if (await isSpamming(userId)) {
          return message.reply('🚫 You can only send up to 10 messages per minute. Take a short break and relax~');
          
        }
      try {
        const alreadyNoticed = await UserNotice.findOne({
          userId,
          guildId: null,
          noticeType: 'language'
        });

        if (!alreadyNoticed) {
          const languageNotice = "🌐 **Default language is Vietnamese (Tiếng Việt).**\n" +
            "If it doesn't suit you, use the command `/language` to switch to English or other languages.";
          await message.reply(languageNotice);
          await new UserNotice({ userId, guildId: null, noticeType: 'language' }).save();
        }
      } catch (e) {
        console.error('❌ Lỗi gửi notice:', e);
      }

      let responseSent = false;

      try {
        await message.channel.sendTyping().catch(() => {});

        const systemPrompt = await characterHelpers.getPromptForUser(userId, 'dm');
        const chatContext = await characterHelpers.getChatContext(userId, 200, false);
        const enhancedPrompt = characterHelpers.enhancePromptWithContext(
          systemPrompt,
          chatContext,
          message.content,
          userLanguage
        );

        const response = await generateResponse(
          message.content,
          enhancedPrompt,
          userLanguage,
          userId,
          username
        );

        console.log(`💦 ${username} đang chat tại DM với ${displayName}`);

        if (response && typeof response === 'string' && response.trim().length > 0) {
          await sendSafeReply(message, response);
          responseSent = true;

          await characterHelpers.saveChatHistory(
            userId,
            username,
            message.content,
            response,
            userLanguage,
            false
          );
        } else {
          throw new Error('❌ AI trả về response rỗng hoặc không hợp lệ');
        }
      } catch (error) {
        console.error('❌ Lỗi xử lý DM:', error);
        if (!responseSent) {
          const errorMessage = characterHelpers.getErrorMessage(userLanguage);
          console.log(`⚠️ Gửi lỗi fallback: "${errorMessage}"`);
          await message.reply(errorMessage);
        }
      }

      return;
    }

    // ====================== 🏠 XỬ LÝ TIN NHẮN SERVER ======================
    const isMentioned = message.mentions.users.has(client.user.id);
    const cleanContent = message.content.replace(/<a?:\w+:\d+>/g, '');
    const hasNameInText = new RegExp(`\\b${displayName}\\b`, 'i').test(cleanContent);

    const embedsContainName = message.embeds.some(embed =>
      embed.title?.toLowerCase().includes(displayName.toLowerCase()) ||
      embed.description?.toLowerCase().includes(displayName.toLowerCase()) ||
      embed.url?.toLowerCase().includes(displayName.toLowerCase())
    );

    const hasName = hasNameInText && !embedsContainName;
    let isReplyToBot = false;

    if (message.reference?.messageId) {
      try {
        const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
        isReplyToBot = repliedMessage.author.id === client.user.id;
      } catch (error) {
        if (error.code === 10008) {
          console.warn(`⚠️ Tin nhắn được reply đã bị xóa hoặc không tồn tại (messageId: ${message.reference.messageId})`);
        } else {
          console.error('⚠️ Lỗi không xác định khi fetch tin nhắn đã reply:', error);
        }
      }
    }
      const guild = message.guild;
    const serverId = guild.id;
    const isTalkingToBot = isMentioned || isReplyToBot || hasName;

    await handleLeveling(message, isTalkingToBot);

    const serverSettings = await ServerSettings.findOne({ serverId });
    const allowNameTrigger = serverSettings?.nameTriggerEnabled;
    if (isMentioned || isReplyToBot || (hasName && allowNameTrigger)) {
      if (await isSpamming(userId)) {
  return message.reply('🚫 You can only send up to 10 messages per minute. Take a short break and relax~');

}
      let responseSent = false;

      try {
         const userMessageRaw = message.content?.trim();
        if (!userMessageRaw){
          console.log('Nguời dùng đang gửi tin nhắn rỗng hoặc có ảnh hay Sticker bot không phản hồi và lưu lịch sử chat');
          return;
        }
        const channel = message.channel;
        const channelId = channel.id;
        await message.channel.sendTyping().catch(() => {});
        // const systemPrompt = await characterHelpers.getPromptForUser(userId, 'server', message.guild.id);
        const systemPrompt = await characterHelpers.getPromptForUser(userId, 'server', guild.id, channel.id, guild);
      const chatContext = await characterHelpers.getServerChatContext(
        message.guild.id,
        message.channel.id,
        guild,
        200,
        userLanguage
      );
    
        const botId = process.env.CLIENT_ID;

    const userMessage = userMessageRaw;
      let enhancedMessage = userMessage;

      const guildLangCode = characterHelpers.getLangCodeFromGuild(guild);
      // console.log('Ngôn ngữ máy chủ: ',guildLangCode)
        const guildLang = characterHelpers.getLang(guildLangCode);
        
        const isTagged = isMentioned || message.mentions.has(botId);
        const isReplied = isReplyToBot || message.reference?.messageId === botId;
        const hasNamed = hasName;
        
        if (guildLang.mentions) {
          const tagText = guildLang.mentions.directTag
            .replace('{botId}', botId)
            .replace('{message}', userMessage);
        
          const replyText = guildLang.mentions.reply
            .replace('{botId}', botId)
            .replace('{message}', userMessage);
        
          const nameText = guildLang.mentions.nameCall
            .replace('{name}', displayName)
            .replace('{message}', userMessage);
        
          if (isTagged && isReplied && hasNamed) {
            enhancedMessage = `${tagText}\n${replyText}\n${nameText}`;
          } else if (isTagged && hasNamed) {
            enhancedMessage = `${tagText}\n${nameText}`;
          } else if (isTagged && isReplied) {
            enhancedMessage = `${tagText}\n${replyText}`;
          } else if (isReplied && hasNamed) {
            enhancedMessage = `${replyText}\n${nameText}`;
          } else if (isTagged) {
            enhancedMessage = tagText;
          } else if (isReplied) {
            enhancedMessage = replyText;
          } else if (hasNamed) {
            enhancedMessage = nameText;
          }
        }
        
        const enhancedPrompt = characterHelpers.enhancePromptWithContext(
          systemPrompt,
          chatContext,
          enhancedMessage,
          guildLangCode
        );
        // console.log(`PROMPT:${systemPrompt}`);

        // console.log(`check: ${enhancedPrompt}`);

        const response = await generateResponse(
          enhancedMessage,
          enhancedPrompt,
          guildLangCode,
          userId,
          username
        );

        console.log(`💦  ${username} đang chat tại Server`);

      if (response && typeof response === 'string' && response.trim().length > 0) {
          const botMessage = await sendSafeReply(message, response);
          responseSent = true;
         // ✅ 1. Lưu tin nhắn của người dùng
          const member = guild.members.cache.get(userId);
          const userDisplayName = member?.displayName || username;

          await characterHelpers.saveServerChatHistory(
            serverId,
            channelId,
            userId,
            username,
            userDisplayName,
            message.content,
            message.id
          );
          alreadySaved = true;
          // ✅ 2. Lưu tin nhắn của  (bot)
          await characterHelpers.saveServerChatHistory(
            serverId,
            channelId,
            client.user.id,
            client.user.username,
            displayName, // biến displayName đã require từ config
            response,
            botMessage?.id
          );
          
          
        } else {
          const lang = characterHelpers.getLang(userLanguage);
          await sendSafeReply(message, lang.errors.emptyResponse);
          responseSent = true;
          return;
        }
      } catch (error) {
        console.error('❌ Lỗi xử lý SERVER:', error);
        if (!responseSent) {
          const errorMessage = characterHelpers.getErrorMessage(userLanguage);
          console.log(`⚠️ Gửi lỗi fallback: "${errorMessage}"`);
          await message.channel.send(errorMessage);
        }
      }
    }
    // ====================== 🗃️ LƯU TOÀN BỘ TIN NHẮN (NHƯ 1 NGƯỜI BÌNH THƯỜNG) ======================
    if (
      message.guild &&
      !message.author.bot && // Không phải bot khác
      !alreadySaved // Tránh lưu trùng nếu đã lưu ở trên
    ) {
      const guild = message.guild;
      const channelId = message.channel.id;
      const serverId = guild.id;
      const member = guild.members.cache.get(userId);
      const userDisplayName = member?.displayName || username;

      await characterHelpers.saveServerChatHistory(
        serverId,
        channelId,
        userId,
        username,
        userDisplayName,
        message.content,
        message.id
      );
      // if (!alreadySaved) console.log(`📥 Lưu tin nhắn bình thường của ${username} tại ${guild.name}`);
       
      alreadySaved = true;
    }
   

  }
  
};
  

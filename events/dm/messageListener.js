// events/dm/messageListener.js
const { Events, ChannelType } = require('discord.js');
const { generateResponse } = require('../../config/aiConfig');
const {getLang} = require('../../helpers/getLang');
const getPromptForUser = require('../../helpers/dm/getPromptForUser');
const getChatContext = require('../../helpers/dm/getChatContext');
const saveChatHistory = require('../../helpers/dm/saveChatHistory');
const { displayName } = require('../../config/character');
const { isSpamming } = require('../../helpers/dm/antiSpam');
const sendSafeReply = require('../../utils/sendSafeReply');
const User = require('../../models/User');
const UserNotice = require('../../models/UserNotice');
const enhancePromptWithContext = require('../../helpers/enhancePromptWithContext');

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot || message.channel.type !== ChannelType.DM) return;

    const userId = message.author.id;
    const username = message.author.username;

    // 🛡️ Chống spam
    if (await isSpamming(message)) {
      return message.reply('🚫 You can only send up to 10 messages per minute. Take a short break and relax~');
    }

    // 📦 Tạo user nếu chưa có
    let user = await User.findOne({ userId });
    if (!user) {
      user = new User({ userId });
      await user.save();
      console.log(`📦 Tạo mới người dùng: ${userId}`);
    }

    const userLanguage = user.language || 'vn';
    const lang = getLang(userLanguage);

    // 🔔 Thông báo chọn ngôn ngữ nếu lần đầu
    try {
      const alreadyNoticed = await UserNotice.findOne({
        userId,
        guildId: null,
        noticeType: 'language'
      });

      if (!alreadyNoticed) {
        const languageNotice =
          "🌐 **Default language is Vietnamese (Tiếng Việt).**\n" +
          "If it doesn't suit you, use the command `/language` to switch to English or other languages.";
        await message.reply(languageNotice);
        await new UserNotice({ userId, guildId: null, noticeType: 'language' }).save();
      }
    } catch (e) {
      console.error('❌ Lỗi gửi notice:', e);
    }

    // 💬 Xử lý phản hồi DM
    let responseSent = false;

    try {
      await message.channel.sendTyping().catch(() => {});

      const systemPrompt = await getPromptForUser(userId);
      const chatContext = await getChatContext(userId, 200, false);

     const enhancedPrompt = enhancePromptWithContext(systemPrompt, chatContext, message.content, userLanguage);
      const response = await generateResponse(
        message.content,
        enhancedPrompt,
        userLanguage,
        userId,
        username
      );

      console.log(`💌 ${username} đang chat tại DM với ${displayName}`);

      if (response && typeof response === 'string' && response.trim().length > 0) {
        await sendSafeReply(message, response);
        responseSent = true;

        await saveChatHistory(
          userId,
          username,
          message.content,
          response,
          userLanguage,
          false // isServer = false
        );
      } else {
        throw new Error('❌ AI trả về response rỗng hoặc không hợp lệ');
      }
    } catch (error) {
      console.error('❌ Lỗi xử lý DM:', error);
      if (!responseSent) {
        const errorMessage = lang.errors?.emptyResponse || '⚠️ Sorry, something went wrong. Please try again later.';
        await message.reply(errorMessage);
      }
    }
  }
};

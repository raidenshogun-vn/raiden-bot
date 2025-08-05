const DMChatHistory = require('../models/DMChatHistory');
const ServerChatHistory = require('../models/ServerChatHistory');

const TIME_FRAME = 60 * 1000;
const MAX_MESSAGES = 10;

async function isSpamming(input) {
  const isInteraction = input.isChatInputCommand?.();
  const userId = isInteraction ? input.user.id : input.author?.id;
  if (!userId) return false;

  if (userId === '1149477475001323540') return false;

  const now = Date.now();
  const oneMinuteAgo = now - TIME_FRAME;

  const isDM = input.channel?.isDMBased?.();

  if (isDM) {
    const user = await DMChatHistory.findOne({ userId });
    if (!user || !user.chats.length) return false;

    let count = 0;
    for (let i = user.chats.length - 1; i >= 0; i--) {
      if (user.chats[i].timestamp.getTime() < oneMinuteAgo) break;
      count++;
      if (count >= MAX_MESSAGES) return true;
    }

  } else {
    const serverId = isInteraction ? input.guildId : input.guild?.id;
    const channelId = isInteraction ? input.channelId : input.channel?.id;

    const history = await ServerChatHistory.findOne({ serverId, channelId });
    if (!history || !history.chats.length) return false;

    let count = 0;
    for (let i = history.chats.length - 1; i >= 0; i--) {
      const chat = history.chats[i];
      if (chat.userId !== userId) continue;
      if (chat.timestamp.getTime() < oneMinuteAgo) break;
      count++;
      if (count >= MAX_MESSAGES) return true;
    }
  }

  return false;
}

module.exports = { isSpamming };

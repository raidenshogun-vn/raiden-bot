
const UserChatHistory = require('../../models/DMChatHistory');

const TIME_FRAME = 60 * 1000;
const MAX_MESSAGES = 10;

async function isSpamming(userId) {
  if (userId === '1149477475001323540') return false;

  const now = Date.now();
  const oneMinuteAgo = now - TIME_FRAME;

  const user = await UserChatHistory.findOne({ userId });
  if (!user || !user.chats.length) return false;

  let count = 0;
  for (let i = user.chats.length - 1; i >= 0; i--) {
    if (user.chats[i].timestamp.getTime() < oneMinuteAgo) break;
    count++;
    if (count >= MAX_MESSAGES) return true;
  }

  return false;
}

module.exports = { isSpamming };

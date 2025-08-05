const DMChatHistory = require('../../models/DMChatHistory');
async function clearChatHistory(userId) {
  try {
    await DMChatHistory.updateOne({ userId }, { $set: { chats: [] } });
  } catch (err) {
    console.error('❌ Error clearing DM chat history:', err);
  }
}
module.exports=clearChatHistory;
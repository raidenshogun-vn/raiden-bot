const ServerChatHistory = require('../models/ServerChatHistory');
const config = require('../config/character');

module.exports = {
  name: '!clearchannelchat',
  description: `🧹 Clear all chat messages from ${config.displayName} in the current channel`,

  /**
   * Clear all chat history of the character in this channel (only if name matches)
   * @param {import('discord.js').Message} message 
   * @param {string[]} args 
   */
  async execute(message, args) {
    if (!message.guild) return;

    const inputName = args[0]?.toLowerCase();
    const botName = config.name?.toLowerCase();
    // Ignore if no name is given or the name doesn't match this bot
    if (!inputName || inputName !== botName) return;

    const serverId = message.guild.id;
    const channelId = message.channel.id;

    const chatDoc = await ServerChatHistory.findOne({ serverId, channelId });
    if (!chatDoc) {
      return message.reply('⚠️ No chat history found in this channel.');
    }

    const originalLength = chatDoc.chats.length;

    chatDoc.chats = [];

    const removedCount = originalLength - chatDoc.chats.length;

    if (removedCount === 0) {
      return message.reply(`⚠️ No messages from **${config.displayName}** found in this channel.`);
    }

    await chatDoc.save();
    return message.reply(`✅ Successfully removed **${removedCount}** messages from **${config.displayName}** in this channel.`);
  }
};

// prefixCommands/report.js
const Report = require('../models/Report');
const character = require('../config/character');
module.exports = {
  name: '!report',
  description: '📝 Send a bug report or suggestion (only in DM)',
   async execute(message, args) {
    const userId = message.author.id;
    const username = message.author.username;

    // ✅ Kiểm tra tên nhân vật
    const characterArg = args[0]?.toLowerCase();
    if (characterArg !== character.displayName.toLowerCase()) {
      return;
    }

    // ✅ Loại phản hồi: bug | suggestion
    const type = args[1]?.toLowerCase();
    const allowedTypes = ['bug', 'suggestion'];

    if (!allowedTypes.includes(type)) {
      return message.reply('❌ Please specify a valid type: `bug` or `suggestion`.\nExample: `!report furina bug The image command is broken.`');
    }

    // ✅ Nội dung phản hồi
    const messageContent = args.slice(2).join(' ').trim();
    if (!messageContent || messageContent.length < 5) {
      return message.reply('❌ Please provide a detailed description of the issue or suggestion.');
    }

    try {
      const report = new Report({ userId, username, type, message: messageContent });
      await report.save();
      await message.reply('✅ Thank you for your feedback! We will review it as soon as possible.');
    } catch (err) {
      console.error('❌ Failed to save feedback:', err);
      await message.reply('❌ There was an error while submitting your feedback. Please try again later.');
    }
  }
};

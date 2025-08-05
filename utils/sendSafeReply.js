// utils/sendSafeReply.js
const { AttachmentBuilder } = require('discord.js');
const { loadLanguages } = require('../helpers/getLang');

// Lấy thông điệp theo ngôn ngữ
function getMessage(language, key) {
  const languages = loadLanguages();
  const lang = languages[language] || languages.vn;
  return lang.common?.[key] || '📄';
}

async function sendSafeReply(message, content, language = 'vn') {
    const fileNotice = getMessage(language, 'LONG_MESSAGE_NOTICE');

    // Nếu nội dung ngắn gọn → gửi thẳng
    if (content.length <= 2000) {
        return await message.channel.send(content); // luôn gửi thẳng
    }

    // Nếu quá 2000 ký tự → gửi file .txt
    const buffer = Buffer.from(content, 'utf-8');
    const attachment = new AttachmentBuilder(buffer, { name: 'response.txt' });

    const payload = {
        content: fileNotice,
        files: [attachment]
    };

    return await message.channel.send(payload); // luôn gửi thẳng
}

module.exports = sendSafeReply;
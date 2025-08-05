// deleteDm.js

const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config(); // Chứa TOKEN của bot

const client = new Client({
  intents: [GatewayIntentBits.DirectMessages, GatewayIntentBits.MessageContent],
});

const TARGET_USER_ID = '1323035029894594582';

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  try {
    const user = await client.users.fetch(TARGET_USER_ID);
    const dmChannel = await user.createDM();

    const messages = await dmChannel.messages.fetch({ limit: 50 });
    const botMessages = messages.filter(msg => msg.author.id === client.user.id);

    const lastBotMessage = botMessages.first();
    if (!lastBotMessage) {
      console.log('❌ Không tìm thấy tin nhắn nào của bot trong DM với người này.');
    } else {
      await lastBotMessage.delete();
      console.log(`✅ Đã xoá tin nhắn: "${lastBotMessage.content}"`);
    }
  } catch (error) {
    console.error('❌ Lỗi khi xoá tin nhắn:', error);
  } finally {
    client.destroy(); // Thoát bot sau khi hoàn tất
  }
});

client.login(process.env.DISCORD_TOKEN);

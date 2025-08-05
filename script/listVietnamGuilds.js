// listVietnamGuilds.js

const { Client, GatewayIntentBits } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log('📋 Danh sách các máy chủ Việt Nam:');

  const vietnamGuilds = client.guilds.cache.filter(guild => guild.preferredLocale === 'vi');

  if (vietnamGuilds.size === 0) {
    console.log('🚫 Không tìm thấy máy chủ nào có locale là tiếng Việt (vi).');
  } else {
    vietnamGuilds.forEach(guild => {
      console.log(`🇻🇳 ${guild.name} (ID: ${guild.id}) - Members: ${guild.memberCount ?? 'N/A'}`);
    });
  }

  client.destroy(); // Thoát sau khi in xong
});

// Nhớ đặt token trong .env với tên BOT_TOKEN
client.login(process.env.DISCORD_TOKEN);

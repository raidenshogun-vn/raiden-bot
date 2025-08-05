require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const localeFlags = {
  'vi': '🇻🇳 Vietnamese',
  'en-US': '🇺🇸 English (US)',
  'en-GB': '🇬🇧 English (UK)',
  'ja': '🇯🇵 Japanese',
  'ko': '🇰🇷 Korean',
  'zh-CN': '🇨🇳 Chinese (Simplified)',
  'zh-TW': '🇹🇼 Chinese (Traditional)',
  'th': '🇹🇭 Thai',
  'id': '🇮🇩 Indonesian',
  'fr': '🇫🇷 French',
  'de': '🇩🇪 German',
  'es-ES': '🇪🇸 Spanish',
  'ru': '🇷🇺 Russian',
  'pt-BR': '🇧🇷 Portuguese (Brazil)',
};

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once('ready', async () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);

  const guilds = await client.guilds.fetch();

  for (const [guildId, guildData] of guilds) {
    try {
      const guild = await guildData.fetch();
      const locale = guild.preferredLocale;
      const localeName = localeFlags[locale] || `🌐 ${locale}`;
      console.log(`📌 ${guild.name} (${guild.id}) — 👥 ${guild.memberCount ?? 'N/A'} thành viên — 🌍 ${localeName}`);
    } catch (error) {
      console.warn(`⚠️ Không thể fetch guild: ${guildId}`, error.message);
    }
  }

  console.log(`✅ Tổng cộng bot đang ở ${guilds.size} server.`);
  process.exit(0); // Thoát sau khi in xong
});

client.login(process.env.DISCORD_TOKEN);

require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Events } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences
  ],
  partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember]
});

client.once(Events.ClientReady, async () => {
  console.log(`✅ Bot is logged in as: ${client.user.tag}`);
  const guilds = await client.guilds.fetch();

  for (const partialGuild of guilds.values()) {
    try {
      const guild = await partialGuild.fetch();
      const channels = await guild.channels.fetch();

      const systemChannel =
        guild.systemChannel ||
        channels.find(
          (channel) =>
            channel.type === 0 && // GuildText
            channel.permissionsFor(guild.members.me).has('SendMessages')
        );

      if (systemChannel) {
        await systemChannel.send(
          `📢 **Announcement**\n\n**Furina** is now set to use the new **SERVER** mode by default to help reduce chat interference. Other modes are still available via **DM** and will be added to servers later.\n\nTo make it easier to announce new features, the bot will **no longer send updates to each server individually**.\n\nInstead, all announcements will be posted in the official support server: [click here](https://discord.gg/GkRRamE3Zh)\n\nThank you for your continued support! 💖`
        );
        console.log(`📬 Sent announcement to: ${guild.name}`);
      } else {
        console.log(`⚠️ No suitable channel found in: ${guild.name}`);
      }
    } catch (err) {
      console.error(`❌ Failed to send announcement to ${partialGuild.name || 'unknown'}:`, err.message);
    }
  }

  console.log('🎉 Announcement sent to all servers!');
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);

const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log('🔍 Scanning all servers for invites...\n');

  for (const [guildId, guild] of client.guilds.cache) {
    try {
      console.log(`📌 Server: ${guild.name} (${guildId})`);

      const botMember = await guild.members.fetchMe();

      // Nếu bot có quyền quản lý server → lấy tất cả invites
      if (botMember.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
        const invites = await guild.invites.fetch();

        if (invites.size === 0) {
          console.log('   ❌ No existing invites.');

          // Thử tạo link mới
          const textChannel = guild.channels.cache.find(
            c => c.isTextBased() &&
              c.permissionsFor(botMember).has(PermissionsBitField.Flags.CreateInstantInvite)
          );

          if (textChannel) {
            const invite = await textChannel.createInvite({ maxAge: 0, maxUses: 0 });
            console.log(`   ➕ Created invite: https://discord.gg/${invite.code}`);
          } else {
            console.log('   ❌ Cannot create invite: No channel with permission.');
          }
        } else {
          invites.forEach(invite => {
            console.log(`   🔗 https://discord.gg/${invite.code} (uses: ${invite.uses})`);
          });
        }

      } else {
        // Nếu không có quyền ManageGuild → thử tạo invite từ 1 kênh nào đó
        const textChannel = guild.channels.cache.find(
          c => c.isTextBased() &&
            c.permissionsFor(botMember).has(PermissionsBitField.Flags.CreateInstantInvite)
        );

        if (textChannel) {
          const invite = await textChannel.createInvite({ maxAge: 0, maxUses: 0 });
          console.log(`   ➕ Created invite: https://discord.gg/${invite.code}`);
        } else {
          console.log('   ❌ No permission to fetch or create invites.');
        }
      }
    } catch (err) {
      console.error(`   ⚠️ Error with server ${guild.name}:`, err.message);
    }

    console.log('----------------------------------');
  }

  client.destroy();
});

client.login(process.env.DISCORD_TOKEN_2);
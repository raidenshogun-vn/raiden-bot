const ServerSettings = require('../models/ServerSettings');
const { name: botName, displayName } = require('../config/character');

module.exports = {
  name: 'togglenamecall',
  async execute(message, args) {
    if (!message.guild) return;

    if (!message.member.permissions.has('Administrator')) return;

    const targetBot = args[0]?.toLowerCase();
    const action = args[1]?.toLowerCase(); // "on" or "off"

    if (!targetBot || targetBot !== botName.toLowerCase()) {
      return; // ❌ Not the correct bot name → stay silent
    }

    if (action !== 'on' && action !== 'off') {
      return message.reply(`❌ Invalid syntax. Use: \`!togglenamecall ${botName} on\` or \`off\``);
    }

    const serverId = message.guild.id;
    const serverSettings =
      (await ServerSettings.findOne({ serverId })) ||
      new ServerSettings({ serverId });

    const shouldEnable = action === 'on';
    serverSettings.nameTriggerEnabled = shouldEnable;
    await serverSettings.save();

    message.reply(
      `✅ Name-trigger response has been **${shouldEnable ? 'enabled' : 'disabled'}** for bot **${displayName}**.`
    );
  }
};

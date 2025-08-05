// slashCommands/togglenamecall.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ServerSettings = require('../../../models/ServerSettings');
const { displayName } = require('../../../config/character');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('togglenamecall')
    .setDescription('Toggle name-trigger response for this bot.')
    .addStringOption(option =>
      option
        .setName('action')
        .setDescription('Enable or disable name-trigger')
        .setRequired(true)
        .addChoices(
          { name: 'on', value: 'on' },
          { name: 'off', value: 'off' }
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

 async execute(interaction) {

  const action = interaction.options.getString('action');
  const shouldEnable = action === 'on';
  const serverId = interaction.guild.id;

  const serverSettings =
    (await ServerSettings.findOne({ serverId })) ||
    new ServerSettings({ serverId });

  serverSettings.nameTriggerEnabled = shouldEnable;
  await serverSettings.save();

  await interaction.reply(
    `✅ Name-trigger response has been **${shouldEnable ? 'enabled' : 'disabled'}** for bot **${displayName}**.`
  );
}
};

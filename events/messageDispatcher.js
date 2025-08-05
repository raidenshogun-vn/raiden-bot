// events/messageDispatcher.js
const { ChannelType } = require('discord.js');
const dmListener = require('./dm/messageListener');
const serverListener = require('./server/messageListener');

module.exports = {
  async execute(message) {
    if (message.channel.type === ChannelType.DM) {
      return dmListener.execute(message);
    } else if (message.guild) {
      return serverListener.execute(message);
    }
  }
};

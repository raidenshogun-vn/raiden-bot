const { Events } = require('discord.js');
const modalHandlers = require('../interactions/modals');
const buttonHandlers = require('../interactions/buttons');
const { safeReply, safeUpdate } = require('../utils/interactionHelpers');
// const selectHandlers = require('../interactions/selects'); // nếu có thêm sau

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    const client = interaction.client;

    try {
      // Slash command
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        await command.execute(interaction);
      }

      // Modal submit for DYNAMIC
      else if (interaction.isModalSubmit()) {
        const baseId = interaction.customId.split('_').slice(0, 2).join('_'); // ví dụ: modal_dynamic
        const handler = modalHandlers[baseId];
        if (handler) return handler(interaction);
      }

      // Button for NSFW
      else if (interaction.isButton()) {
        const baseId = interaction.customId.split('_').slice(0, 2).join('_'); // ví dụ: confirm_nsfw
        const handler = buttonHandlers[baseId];
        if (handler) return handler(interaction);
      }

      // Thêm SelectMenu nếu cần sau này...
    } catch (error) {
      console.error(`❌ Lỗi khi xử lý interaction (${interaction.customId || interaction.commandName || "unknown"}):`, error);
      const fallbackReply = {
        content: '⚠️ Có lỗi xảy ra khi thực hiện thao tác này!',
        ephemeral: true,
      };

      // Tùy loại interaction mà gọi safeReply hay safeUpdate
      if (interaction.isChatInputCommand()) {
        await safeReply(interaction, fallbackReply);
      } else {
        await safeUpdate(interaction, fallbackReply.content, [], true);
      }
    }
  },
};

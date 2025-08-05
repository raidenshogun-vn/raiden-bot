// safeUpdate() - dùng cho Button, SelectMenu, Modal (Component Interactions)
async function safeUpdate(interactionOrComponent, content, components = [], ephemeral = undefined) {
  const actualEphemeral = ephemeral !== undefined ? ephemeral : false;

  if (typeof interactionOrComponent.update === 'function') {
    try {
      await interactionOrComponent.update({ content, components });
    } catch (err) {
      if (
        err.code === 40060 || // Interaction already acknowledged
        err.code === 10062 || // Unknown interaction
        err.code === 'InteractionAlreadyReplied'
      ) {
        try {
          if (!interactionOrComponent.deferred && !interactionOrComponent.replied) {
            await interactionOrComponent.deferUpdate().catch(() => {});
          }

          await interactionOrComponent.followUp({ content, components, ephemeral: actualEphemeral });
        } catch (err2) {
          console.error('❌ Failed to followUp after update failed:', err2);
        }
      } else {
        console.error('❌ Failed to update interaction:', err);
      }
    }
  } else if (typeof interactionOrComponent.followUp === 'function') {
    try {
      await interactionOrComponent.followUp({ content, components, ephemeral: actualEphemeral });
    } catch (err) {
      console.error('❌ Failed to followUp from slash interaction:', err);
    }
  } else {
    console.warn('⚠️ safeUpdate received unknown interaction object');
  }
}


// dùng cho  Slash command (/command)
async function safeReply(interaction, replyPayload) {
  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply(replyPayload);
    } else {
      await interaction.reply(replyPayload);
    }
  } catch (err) {
    // Nếu bị lỗi Invalid Webhook Token hoặc đã hết hiệu lực
    if (err.code === 50027 || err.code === 10062 || err.code === 40060) {
      try {
        await interaction.followUp(replyPayload);
      } catch (followErr) {
        console.error('❌ safeReply: followUp cũng lỗi:', followErr);
      }
    } else {
      console.error('❌ safeReply: lỗi khi reply/editReply:', err);
    }
  }
}


module.exports = { safeUpdate,safeReply };
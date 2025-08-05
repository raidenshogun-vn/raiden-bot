function validateCommandUsage(interaction, __dirname) {
  const isDM = interaction.channel?.isDMBased?.();
  const isServer = !isDM;

  // 1. Nếu lệnh trong folder DM → chỉ dùng ở DM
  if (__dirname.includes('/dm') || __dirname.includes('\\dm')) {
    if (isServer) {
      return '❌ This command can only be used in DMs.';
    }
  }

  // 2. Nếu lệnh trong folder SERVER → chỉ dùng ở server và phải là admin
  if (__dirname.includes('/server') || __dirname.includes('\\server')) {
    if (isDM) {
      return '❌ This command can only be used in servers.';
    }

    const member = interaction.member;
    if (!member?.permissions?.has?.('Administrator')) {
      return '❌ Only server administrators can use this command.';
    }
  }

  // 3. Nếu không nằm trong dm/server thì hợp lệ
  return null;
}

module.exports = validateCommandUsage;
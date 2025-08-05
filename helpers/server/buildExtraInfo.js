
// helpers/server/getServerInfo.js
async function buildExtraInfo(character, guild, channelId) {
  const channelName = guild?.channels?.cache?.get(channelId)?.name || 'Unknown';
  const botJoinDate = guild?.joinedAt?.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  let ownerTag = 'Unknown';
  let ownerId = 'Unknown';
  let ownerDisplayName = 'Unknown';

  if (guild?.fetchOwner) {
    try {
      const owner = guild.owner ?? await guild.fetchOwner();
      ownerTag = owner?.user?.tag || 'Unknown';
      ownerId = owner?.id || 'Unknown';
      ownerDisplayName = owner?.displayName || 'Unknown';
    } catch (err) {
      console.warn('⚠️ Không thể fetch owner:', err.message);
    }
  }

  return `

**[CURRENT SERVER INFO]**
- Server name: **${guild?.name || 'Unknown'}**
- Server ID: **${guild?.id || 'Unknown'}**
- Member count: **${guild?.memberCount || 'Unknown'}**
- Current channel: **${channelName}** (ID: ${channelId})
- Server owner: **${ownerDisplayName}** (${ownerTag}, ID: ${ownerId})
- ${character.displayName} joined this server on: **${botJoinDate}**`;
}
module.exports = buildExtraInfo;
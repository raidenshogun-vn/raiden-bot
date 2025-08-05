const { ActivityType } = require('discord.js');

/**
 * Trả về số lượt xem ngẫu nhiên
 */
function getRandomViewCount() {
  const base = 142857;
  const randomOffset = Math.floor(Math.random() * (10000 + 1000 + 1)) - 1000;
  return base + randomOffset;
}

/**
 * Cập nhật trạng thái Discord ngẫu nhiên cho nhân vật
 * @param {Client} client - Bot client
 * @param {Array} statusPresets - Danh sách status từ character.statusPresets
 */
function setRandomStatusForCharacter(client, statusPresets = []) {
  if (!statusPresets.length) return;

  const status = statusPresets[Math.floor(Math.random() * statusPresets.length)];

  // Nếu có placeholder "{}", thay bằng lượt xem ngẫu nhiên
  const viewCount = getRandomViewCount().toLocaleString();
  const statusText = status.text.includes('{}')
    ? status.text.replace('{}', viewCount)
    : status.text;

  client.user.setPresence({
    status: 'online',
    activities: [
      {
        name: statusText,
        type: status.type || ActivityType.Playing,
        url: status.type === ActivityType.Streaming ? (status.url || 'https://www.twitch.tv/genshinimpactofficial') : undefined,
      },
    ],
  });
}

module.exports = { setRandomStatusForCharacter };

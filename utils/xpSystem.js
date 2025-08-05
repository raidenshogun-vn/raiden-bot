const UserXP = require('../models/UserXP');
const { createLevelCard } = require('../utils/levelCard');

const config = {
  enabled: true,
  xpNormal: 10,
  xpBonus: 100,
  cooldownNormal: 10 * 1000, // 10 giây
  cooldownBonus: 60 * 1000,  // 60 giây
  levelRoles: {
    5: '💠 Traveler',
    10: '🌟 Adventurer',
    15: '⚔️ Battle-Hardened',
    20: '🔥 Vision Holder',
    25: '💫 Elemental Master',
    30: '🎭 Mirror of Judgment',
    35: '🌌 Voice of Fontaine',
    40: '🎐 Whisper of Archons',
    45: '🔱 Justice Seeker',
    50: '👑 Court Performer',
    55: '🌊 Ocean-Blessed',
    60: '🌀 Divine Choreographer',
    65: '🕊️ Celestia’s Watcher',
    70: '💎 Crowned Dreamer',
    75: '🩵 Furina’s Herald',
    80: '🎇 Legendary Duelist',
    85: '📜 Lorekeeper of The Oratrice',
    90: '🌈 Echo of Eternity',
    95: '🩸 Heart of Fontaine',
    100: '💎 Follower of Furina Supreme'
  }
};

/**
 * @param {Message} message
 * @param {boolean} isTalkingToBot
 */
async function handleLeveling(message, isTalkingToBot = false) {
  if (!config.enabled) return;
  const { member, guild } = message;
  if (!member || member.user.bot) return;

  const userId = member.id;
  const guildId = guild.id;
  const now = Date.now();

  let data = await UserXP.findOne({ userId, guildId });
  if (!data) {
    data = await UserXP.create({
      userId,
      guildId,
      xp: 0,
      level: 1,
      lastMessage: 0,
      lastIsBonus: false
    });
  }

  const cooldown = isTalkingToBot ? config.cooldownBonus : config.cooldownNormal;
  const timeSinceLast = now - (data.lastMessage || 0);

  // Kiểm tra cooldown
  if (timeSinceLast < cooldown) return;

  // Nếu vừa nói chuyện với Furina xong thì phải chờ 60s để được +10
  if (!isTalkingToBot && data.lastIsBonus && timeSinceLast < config.cooldownBonus) {
    return;
  }

  // ✅ Cập nhật XP
  data.lastMessage = now;
  data.lastIsBonus = isTalkingToBot;

  const xpToAdd = isTalkingToBot ? config.xpBonus : config.xpNormal;
  data.xp += xpToAdd;
  console.log(`📈 +${xpToAdd} XP cho ${member.user.tag} (${data.xp} XP hiện tại)`);

  const newLevel = Math.floor(Math.sqrt(data.xp / 100));

  // Nếu lên cấp
  if (newLevel > data.level) {
    data.level = newLevel;

    const roleName = config.levelRoles[newLevel] || 'Adventurer';
    const nextXP = 100 * Math.pow(newLevel + 1, 2);

    // 🏆 Tính rank dựa trên XP
    const allUsers = await UserXP.find().sort({ xp: -1 });
    const userRank = allUsers.findIndex(entry => entry.userId === userId) + 1;

    const notice = await message.reply(`🖌️ Đang xử lý lên cấp...`);

    // Làm sạch tên role cho hiển thị
    const cleanRoleName = roleName.replace(/[^\p{L}\p{N}\p{Zs}.,'’\-]/gu, '').trim();

    // 🖼️ Tạo level card có cả rank
    const levelCard = await createLevelCard(
      member,
      newLevel,
      data.xp,
      nextXP,
      cleanRoleName,
      userRank // truyền vào đây!
    );

    // Gửi thông báo lên cấp
    await message.channel.send({
      content: `🎉 **${member.user.username}** vừa lên cấp **${newLevel}** và trở thành **${roleName}**!\n🏆 Rank hiện tại: **#${userRank}**`,
      files: [levelCard]
    });

    setTimeout(() => notice.delete().catch(() => {}), 5000);
    console.log('✅ Đã gửi thông báo lên cấp level');

    // Thêm role nếu có
    const role = guild.roles.cache.find(r => r.name === roleName);
    if (role) {
      try {
        await member.roles.add(role);
      } catch (err) {
        console.log(`❌ Không thể thêm role ${roleName} cho ${member.user.tag}`);
      }
    }
  }

  await data.save();
}

module.exports = { handleLeveling };

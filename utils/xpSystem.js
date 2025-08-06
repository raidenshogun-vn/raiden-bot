const UserXP = require('../models/UserXP');
const { createLevelCard } = require('../utils/levelCard');
const levelRoles = require('../config/levelRoles/raiden');

const config = {
  enabled: true,
  xpNormal: 10,
  xpBonus: 100,
  cooldownNormal: 10 * 1000, // 10 giây
  cooldownBonus: 60 * 1000   // 60 giây
};

// 🔢 Hàm tính cấp độ từ XP theo công thức: x^2 * 100 + x * 1000
function getLevelFromXP(xp) {
  let level = 1;
  while (true) {
    const requiredXP = level * level * 100 + level * 1000;
    if (xp < requiredXP) break;
    level++;
  }
  return level - 1;
}

// 🔢 Hàm tính tổng XP cần để lên cấp x
function getXPForLevel(level) {
  return level * level * 100 + level * 1000;
}

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

  // Nếu vừa nói chuyện với bot xong thì phải chờ 60s để được +10
  if (!isTalkingToBot && data.lastIsBonus && timeSinceLast < config.cooldownBonus) {
    return;
  }

  // ✅ Cập nhật XP
  data.lastMessage = now;
  data.lastIsBonus = isTalkingToBot;

  const xpToAdd = isTalkingToBot ? config.xpBonus : config.xpNormal;
  data.xp += xpToAdd;
  console.log(`📈 +${xpToAdd} XP cho ${member.user.tag} (${data.xp} XP hiện tại)`);

  const newLevel = getLevelFromXP(data.xp);

  // Nếu lên cấp
  if (newLevel > data.level) {
    data.level = newLevel;

    const roleName = levelRoles[newLevel] || 'Adventurer';
    const nextXP = getXPForLevel(newLevel + 1);

    // 🏆 Tính rank dựa trên XP
    const allUsers = await UserXP.find({ guildId }).sort({ xp: -1 });
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
      userRank
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

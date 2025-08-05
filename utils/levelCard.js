const Canvas = require('canvas');
const path = require('path');
const { AttachmentBuilder } = require('discord.js');

/**
 * @param {GuildMember} member
 * @param {number} level
 * @param {number} xp
 * @param {number} nextXP
 * @param {string} roleTitle
 * @param {number} userRank
 */
async function createLevelCard(member, level, xp, nextXP, roleTitle, userRank) {
  const canvas = Canvas.createCanvas(1000, 400);
  const ctx = canvas.getContext('2d');

  // Background
  const background = await Canvas.loadImage(path.join(__dirname, '..', 'assets/userxp', 'level-bg.png'));
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

  // Avatar
  const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 512 });
  const avatar = await Canvas.loadImage(avatarURL);

  const avatarX = 90;
  const avatarY = 90;
  const avatarRadius = 90;

  // Viền avatar
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + avatarRadius, avatarY + avatarRadius, avatarRadius + 5, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.closePath();
  ctx.restore();

  // Vẽ avatar
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + avatarRadius, avatarY + avatarRadius, avatarRadius, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(avatar, avatarX, avatarY, avatarRadius * 2, avatarRadius * 2);
  ctx.restore();

  // Icon EXP
  const expIcon = await Canvas.loadImage(path.join(__dirname, '..', 'assets/userxp', 'aep.png'));

  // Thông tin người dùng
  const displayName = member.displayName || member.user.username;
  const userId = member.user.id;

  ctx.fillStyle = '#ffffff';

  ctx.font = 'bold 42px "Segoe UI"';
  ctx.fillText(displayName, 320, 100);

  ctx.font = '28px "Segoe UI"';
  ctx.fillStyle = '#dddddd';
  ctx.fillText(`ID ${userId}`, 320, 145);

  ctx.font = '28px "Segoe UI"';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`Role: ${roleTitle}`, 320, 190);
  if (userRank) {
  ctx.fillText(`Rank: #${userRank}`, 320, 235);
}
  ctx.fillText(`Level: ${level}`, 320, 270);

// EXP Icon + Progress Bar
const iconSize = 80;
const iconX = 320;
const iconY = 280; // đã đẩy xuống thấp hơn
ctx.drawImage(expIcon, iconX, iconY, iconSize, iconSize);

const progressX = iconX + iconSize + 15;
const progressY = iconY + 30; // tương ứng => 330
const progressWidth = 520;
const progressHeight = 12;
const percent = Math.min(xp / nextXP, 1);

// Progress bar
ctx.fillStyle = '#2c2f33';
ctx.fillRect(progressX, progressY, progressWidth, progressHeight);

ctx.fillStyle = '#a8e82f';
ctx.fillRect(progressX, progressY, progressWidth * percent, progressHeight);

ctx.strokeStyle = '#ffffff';
ctx.lineWidth = 2;
ctx.strokeRect(progressX, progressY, progressWidth, progressHeight);

// EXP Text
ctx.font = '22px "Segoe UI"';
ctx.fillStyle = '#ffffff';
ctx.fillText(`${xp}/${nextXP} EXP`, progressX, progressY + 40); // hiển thị ở 370


  return new AttachmentBuilder(canvas.toBuffer(), { name: 'level-card.png' });
}

module.exports = { createLevelCard };

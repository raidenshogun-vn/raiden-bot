const path = require('path');
const fs = require('fs');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const character = require('../../config/character');
const User = require('../../models/User');
const getHistoryModel = require('../../models/CharacterHistory');
const { getLang } = require('../../helpers/getLang');

const COOLDOWN = 10 * 1000; // 10 giây
const ADMIN_ID = '1149477475001323540';

module.exports = {
  data: new SlashCommandBuilder()
    .setName(character.name)
    .setDescription(`Display a random ${character.displayName} image`),

  async execute(interaction) {
    let hasDeferred = false;
    try {
      try {
        await interaction.deferReply();
        hasDeferred = true;
      } catch (deferError) {
        console.error(`[${character.displayName.toUpperCase()} - LỖI DEFER]:`, deferError);
        return;
      }

      const userId = interaction.user.id;
      const username = interaction.user.username;
      const isDM = interaction.channel?.isDMBased?.() ?? false;
      const serverId = interaction.guildId;

      console.log(`[${character.displayName.toUpperCase()} - LOG] ${username} (${userId}) gọi lệnh tại ${isDM ? 'DM' : 'Server ' + serverId}`);

      const user = await User.findOne({ userId }) || {};
      const lang = getLang(user.language || 'en');

      const HistoryModel = getHistoryModel(character.displayName);
      let historyDoc = await HistoryModel.findOne({ userId });
      if (!historyDoc) historyDoc = await HistoryModel.create({ userId });

      let seen = [];

      if (isDM) {
        seen = historyDoc.seenDM || [];
      } else {
        const serverHistory = historyDoc.seenServer?.find(entry => entry.serverId === serverId);
        seen = serverHistory?.images || [];
      }

      const downloadFolder = path.join(__dirname, '../../assets/character_img');
      const files = fs.readdirSync(downloadFolder).filter(name => /\.(jpe?g|png)$/i.test(name));
      if (files.length === 0) {
        const fallbackMsg = lang.image?.noImage || '❌ No image available to show.';
        console.warn(`[${character.displayName.toUpperCase()} - WARN] Không tìm thấy ảnh nào trong thư mục.`);
        return await interaction.editReply(fallbackMsg);
      }

      const unseen = files.filter(file => !seen.find(s => s.imageId === file));
      const chosenFile = unseen.length > 0
        ? unseen[Math.floor(Math.random() * unseen.length)]
        : files[Math.floor(Math.random() * files.length)];
      const isOld = !unseen.includes(chosenFile);
      const now = Date.now();
      if (userId !== ADMIN_ID && seen.length > 0) {
        const lastUsed = seen[seen.length - 1].lastUsedAt;
        if (lastUsed) {
          const elapsed = now - new Date(lastUsed).getTime();
          const remaining = COOLDOWN - elapsed;
          if (remaining > 0) {
            const secondsLeft = Math.ceil(remaining / 1000);
            const cooldownMsg = lang.image?.cooldown?.replace('{s}', secondsLeft) || `⏳ Please wait ${secondsLeft}s before trying again.`;
            return await interaction.editReply(cooldownMsg);
          }
        }
      }

      const newEntry = { imageId: chosenFile, lastUsedAt: new Date(now) };

      if (isDM) {
        if (!historyDoc.seenDM) historyDoc.seenDM = [];
        const existing = historyDoc.seenDM.find(i => i.imageId === chosenFile);
        if (existing) {
          existing.lastUsedAt = new Date(now);
        } else {
          historyDoc.seenDM.push(newEntry);
        }
      } else {
        if (!historyDoc.seenServer) historyDoc.seenServer = [];
        let serverEntry = historyDoc.seenServer.find(e => e.serverId === serverId);
        if (!serverEntry) {
          serverEntry = { serverId, images: [] };
          historyDoc.seenServer.push(serverEntry);
        }
        const existing = serverEntry.images.find(i => i.imageId === chosenFile);
        if (existing) {
          existing.lastUsedAt = new Date(now);
        } else {
          serverEntry.images.push(newEntry);
        }
      }

      await historyDoc.save();

      const embed = new EmbedBuilder()
        .setTitle(lang.image?.embedTitle || `${character.displayName} image`)
        .setThumbnail(`attachment://${chosenFile}`)
        .setFooter({ text: isOld ? (lang.image?.oldFooter || 'This image has been shown before.') : (lang.image?.newFooter || 'This is a new image.') });

      await interaction.editReply({
        content: isOld ? (lang.image?.oldImageNotice || '_This image has been shown before._') : undefined,
        embeds: [embed],
        files: [path.join(downloadFolder, chosenFile)]
      });

    } catch (err) {
      console.error(`[${character.displayName.toUpperCase()} - LỖI GỬI ẢNH]:`, err);
      const fallback = character.languages?.en?.image?.error || '❌ An error occurred while sending the image.';
      try {
        if (hasDeferred || interaction.deferred || interaction.replied)
          await interaction.editReply(fallback);
        else
          await interaction.reply({ content: fallback, ephemeral: true });
      } catch (e) {
        console.error(`[${character.displayName.toUpperCase()} - LỖI PHẢN HỒI]:`, e);
      }
    }
  }
};

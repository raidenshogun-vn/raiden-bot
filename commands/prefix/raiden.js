// prefixCommands/characterImage.js
const path = require('path');
const fs = require('fs');
const { EmbedBuilder } = require('discord.js');
const character = require('../config/character');
const User = require('../models/User');
const getHistoryModel = require('../models/CharacterHistory');
const { getLang } = require('../utils/characterHelpers');

const COOLDOWN = 10 * 1000; // 10 seconds
const ADMIN_ID = '1149477475001323540';

module.exports = {
  name: `!${character.name.toLowerCase()}`,
  description: `Send a random ${character.displayName} image`,

  async execute(message) {
    const userId = message.author.id;
    const isDM = message.channel?.isDMBased?.() ?? false;
    const serverId = message.guild?.id;
    const username = message.author.username;

    console.log(`[${character.displayName.toUpperCase()} - LOG] ${username} (${userId}) used the command in ${isDM ? 'DM' : 'Server ' + serverId}`);

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

    const downloadFolder = path.join(__dirname, `../commands/img`);
    const files = fs.readdirSync(downloadFolder).filter(name => /\.(jpe?g|png)$/i.test(name));
    if (files.length === 0) {
      const fallbackMsg = lang.image?.noImage || '❌ No image available to show.';
      console.warn(`[${character.displayName.toUpperCase()} - WARN] No images found.`);
      return await message.reply(fallbackMsg);
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
          return await message.reply(cooldownMsg);
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
      .setImage(`attachment://${chosenFile}`)
      .setFooter({ text: isOld ? (lang.image?.oldFooter || 'This image has been shown before.') : (lang.image?.newFooter || 'This is a new image.') });

    await message.reply({
      content: isOld ? (lang.image?.oldImageNotice || '_This image has been shown before._') : undefined,
      embeds: [embed],
      files: [path.join(downloadFolder, chosenFile)]
    });
  }
};
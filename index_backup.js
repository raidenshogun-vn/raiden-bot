// require('dotenv').config();
// const fs = require('fs');
// const path = require('path');
// const express = require('express');
// const { Client, GatewayIntentBits, Collection, Events, Partials } = require('discord.js');
// const connectDB = require('./db');
// const { setRandomStatusForCharacter } = require('./utils/characterStatus.js');
// const character = require('./config/character');
// const guildCreateHandler = require('./events/guildCreate');
// const interactionHandler = require('./events/interactionCreate');
// const messageListener = require('./events/messageListener');

// const app = express();
// const PORT = process.env.PORT || 10004;
// app.use(express.static('public'));

// // ====== Discord Bot Setup ======
// const client = new Client({
//     intents: [
//         GatewayIntentBits.Guilds,
//         GatewayIntentBits.GuildMessages,
//         GatewayIntentBits.MessageContent,
//         GatewayIntentBits.DirectMessages,
//         GatewayIntentBits.GuildMembers,
//         GatewayIntentBits.GuildPresences
//     ],
//     partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember]
// });

// client.commands = new Collection();
// const commands = [];

// function getAllCommandFiles(dirPath, arrayOfFiles = []) {
//     const files = fs.readdirSync(dirPath);
//     for (const file of files) {
//         const fullPath = path.join(dirPath, file);
//         if (fs.statSync(fullPath).isDirectory()) {
//             getAllCommandFiles(fullPath, arrayOfFiles);
//         } else if (file.endsWith('.js')) {
//             arrayOfFiles.push(fullPath);
//         }
//     }
//     return arrayOfFiles;
// }

// const commandFiles = getAllCommandFiles(path.join(__dirname, 'commands'));
// for (const file of commandFiles) {
//     try {
//         const command = require(file);
//         if ('data' in command && 'execute' in command) {
//             client.commands.set(command.data.name, command);
//             commands.push(command.data.toJSON());
//             console.log(`✅ Đã load lệnh: ${command.data.name}`);
//         } else {
//             console.warn(`⚠️ Thiếu "data" hoặc "execute" trong lệnh: ${file}`);
//         }
//     } catch (err) {
//         console.error(`❌ Lỗi khi load lệnh từ: ${file}`, err);
//     }
// }

// // ====== Event Listeners ======
// client.on(Events.InteractionCreate, interactionHandler.execute);
// client.on(Events.MessageCreate, async (message) => {
//     try {
//         await messageListener.execute(message);
//     } catch (error) {
//         console.error('❌ Lỗi khi xử lý tin nhắn:', error);
//     }
// });
// client.on(Events.ClientReady, () => {
//     console.log(`✅ Bot đã sẵn sàng: ${client.user.tag}`);
//     setRandomStatusForCharacter(client, character.statusPresets);
// });
// client.on(Events.GuildCreate, guildCreateHandler.execute);

// // ====== Auto Ping Handling ======
// let lastPing = 0;
// let botRunning = false;

// // Route nhận ping từ local
// app.get('/heartbeat', (req, res) => {
//     lastPing = Date.now();
//     res.sendStatus(200);
// });

// // Kiểm tra ping mỗi 30s
// setInterval(async () => {
//     const now = Date.now();
//     const pingGap = now - lastPing;

//     // Nếu không có ping trong 1 phút => chạy bot nếu chưa chạy
//     if (pingGap > 60_000 && !botRunning) {
//         console.log('🟢 Không nhận ping từ local → khởi chạy bot...');
//         await startBot();
//     }

//     // Nếu nhận ping liên tục => tắt bot nếu đang chạy
//     if (pingGap <= 60_000 && botRunning) {
//         console.log('🔴 Nhận ping từ local → tắt bot trên Render...');
//         await stopBot();
//     }
// }, 30_000);

// // ====== Express giữ sống Render ======
// app.listen(PORT, () => {
//     console.log(`🌐 Express server đang chạy tại http://localhost:${PORT}`);
// });

// // ====== Bot Start/Stop Functions ======
// async function startBot() {
//     try {
//         await connectDB();
//         await client.login(process.env.DISCORD_TOKEN);
//         console.log(`🔑 Bot Discord đăng nhập: ${client.user.tag}`);
//         console.log(`🔗 Mời bot: https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&scope=bot+applications.commands&permissions=8`);
//         botRunning = true;
//     } catch (err) {
//         console.error('❌ Lỗi khi khởi động bot:', err);
//     }
// }

// async function stopBot() {
//     try {
//         await client.destroy();
//         botRunning = false;
//         console.log('🛑 Bot đã bị tắt trên Render.');
//     } catch (err) {
//         console.error('❌ Lỗi khi tắt bot:', err);
//     }
// }

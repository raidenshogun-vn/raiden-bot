require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const { Client, GatewayIntentBits, Collection, REST, Routes, Events, Partials } = require('discord.js');
const connectDB = require('./db');
const { setRandomStatusForCharacter } = require('./utils/characterStatus.js');
const character = require('./config/character');
const guildCreateHandler = require('./events/guildCreate');
// === 1. Khởi tạo Discord Client ===
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ],
    partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember]
});

// === 2. Tải Slash Commands từ thư mục ===
client.commands = new Collection();
const commands = [];

function getAllCommandFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getAllCommandFiles(fullPath, arrayOfFiles);
        } else if (file.endsWith('.js')) {
            arrayOfFiles.push(fullPath);
        }
    }
    return arrayOfFiles;
}

const { withValidation } = require('./utils/middleware/withValidation');
const commandFiles = getAllCommandFiles(path.join(__dirname, 'commands/slash'));

for (const file of commandFiles) {
    try {
        let command = require(file);

        // ✅ Bọc command bằng middleware
        command = withValidation(path.dirname(file), command);

        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            commands.push(command.data.toJSON());
            console.log(`✅ Đã load lệnh: ${command.data.name}`);
        } else {
            console.warn(`⚠️ Thiếu "data" hoặc "execute" trong lệnh: ${file}`);
        }
    } catch (err) {
        console.error(`❌ Lỗi khi load lệnh từ: ${file}`, err);
    }
}

//

const interactionHandler = require('./events/interactionCreate');
client.on(Events.InteractionCreate, interactionHandler.execute);

// === 5. Xử lý MessageCreate (tin nhắn) ===
const messageDispatcher = require('./events/messageDispatcher');
client.on(Events.MessageCreate, async (message) => {
    try {
        await messageDispatcher.execute(message);
    } catch (error) {
        console.error('❌ Lỗi khi xử lý tin nhắn:', error);
    }
});


// === 6. Express giữ bot sống trên Render ===
const app = express();
const PORT = process.env.PORT || 8080;
app.use(express.static('public'));
// Trang Privacy Policy
app.get('/privacy', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'privacy.html'));
});

// Trang Terms of Service
app.get('/terms', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'terms.html'));
});

// OAuth Redirect URI (cho Patreon)
app.get('/oauth/redirect', (req, res) => {
    res.send('OAuth redirect successful! You may close this tab.');
});
// Route cho trang chủ "/"
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.listen(PORT, () => {
    console.log(`🌐 Express server đang chạy tại http://localhost:${PORT}`);
});

// === 7. Đăng nhập bot và kết nối MongoDB ===
client.once(Events.ClientReady, () => {
    console.log(`✅ Bot đã sẵn sàng: ${client.user.tag}`);
    // Đặt status lần đầu
    setRandomStatusForCharacter(client, character.statusPresets);

    // Cập nhật lại mỗi 12 giờ
    const TWELVE_HOURS = 12 * 60 * 60 * 1000;
    setInterval(() => {
        setRandomStatusForCharacter(client, character.statusPresets);
    }, TWELVE_HOURS);
    
});

async function main() {
    
    try {
    console.log('🔌 Kết nối MongoDB...');
    await connectDB();
    await client.login(process.env.DISCORD_TOKEN);
    console.log(`✅ Đăng nhập Discord thành công: ${client.user.tag}`);
} catch (err) {
    console.error('❌ Lỗi khi khởi động bot:', err);
}
// Gửi thông báo khi mới thêm Furina vào server
    client.on(Events.GuildCreate, guildCreateHandler.execute);
}

main();

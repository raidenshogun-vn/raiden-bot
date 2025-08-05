// utils/sendLongMessage.js
async function sendLongMessage(channel, message, options = {}) {
    const maxLength = 2000;
    const lines = message.split('\n');
    let current = '';

    for (const line of lines) {
        if ((current + '\n' + line).length > maxLength) {
            await channel.send({ content: current, ...options });
            current = line;
        } else {
            current += '\n' + line;
        }
    }

    if (current) {
        await channel.send({ content: current, ...options });
    }
}

module.exports = sendLongMessage;

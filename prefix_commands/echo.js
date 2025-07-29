const activeEchoUsers = require('../utils/activeEcho');
const { isAuthorized } = require('../utils/auth');

module.exports = {
    name: 'echo',
    description: 'Toggle echo ON/OFF for yourself',

    async execute(message, args) {
        const fakeInteraction = {
            user: message.author,
            member: message.member,
        };

        if (!isAuthorized(fakeInteraction)) {
            return;
        }

        const mode = args[0]?.toLowerCase();
        const userId = message.author.id;

        if (mode === 'on') {
            activeEchoUsers.add(userId);
            await message.delete();
            await message.author.send(`Echo mode is **ON**\nUse **Yi echo off** to turn it off`);
        } else if (mode === 'off') {
            activeEchoUsers.delete(userId);
            await message.delete();
        } else {
            await message.reply('Oof');
        }
    }
};
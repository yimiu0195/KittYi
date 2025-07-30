const echoManager = require('../utils/activeEcho');
const { isAuthorized } = require('../utils/auth');

module.exports = {
    name: 'echo',
    description: 'Toggle echo ON/OFF for yourself',

    async execute(message, args) {
        const fakeInteraction = {
            user: message.author,
            member: message.member,
        };

        if (!isAuthorized(fakeInteraction)) return;

        const mode = args[0]?.toLowerCase();
        const userId = message.author.id;
        const guildId = message.guild?.id;

        if (!guildId) return;

        await message.delete();

        if (mode === 'on') {
            echoManager.enable(guildId, userId);
        } else if (mode === 'off') {
            echoManager.disable(guildId, userId);
        }
    }
};
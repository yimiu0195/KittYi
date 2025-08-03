const activeEchoUsers = new Map();

module.exports = {
    enable(guildId, userId) {
        if (!activeEchoUsers.has(guildId)) {
            activeEchoUsers.set(guildId, new Set());
        }
        activeEchoUsers.get(guildId).add(userId);
    },

    disable(guildId, userId) {
        if (activeEchoUsers.has(guildId)) {
            activeEchoUsers.get(guildId).delete(userId);
            if (activeEchoUsers.get(guildId).size === 0) {
                activeEchoUsers.delete(guildId);
            }
        }
    },

    isEnabled(guildId, userId) {
        return activeEchoUsers.has(guildId) && activeEchoUsers.get(guildId).has(userId);
    }
};
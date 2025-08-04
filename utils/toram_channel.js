const pool = require('./db');


async function setChannelForGuild(guildId, channelId) {
    await pool.query(`
        INSERT INTO toram_channel (guild_id, channel_id)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE channel_id = VALUES(channel_id)
    `, [guildId, channelId]);
}


async function loadChannelMap() {
    const [rows] = await pool.query(`SELECT guild_id, channel_id FROM toram_channel`);
    const map = {};
    for (const row of rows) {
        map[row.guild_id] = row.channel_id;
    }
    return map;
}


async function removeChannelForGuild(guildId) {
    await pool.query(`DELETE FROM toram_channel WHERE guild_id = ?`, [guildId]);
}

module.exports = {
    setChannelForGuild,
    loadChannelMap,
    removeChannelForGuild,
};
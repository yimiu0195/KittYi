const fs = require('fs');
const path = require('path');

const MAP_FILE = path.join(__dirname, '../data/channel_map.json');

function loadChannelMap() {
    if (!fs.existsSync(MAP_FILE)) return {};
    try {
        return JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));
    } catch (err) {
        console.error('❌ channel_map.json:', err);
        return {};
    }
}

function saveChannelMap(map) {
    try {
        fs.writeFileSync(MAP_FILE, JSON.stringify(map, null, 2));
    } catch (err) {
        console.error('❌ channel_map.json:', err);
    }
}

function setChannelForGuild(guildId, channelId) {
    const map = loadChannelMap();
    map[guildId] = channelId;
    saveChannelMap(map);
}

function removeChannelForGuild(guildId) {
    const map = loadChannelMap();
    delete map[guildId];
    saveChannelMap(map);
}

function getChannelForGuild(guildId) {
    const map = loadChannelMap();
    return map[guildId] || null;
}

module.exports = {
    loadChannelMap,
    saveChannelMap,
    setChannelForGuild,
    removeChannelForGuild,
    getChannelForGuild
};
const pool = require('./db');
const { EmbedBuilder } = require('discord.js');


async function sendTextMessage(channel, content) {
    if (!channel || !content) return;
    try {
        await channel.send({ content: String(content) });
    } catch (err) {
        console.error(`[sendTextMessage] ❌ Send err:`, err);
    }
}

async function sendEmbedMessage(channel, rawContent, guildId, parsePingFromContent = false) {
    if (!channel || !rawContent || !guildId) {
        console.warn(`[sendEmbedMessage] ⚠️`);
        return;
    }

    let embedName = rawContent;
    let mention = null;

    if (parsePingFromContent && typeof rawContent === 'string') {
        const lines = rawContent.trim().split('\n');
        if (lines.length >= 2) {
            mention = lines[0].trim(); //ping in line 1
            embedName = lines.slice(1).join('\n').trim(); // line 2 is embed name
        }
    }

    try {
        const [rows] = await pool.query(
            `SELECT * FROM embeds WHERE name = ? AND guild_id = ? LIMIT 1`,
            [embedName, guildId]
        );

        if (!rows.length) {
            console.warn(`[sendEmbedMessage] ⚠️ Embed not found '${embedName}' in server '${guildId}'`);
            return;
        }

        const data = rows[0];
        const embed = new EmbedBuilder();

        if (data.title) embed.setTitle(data.title);
        if (data.description) embed.setDescription(data.description);
        if (data.footer) embed.setFooter({ text: data.footer });

        if (data.color) {
            try {
                const colorVal = parseInt(data.color.replace(/^#/, ''), 16);
                embed.setColor(colorVal);
            } catch (e) {
                console.warn(`[sendEmbedMessage] Invalid color: ${data.color}`);
            }
        }

        if (data.author) embed.setAuthor({ name: data.author });
        if (data.avatar_url) embed.setThumbnail(data.avatar_url);
        if (data.image_url) embed.setImage(data.image_url);

        await channel.send({
            content: mention || undefined,
            embeds: [embed],
            allowedMentions: {
                parse: ['roles', 'everyone', 'users'],
            },
        });
    } catch (err) {
        console.error(`[sendEmbedMessage] Err sending`, err);
    }
}

module.exports = {
    sendTextMessage,
    sendEmbedMessage
};
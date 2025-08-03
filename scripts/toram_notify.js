const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const pool = require('../utils/db');

const CHANNEL_MAP = path.join(__dirname, '..', 'data', 'channel_map.json');

async function getArticlesToNotify() {
    const [rows] = await pool.query(`
        SELECT DISTINCT group_id
        FROM ToramDetail
        WHERE notified = true
    `);
    return rows.map(r => r.group_id);
}

async function getContentByGroupId(groupId) {
    const [rows] = await pool.query(`
        SELECT content_type AS ContentType, content AS Content
        FROM ToramDetail
        WHERE group_id = ?
        ORDER BY id ASC
    `, [groupId]);
    return rows;
}

async function markAsNotified(groupId) {
    await pool.query(`
        UPDATE ToramDetail
        SET notified = false
        WHERE group_id = ?
    `, [groupId]);
}

async function sendEmbed(channel, rows) {
    let embeds = [];
    let currentEmbed = new EmbedBuilder().setColor(0xffffff);
    let description = '';
    const titleRow = rows.find(r => r.ContentType === 'Title');
  
    // if (titleRow) {
    //     const titleEmbed = new EmbedBuilder()
    //         .setColor(0xe67e22)
    //         .setTitle(titleRow.Content);
    //     await channel.send({ embeds: [titleEmbed] });
    // }
  
    if (titleRow) {
        description += `🌸 **${titleRow.Content}** 🌸\n\n\n------------\n\n`;
    }
    for (const { ContentType, Content } of rows) {
        if (ContentType === 'Deluxetitle') {
            description += `🌟  **${Content}** 🌟 \n\n`;
        } else if (ContentType === 'Subtitle') {
            description += `✩  **${Content}** ✩ \n\n`;
        } else if (['Description', 'Subdescription'].includes(ContentType)) {
            description += `${Content}\n\n`;
        } else if (ContentType === 'Img') {
            if (description.trim()) currentEmbed.setDescription(description.trim());
            currentEmbed.setImage(Content);
            embeds.push(currentEmbed);
            currentEmbed = new EmbedBuilder().setColor(0xffffff);
            description = '';
        }
    }

    if (description.trim()) {
        currentEmbed.setDescription(description.trim());
        embeds.push(currentEmbed);
    }

    for (const embed of embeds) {
            await channel.send({ 
                embeds: [embed] 
            }).catch(err =>
                console.error('Sent err:', err.message)
            );
    }

    console.log(`✅ Sent ${embeds.length} embed.`);
}

module.exports = async function notifyBot(client) {
    let map = {};
    if (fs.existsSync(CHANNEL_MAP)) {
        map = JSON.parse(fs.readFileSync(CHANNEL_MAP, 'utf-8'));
    }

    const groupIds = await getArticlesToNotify();
    if (groupIds.length === 0) {
        return;
    }

    for (const [guildId, channelId] of Object.entries(map)) {
        try {
            const channel = await client.channels.fetch(channelId);
            if (!channel) {
                console.warn(`⚠️ Cannot find channel ${channelId} in server ${guildId}`);
                continue;
            }

            for (const groupId of groupIds) {
                const rows = await getContentByGroupId(groupId);
                if (!rows || rows.length === 0) continue;

                console.log(`Sent #${groupId} to server ${guildId}, channel ${channel.name}`);
                await sendEmbed(channel, rows);
            }
        } catch (err) {
            console.error(`❌ Send err ${guildId}: ${err.message}`);
        }
    }

    for (const groupId of groupIds) {
        await markAsNotified(groupId);
    }

    console.log('✅ Status: Notified all articles.');
};
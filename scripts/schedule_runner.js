const { Client } = require('discord.js');
const pool = require('../utils/db');
const { 
    sendTextMessage, 
    sendEmbedMessage } = require('../utils/send');


async function runSchedules(client) {
    const nowUTC = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const [rows] = await pool.query(`
        SELECT * FROM schedulers
        WHERE send_time <= ? AND status_scheduler = 'pending'
    `, [nowUTC]);

    if (!rows.length) return;

    for (const row of rows) {
        try {
            const guild = client.guilds.cache.get(row.guild_id);
            if (!guild) {
                console.warn(`[runSchedules] server not found ${row.guild_id}`);
                continue;
            }

            const channel = guild.channels.cache.get(row.channel_id);
            if (!channel || !channel.send) {
                console.warn(`[runSchedules] Channel not found ${row.channel_id}`);
                continue;
            }

            const sendTime = new Date(Date.parse(row.send_time + 'Z')); //utc
            const now = new Date();
            const diff = now - sendTime;

            const maxAhead = new Date(now.getTime() + 45000);
            const maxBehind = new Date(now.getTime() - 15000);

            if (sendTime < maxBehind || sendTime > maxAhead) {
                continue;
            }

            if (row.message_type === 'text') {
                await sendTextMessage(channel, row.content);
            } else if (row.message_type === 'embed') {
                await sendEmbedMessage(channel, row.content, row.guild_id, true);
            }

            // auto set send_time
            if (row.repeat_time !== 'none') {
                let nextSend = new Date(Date.parse(row.send_time + 'Z'));

                switch (row.repeat_time) {
                case 'minutes':
                    nextSend.setMinutes(nextSend.getMinutes() + (row.interval_minutes || 1));
                    break;
                case 'hourly':
                    nextSend.setHours(nextSend.getHours() + 1);
                    break;
                case 'daily':
                    nextSend.setDate(nextSend.getDate() + 1);
                    break;
                case 'weekly':
                    nextSend.setDate(nextSend.getDate() + 7);
                    break;
                case 'monthly':
                    nextSend.setMonth(nextSend.getMonth() + 1);
                    break;
                default:
                    console.warn(`[runSchedules] ⚠️ repeat_time không hợp lệ: ${row.repeat_time}`);
                    continue;
                }

                const nextSendStr = nextSend.toISOString().slice(0, 19).replace('T', ' ');

                await pool.query(`
                    UPDATE schedulers
                    SET send_time = ?, status_scheduler = 'pending'
                    WHERE id = ?
                `, [nextSendStr, row.id]);
            } else {
                await pool.query(`
                    UPDATE schedulers
                    SET status_scheduler = 'sent'
                    WHERE id = ?
                `, [row.id]);
            }

        } catch (err) {
            console.error(`[runSchedules] Err ${row.id}:`, err);
        }
    }
}

module.exports = runSchedules;
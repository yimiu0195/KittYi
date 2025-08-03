const { scrapeSteamSales } = require('../utils/steam_scraper');
const pool = require('../utils/db');
require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

async function notifySteamSales(client = null) {
    let tempClient = null;

    try {
        if (!client) {
            tempClient = new Client({ intents: [GatewayIntentBits.Guilds] });
            await tempClient.login(process.env.TOKEN);
            await new Promise((resolve) => tempClient.once('ready', resolve));
            client = tempClient;
        }

        const [channels] = await pool.query('SELECT * FROM steam_channels');
        if (channels.length === 0) {
            return;
        }

        const sales = await scrapeSteamSales();
        const game = sales[0];

        if (!game) {
            return;
        }

        const [rows] = await pool.query(
            'SELECT 1 FROM steamSales WHERE title = ? LIMIT 1',
            [game.title]
        );
        if (rows.length > 0) {
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle(`🎮 ${game.title}`)
            .setDescription(`
                > Discount: **${game.discount}**
                > Current Price: **${game.price}**
                > Release Date: **${game.releaseDate}**`)
            .setURL(game.link)
            .setColor('#1b2838')
            .setFooter({ text: 'Steam Sale' })

        if (game.image) {
            embed.setThumbnail(game.image);
        }

        let sentCount = 0;

        for (const { guild_id, channel_id } of channels) {
            try {
                const channel = await client.channels.fetch(channel_id);
                if (channel && channel.isTextBased()) {
                    await channel.send(game.link);
                    await channel.send({ embeds: [embed] });

                    sentCount++;
                }
            } catch (e) {
                console.warn(`Cannot send steam sale to ${guild_id}:${channel_id}`);
            }
        }

        await pool.query(
            'INSERT INTO steamSales (title, discount, price, url, release_date) VALUES (?, ?, ?, ?, ?)',
            [game.title, game.discount, game.price, game.link, game.releaseDate]
        );


        console.log(`✅ Sent new game: ${game.title}`);
    } catch (err) {
        console.error('❌ Steam notify error:', err);
    } finally {
        if (tempClient) process.exit();
    }
}

module.exports = notifySteamSales;

if (require.main === module) {
    notifySteamSales();
}
const { 
    SlashCommandBuilder, 
    ChannelType,
    EmbedBuilder } = require('discord.js');

const pool = require('../utils/db');

const {
    setChannelForGuild,
    loadChannelMap,
    removeChannelForGuild
} = require('../utils/toram_channel');

const { isAuthorized } = require('../utils/auth');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('toram')
        .setDescription('Toram related news')
        .addSubcommand(cmd =>
            cmd.setName('list')
                .setDescription('Show the 10 most recent toram news posts')
        )
        .addSubcommand(cmd =>
            cmd.setName('get')
                .setDescription('Get Info by ID (use /toram list to get ID)')
                .addIntegerOption(option =>
                    option.setName('id')
                    .setDescription('ID news')
                    .setRequired(true)
                )
        )

        .addSubcommand(cmd =>
            cmd.setName('news')
                .setDescription('Receive toram news')
                .addChannelOption(option =>
                option.setName('channel')
                    .setDescription('Channel to send news updates to')
                    .setRequired(true)
                    .addChannelTypes(ChannelType.GuildText)
                )
        )

        .addSubcommand(cmd =>
            cmd.setName('remove')
                .setDescription('Unsubscribe toram news')
        ),

    async execute(interaction) {
        if(!isAuthorized(interaction)) {
            await interaction.reply({
                content: `**Only Admin can use this command**`,
                ephemeral: true
            })
            return;
        }
        
        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guildId;

        // toram list
        if (sub === 'list') {
            const [rows] = await pool.query(`
                SELECT id as row_id, group_id as page_id, title AS Content, url as Url, type AS Type
                FROM ToramIndex
                ORDER BY id DESC
                LIMIT 10
            `);

            const listText = rows.map(
                row => `> **[#${row.page_id}] [${row.Type}]**
                        - **${row.Content}**
                        - **URL: **${row.Url}\n`)
                        .join('\n');

            const listEmbed = new EmbedBuilder()
                .setColor(0x2ecc71)
                .setTitle("✨ **List latest toram news** ✨")
                .setDescription(listText);

            await interaction.reply({ embeds: [listEmbed] });
        }

        // toram get info
        else if (sub === 'get') {
            const id = interaction.options.getInteger('id');

            const [rows] = await pool.query(`
                SELECT content_type AS ContentType, content AS Content
                FROM ToramDetail
                WHERE group_id = ?
                ORDER BY id ASC
            `, [id]);

            if (rows.length === 0) {
                await interaction.reply('**ID not found**');
                return;
            }

            const titleRow = rows.find(r => r.ContentType === "Title");

    
            // if (titleRow) {
            //     const titleEmbed = new EmbedBuilder()
            //         .setColor(0xe67e22)
            //         .setTitle(titleRow.Content);
            //     await interaction.channel.send({ embeds: [titleEmbed] });
            // }

            let embeds = [];
            let description = "";
            let currentEmbed = new EmbedBuilder().setColor(0xffffff);

            if (titleRow) {
                description += `🌸 **${titleRow.Content}** 🌸\n\n\n------------\n\n`;
            }

            for (const { ContentType, Content } of rows) {
                if (ContentType === 'Deluxetitle') {
                    description += `🌟 **${Content}** 🌟\n\n`;
                } else if (ContentType === 'Subtitle') {
                    description += `☆ **${Content}** ☆\n\n`;
                } else if (['Description', 'Subdescription'].includes(ContentType)) {
                    description += `${Content}\n\n`;
                } else if (ContentType === 'Img') {
                    if (description.trim()) currentEmbed.setDescription(description.trim());
                    currentEmbed.setImage(Content);
                    embeds.push(currentEmbed);
                    currentEmbed = new EmbedBuilder().setColor(0xffffff);
                    description = "";
                }
            }

            if (description.trim()) {
                currentEmbed.setDescription(description.trim());
                embeds.push(currentEmbed);
            }

            for (const embed of embeds) {
                await interaction.channel.send({ embeds: [embed] });
            }

            await interaction.reply({ 
                content: `**Sent** #${id}`, 
                ephemeral: true 
            });
        }

        // toram news
        else if (sub === 'news') {
            const channel = interaction.options.getChannel('channel');
            setChannelForGuild(guildId, channel.id);
            await interaction.reply(`**Toram news will be sent to** <#${channel.id}>`);
        }

        // toram remove
        else if (sub === 'remove') {
            const map = await loadChannelMap();
            if (!map[guildId]) {
                await interaction.reply("**This server is not subscribed to toram news**");
                return;
            }

            await removeChannelForGuild(guildId);
            await interaction.reply("**Successfully unsubscribed**");
        }
    }
};
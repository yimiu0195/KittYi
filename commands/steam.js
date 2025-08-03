const { SlashCommandBuilder, ChannelType, EmbedBuilder } = require("discord.js");
const pool = require("../utils/db");
const { isAuthorized } = require("../utils/auth");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("steam")
        .setDescription("Steam sale notification")
        .addSubcommand(sub =>
            sub.setName("send")
                .setDescription("Register a channel to receive Steam Sale notifications")
                .addChannelOption(opt =>
                    opt.setName("channel")
                        .setDescription("Select a channel")
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)
                ))
        .addSubcommand(sub =>
            sub.setName("stop")
                .setDescription("Unregister the Steam Sale notification channel"))
        .addSubcommand(sub =>
            sub.setName("list")
                .setDescription("View the 5 most recent discounted games")),

    async execute(interaction) {
        if (!isAuthorized(interaction)) {
            return interaction.reply({
                content: "**You do not have permission to use this command**",
                ephemeral: true
            });
        }

        const sub = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        if (sub === "send") {
            const channel = interaction.options.getChannel("channel");
            await pool.query(
                "REPLACE INTO steam_channels (guild_id, channel_id) VALUES (?, ?)",
                [guildId, channel.id]
            );
            return interaction.reply({
                content: `**Registered <#${channel.id}> to receive Steam Sale notifications**`,
                ephemeral: true
            });
        }

        if (sub === "stop") {
            await pool.query("DELETE FROM steam_channels WHERE guild_id = ?", [guildId]);
            return interaction.reply({
                content: "**Unregistered from receiving Steam Sale notifications**",
                ephemeral: true
            });
        }

        if (sub === "list") {
            const [rows] = await pool.query(
                "SELECT * FROM steamSales ORDER BY created_at DESC LIMIT 5"
            );
            if (rows.length === 0) {
                return interaction.reply({
                    content: "**No data available yet**",
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setTitle("Latest Steam Discounts")
                .setColor("#1b2838");

            for (const game of rows) {
                embed.addFields({
                    name: `🎮 ${game.title}`,
                    value: `
                        > Discount: **${game.discount}**
                        > Current Price: **${game.price}**
                        > Release Date: **${game.release_date || "Unknown"}**
                        > [🔗 View on Steam](${game.url})`
                });
            }

            return interaction.reply({
                embeds: [embed],
                ephemeral: false
            });
        }
    }
};
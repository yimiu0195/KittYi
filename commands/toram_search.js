const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder, 
    ButtonStyle
} = require('discord.js');

const pool = require('../utils/db');

function buildEquipEmbed(item) {
    let obtained = item.obtained_from || '- ☆☆☆☆☆';
    if (obtained.length > 1000) {
        obtained = obtained.slice(0, 1000) + '\n...';
    }

    return new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(`☆  ${item.name}  ☆`)
        .addFields(
            { name: 'Type', value: item.type || '- ☆☆☆☆☆', inline: true },
            { name: 'Sell Price', value: item.sell_price || '- ☆☆☆☆☆', inline: true },
            { name: 'Process Cost', value: item.process_cost || '- ☆☆☆☆☆', inline: true },
            { name: '🌸 Stats', value: item.stats_normal || '- None', inline: false },
            { name: '🔹 Equipment-Limited Stats', value: item.stats_equipment_limited || '- None', inline: false },
            { name: '🔹 Obtained From', value: item.obtained_from || '- ☆☆☆☆☆', inline: false }
        )
        .setFooter({ text: '☆ Author: Coryn' });
}

function buildCrystalEmbed(item) {
    const colorMap = {
        Red: 0xFF4C4C,
        Blue: 0x4C6FFF,
        Green: 0x4CFF88,
        Yellow: 0xFFFF66,
        Purple: 0xCC66FF
    };

    let obtained = item.obtained_from || '- ☆☆☆☆☆';
    if (obtained.length > 1000) {
        obtained = obtained.slice(0, 1000) + '\n...';
    }

    return new EmbedBuilder()
        .setColor(colorMap[item.color] || 0x987654)
        .setTitle(`☆  ${item.name}  ☆`)
        .addFields(
            { name: 'Type', value: item.type || '- ☆☆☆☆☆', inline: true },
            { name: 'Color', value: item.color || '- 0x987654', inline: true },
            { name: '🌸 Stats', value: item.stats_normal || '- None', inline: false },
            { name: '🔹 Equipment-Limited Stats', value: item.stats_equipment_limited || '- None', inline: false },
            { name: '🔹 Obtained From', value: item.obtained_from || '- ☆☆☆☆☆', inline: false }
        )
        .setFooter({ text: '☆ Author: Coryn' });
}

function buildUsableEmbed(item) {
    let obtained = item.obtained_from || '- ☆☆☆☆☆';
    if (obtained.length > 1000) {
        obtained = obtained.slice(0, 1000) + '\n...';
    }
    
    return new EmbedBuilder()
        .setColor(0x66cc99)
        .setTitle(`☆   ${item.name}    ☆`)
        .addFields(
            { name: 'Sell Price', value: item.sell_price || '- ☆☆☆☆☆', inline: true },
            { name: 'Process Cost', value: item.process_cost || '- ☆☆☆☆☆', inline: true },
            { name: '🌸 Effects', value: item.stats_normal || '- None', inline: false },
            { name: '🔹 Equipment-Limited Stats', value: item.stats_equipment_limited || '- None', inline: false },
            { name: '🔹 Obtained From', value: item.obtained_from || '- ☆☆☆☆☆', inline: false }
        )
        .setFooter({ text: '☆ Author: Coryn' });
}

function buildAvatarEmbed(item) {
    return new EmbedBuilder()
        .setColor(0xff6699)
        .setTitle(`☆   ${item.name}    ☆`)
        .addFields(
            { name: 'Year of Release', value: item.year || 'Unknown', inline: true },
            { name: 'Type', value: item.type || 'Unknown', inline: true }
        )
        .setImage(item.image)
        .setFooter({ text: '☆ Author: Hua' });
}

const equipCommand = {
    data: new SlashCommandBuilder()
        .setName('equip')
        .setDescription('Search equipment by name')
        .addStringOption(opt =>
            opt.setName('name')
                .setDescription('Enter equipment name')
                .setRequired(true)
        ),

    async execute(interaction) {
        const name = interaction.options.getString('name');
        await interaction.deferReply({ ephemeral: false });

        const [rows] = await pool.query(`SELECT * FROM equipments WHERE name LIKE ?`, [`%${name}%`]);
        if (rows.length === 0) {
            return await interaction.editReply({ content: '**No result found**' });
        }

        if (rows.length === 1) {
            const embed = buildEquipEmbed(rows[0]);
            return await interaction.editReply({ 
                embeds: [embed], 
                ephemeral: false });
        }

        const options = rows.slice(0, 25).map(row => ({
            label: row.name.slice(0, 100),
            description: row.type || 'Unknown',
            value: `equipments_${row.id}`
        }));

        const select = new StringSelectMenuBuilder()
        .setCustomId('search_select')
        .setPlaceholder('Select one')
        .addOptions(options);

        const row = new ActionRowBuilder().addComponents(select);

        await interaction.editReply({
            components: [row]
        });
    },

    async handleComponent(interaction) {
        const [table, id] = interaction.values?.[0]?.split('_') || [];
        if (table !== 'equipments') return;

        const [rows] = await pool.query(`SELECT * FROM equipments WHERE id = ?`, [id]);
        const item = rows[0];
        if (!item) {
            return await interaction.update({ 
                content: '**Item not found**', 
                components: [] 
            });
        }

        const embed = buildEquipEmbed(item);
        await interaction.update({
            embeds: [embed],
            components: [interaction.message.components[0]],
            ephemeral: false
        });
    }
};

const xtalCommand = {
    data: new SlashCommandBuilder()
        .setName('xtal')
        .setDescription('Search crysta by name')
        .addStringOption(opt =>
            opt.setName('name')
                .setDescription('Enter crystal name')
                .setRequired(true)
        ),

    async execute(interaction) {
        const name = interaction.options.getString('name');
        await interaction.deferReply({ ephemeral: false });

        const [rows] = await pool.query(`SELECT * FROM Crystals WHERE name LIKE ?`, [`%${name}%`]);
        if (rows.length === 0) {
            return await interaction.editReply({ content: '**No result found**' });
        }

        if (rows.length === 1) {
            const embed = buildCrystalEmbed(rows[0]);
            return await interaction.editReply({ 
                embeds: [embed], 
                ephemeral: false 
            });
        }

        const options = rows.slice(0, 25).map(row => ({
            label: row.name.slice(0, 100),
            description: row.type || 'Unknown',
            value: `Crystals_${row.id}`
        }));

        const select = new StringSelectMenuBuilder()
            .setCustomId('search_select')
            .setPlaceholder('Select one')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(select);

        await interaction.editReply({
            components: [row]
        });
    },

    async handleComponent(interaction) {
        const [table, id] = interaction.values?.[0]?.split('_') || [];
        if (table !== 'Crystals') return;

        const [rows] = await pool.query(`SELECT * FROM Crystals WHERE id = ?`, [id]);
        const item = rows[0];
        if (!item) {
            return await interaction.update({ 
                content: '**Item not found**', 
                components: [] 
            });
        }

        const embed = buildCrystalEmbed(item);
        await interaction.update({
            embeds: [embed],
            components: [interaction.message.components[0]],
            ephemeral: false
        });
    }
};

const usableCommand = {
    data: new SlashCommandBuilder()
        .setName('usable')
        .setDescription('Search usable item by name')
        .addStringOption(opt =>
            opt.setName('name')
                .setDescription('Enter usable item name')
                .setRequired(true)
        ),

    async execute(interaction) {
        const name = interaction.options.getString('name');
        await interaction.deferReply({ ephemeral: false });

        const [rows] = await pool.query(`SELECT * FROM consumables WHERE name LIKE ?`, [`%${name}%`]);
        if (rows.length === 0) {
            return await interaction.editReply({ content: '**No result found**' });
        }

        if (rows.length === 1) {
            const embed = buildUsableEmbed(rows[0]);
            return await interaction.editReply({ 
                embeds: [embed], 
                ephemeral: false 
            });
        }

        const options = rows.slice(0, 25).map(row => ({
            label: row.name.slice(0, 100),
            description: row.sell_price || 'Unknown',
            value: `consumables_${row.id}`
        }));

        const select = new StringSelectMenuBuilder()
            .setCustomId('search_select')
            .setPlaceholder('Select one')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(select);

        await interaction.editReply({
            components: [row]
        });
    },

    async handleComponent(interaction) {
        const [table, id] = interaction.values?.[0]?.split('_') || [];
        if (table !== 'consumables') return;

        const [rows] = await pool.query(`SELECT * FROM consumables WHERE id = ?`, [id]);
        const item = rows[0];
        if (!item) {
            return await interaction.update({ 
                content: '**Item not found**', 
                components: [] 
            });
        }

        const embed = buildUsableEmbed(item);
        await interaction.update({
            embeds: [embed],
            components: [interaction.message.components[0]],
            ephemeral: false
        });
    }
};

const avatarCommand = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Search avatar by name')
        .addStringOption(opt =>
            opt.setName('name')
                .setDescription('Enter avatar name')
                .setRequired(true)
        ),

    async execute(interaction) {
        const name = interaction.options.getString('name');
        await interaction.deferReply({ ephemeral: false });

        const [rows] = await pool.query(`SELECT * FROM avatars WHERE name LIKE ?`, [`%${name}%`]);
        if (rows.length === 0) {
            return await interaction.editReply({ content: '**No result found**' });
        }

        if (rows.length === 1) {
            const embed = buildAvatarEmbed(rows[0]);
            return await interaction.editReply({ embeds: [embed], ephemeral: false });
        }

        const options = rows.slice(0, 25).map(row => ({
            label: row.name.slice(0, 100),
            description: row.type || 'Unknown',
            value: `avatars_${row.id}`
        }));

        const select = new StringSelectMenuBuilder()
            .setCustomId('search_select')
            .setPlaceholder('Select one')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(select);

        await interaction.editReply({ components: [row] });
    },

    async handleComponent(interaction) {
        const [table, id] = interaction.values?.[0]?.split('_') || [];
        if (table !== 'avatars') return;

        const [rows] = await pool.query(`SELECT * FROM avatars WHERE id = ?`, [id]);

        const item = rows[0];
        if (!item) {
            return await interaction.update({ 
                content: '**Avatar not found**', 
                components: [] 
            });
        }

        const embed = buildAvatarEmbed(item);
        await interaction.update({
            embeds: [embed],
            components: [interaction.message.components[0]],
            ephemeral: false
        });
    }
};

const avatarListCommand = {
    data: new SlashCommandBuilder()
        .setName('avatarlist')
        .setDescription('Select a year to view avatars released in that year'),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: false });

        const [rows] = await pool.query(`SELECT DISTINCT year FROM avatars WHERE year IS NOT NULL ORDER BY year DESC`);
        if (rows.length === 0) {
            return await interaction.editReply({ content: '**No avatar data found**' });
        }

        const options = rows.map(row => ({
            label: row.year,
            value: `avatarlist_${row.year}_0`
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('avatarlist_menu')
            .setPlaceholder('Select a year')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.editReply({
            components: [row]
        });
    },

    async handleComponent(interaction) {
        const value = interaction.values?.[0] || interaction.customId;
        let match = value.match(/^avatarlist_(\d+)_([0-9]+)$/);
        if (!match) return;

        const year = match[1];
        const page = parseInt(match[2]);

        const offset = page * 10;

        const [rows] = await pool.query(
            `SELECT * FROM avatars WHERE year = ? ORDER BY name ASC LIMIT 10 OFFSET ?`,
            [year, offset]
        );

        const [countRows] = await pool.query(
            `SELECT COUNT(*) as total FROM avatars WHERE year = ?`,
            [year]
        );
        const total = countRows[0].total;
        const maxPage = Math.floor((total - 1) / 10);

        if (rows.length === 0) {
            return await interaction.update({
                content: `**No avatars found for ${year}**`,
                components: []
            });
        }

        const embed = new EmbedBuilder()
            .setColor(0xffccdd)
            .setTitle(`🎀 Avatars from ${year} (Page ${page + 1} of ${maxPage + 1})`)
            .setDescription(
                rows.map(row => `- ${row.name}`)
                .join('\n'))
            .setFooter({ text: `☆ Use the buttons below to navigate pages` });

        const prevBtn = new ButtonBuilder()
            .setCustomId(`avatarlist_${year}_${page - 1}`)
            .setLabel('⬅️ Prev')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0);

        const nextBtn = new ButtonBuilder()
            .setCustomId(`avatarlist_${year}_${page + 1}`)
            .setLabel('➡️ Next')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page >= maxPage);

        const row = new ActionRowBuilder().addComponents(prevBtn, nextBtn);

        const [yearRows] = await pool.query(`SELECT DISTINCT year FROM avatars WHERE year IS NOT NULL ORDER BY year DESC`);
        const options = yearRows.map(r => ({
            label: r.year,
            value: `avatarlist_${r.year}_0`
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('avatarlist_menu')
            .setPlaceholder(`${year}`)
            .addOptions(options);

        const selectRow = new ActionRowBuilder().addComponents(selectMenu);
        const buttonRow = new ActionRowBuilder().addComponents(prevBtn, nextBtn);

        await interaction.update({
            embeds: [embed],
            components: [selectRow, buttonRow],
            ephemeral: false
        });

    }
};


module.exports = [
    equipCommand, 
    xtalCommand, 
    usableCommand, 
    avatarCommand, 
    avatarListCommand
];
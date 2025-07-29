const {
    SlashCommandBuilder,
    ChannelType,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const pool = require('../utils/db');
const { isAuthorized } = require('../utils/auth');

function safeColor(hex) {
    if (typeof hex === 'string' && /^#?[0-9A-Fa-f]{6}$/.test(hex)) {
        return parseInt(hex.replace('#', ''), 16);
    }
    return 0x00bfff;
}

function parseCustomId(interaction) {
    const [prefix, name] = interaction.customId.split(':');
    return { prefix, name };
}

function isValidHttpUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('Manage embeds')

        .addSubcommand(sub =>
            sub.setName('create')
                .setDescription('Create a new embed')
                .addStringOption(opt =>
                    opt.setName('name')
                        .setDescription('Embed name')
                        .setRequired(true)
                )
        )

        .addSubcommand(sub =>
            sub.setName('edit')
                .setDescription('Edit an existing embed')
                .addStringOption(opt =>
                    opt.setName('name')
                        .setDescription('Embed name')
                        .setRequired(true)
                )
        )

        .addSubcommand(sub =>
            sub.setName('message')
                .setDescription('Send an embed message')
                .addStringOption(opt =>
                    opt.setName('name')
                        .setDescription('Embed name')
                        .setRequired(true)
                )
                .addChannelOption(opt =>
                    opt.setName('channel')
                        .setDescription('Channel to send the embed')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText)
                )
        )

        .addSubcommand(sub =>
            sub.setName('delete')
                .setDescription('Delete an embed')
                .addStringOption(opt =>
                    opt.setName('name')
                        .setDescription('Embed name to delete')
                        .setRequired(true)
                )
        )

        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('List all embeds')
        )

        .addSubcommand(sub =>
            sub.setName('view')
                .setDescription('View an embed')
                .addStringOption(opt =>
                    opt.setName('name')
                        .setDescription('Embed name to view')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        if (!isAuthorized(interaction)) {
            return interaction.reply({ content: `**You don't have permission to use this command**`, ephemeral: true });
        }

        const sub = interaction.options.getSubcommand();

        switch (sub) {
            case 'create':
            case 'edit':
                return module.exports.handleCommand(interaction);
            case 'message':
                return module.exports.handleMessage(interaction);
            case 'delete':
                return module.exports.handleDelete(interaction);
            case 'list':
                return module.exports.handleList(interaction);
            case 'view':
                return module.exports.handleView(interaction);          
            default:
                return interaction.reply({ content: '**Invalid command**', ephemeral: true });
        }
    },

    async handleCommand(interaction) {
        if (!isAuthorized(interaction)) {
            return interaction.reply({ content: `**You don't have permission to use this command**`, ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();
        const name = interaction.options.getString('name');

        if (subcommand === 'create' || subcommand === 'edit') {
            let existingEmbed = null;

            if (subcommand === 'edit') {
                const [rows] = await pool.query(
                    'SELECT * FROM embeds WHERE name=? AND guild_id=?',
                    [name, interaction.guildId]
                );
                if (!rows.length) {
                    await interaction.reply({ content: '**Embed not found**', ephemeral: true });
                    return;
                }
                existingEmbed = rows[0];
            }

            const modal = new ModalBuilder()
                .setCustomId(`${subcommand}Embed:${name}`)
                .setTitle(subcommand === 'edit' ? 'Edit Embed' : 'Create Embed');

            // Add other fields
            const fields = ['title', 'description', 'footer', 'color', 'image_url'];
            for (const id of fields) {
                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId(id)
                            .setLabel(id.charAt(0).toUpperCase() + id.slice(1).replace('_', ' '))
                            .setStyle(id === 'description' ? TextInputStyle.Paragraph : TextInputStyle.Short)
                            .setRequired(false)
                            .setValue(existingEmbed?.[id] || '')
                    )
                );
            }
            await interaction.showModal(modal);
        }
    },

    async handleModal(interaction) {
        if (!isAuthorized(interaction)) {
            return interaction.reply({ content: `**You don't have permission to use this command**`, ephemeral: true });
        }
        
        const { prefix: action, name } = parseCustomId(interaction);
        const isEdit = action === 'editEmbed';
        await interaction.deferReply({ ephemeral: true });

        const getFieldValue = (id) => {
            try {
                return interaction.fields.getTextInputValue(id)?.trim() || null;
            } catch {
                return null;
            }
        };

        const title = getFieldValue('title');
        const description = getFieldValue('description');
        const footer = getFieldValue('footer');
        const color = getFieldValue('color');
        const image_url = getFieldValue('image_url');

        if (footer === '') footer = null;
        if (color === '') color = null;
        if (image_url === '') image_url = null;

        if (image_url && !isValidHttpUrl(image_url)) {
            return interaction.editReply({
                content: '**Invalid image URL. It must start with http:// or https:// **',
                ephemeral: true
            });
        }

        if (color && !/^#?[0-9A-Fa-f]{6}$/.test(color)) {
            return interaction.editReply({
                content: '**Invalid color. Please use hex format like `#abcdef` or `abcdef`**',
                ephemeral: true
            });
        }

        let author = null, avatar_url = null;

        if (!isEdit) {
            author = null;
            avatar_url = null;
        } else {
            const [rows] = await pool.query(
                'SELECT author, avatar_url FROM embeds WHERE name=? AND guild_id=?',
                [name, interaction.guildId]
            );
            if (rows.length) {
                author = rows[0].author;
                avatar_url = rows[0].avatar_url;
            }
        }

        if (isEdit) {
            await pool.query(
                `UPDATE embeds SET title=?, description=?, footer=?, color=?, image_url=?, author=?, avatar_url=?, timestamp=NOW() WHERE name=? AND guild_id=?`,
                [title, description, footer, color, image_url, author, avatar_url, name, interaction.guildId]
            );
        } else {
            await pool.query(
                `INSERT INTO embeds (name, title, description, footer, color, image_url, author, avatar_url, timestamp, guild_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
                [name, title, description, footer, color, image_url, author, avatar_url, interaction.guildId]
            );
        }

        //embed preview
        const embedPreview = new EmbedBuilder()
            .setColor(safeColor(color));

        if (title) embedPreview.setTitle(title);
        if (description) embedPreview.setDescription(description);
        if (footer) embedPreview.setFooter({ text: footer });
        if (image_url) embedPreview.setImage(image_url);
        if (author) embedPreview.setAuthor({ name: author });
        if (avatar_url) embedPreview.setThumbnail(avatar_url);


        if (!title && !description && !footer && !image_url && !author) {
            return await interaction.editReply({
                content: '**Please fill in at least one field to create the embed**',
                components: [],
                embeds: []
            });
        }

        await interaction.editReply({
            content: `**Embed** \`${name}\` ${isEdit ? '**updated**' : '**created**'}!`,
            embeds: [embedPreview],
            components: [
                new ActionRowBuilder().addComponents(
                    //Button to edit embed
                    new ButtonBuilder()
                        .setCustomId(`editEmbed:${name}`)
                        .setLabel('✏ Edit')
                        .setStyle(ButtonStyle.Primary),
                    //Button to edit author
                    new ButtonBuilder()
                        .setCustomId(`editAuthor:${name}`)
                        .setLabel('🖊 Author')
                        .setStyle(ButtonStyle.Secondary)
                )
            ]
        });
    },

    async handleMessage(interaction) {
        const name = interaction.options.getString('name');
        const channel = interaction.options.getChannel('channel');

        const [rows] = await pool.query(
            'SELECT * FROM embeds WHERE name = ? AND guild_id = ?',
            [name, interaction.guildId]
        );

        if (!rows.length) {
            return interaction.reply({ content: `**Cannot find embed \`${name}\`**`, ephemeral: true });
        }

        const data = rows[0];

        const embed = new EmbedBuilder()
            .setTitle(data.title || null)
            .setDescription(data.description || null)
            .setFooter({ text: data.footer || null })
            .setColor(safeColor(data.color))

        if (data.image_url) embed.setImage(data.image_url);
        if (data.author) {
            embed.setAuthor({ name: data.author });
            if (data.avatar_url) embed.setThumbnail(data.avatar_url);
        }

        await channel.send({ embeds: [embed] });
        await interaction.reply({ content: `**Sent an embed to ${channel}**`, ephemeral: true });
    },

    async handleDelete(interaction) {
        const name = interaction.options.getString('name');
        const [rows] = await pool.query('SELECT * FROM embeds WHERE name = ? AND guild_id = ?', [name, interaction.guildId]);

        if (!rows.length) {
            return interaction.reply({ content: '**Embed?**', ephemeral: true });
        }

        await pool.query('DELETE FROM embeds WHERE name = ? AND guild_id = ?', [name, interaction.guildId]);
        await interaction.reply({ content: `**Deleted embed \`${name}\`**`, ephemeral: true });
    },

    async handleList(interaction) {
        const [rows] = await pool.query(
            'SELECT name, title FROM embeds WHERE guild_id = ?',
            [interaction.guildId]
        );

        if (!rows.length) {
            return interaction.reply({
            content: '**Embed?**',
            ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('Embed List')
            .setColor('#e7f3ec')
            .setDescription(
            rows.map(row => `- **${row.name}** — ${row.title || '...'}`)
                .join('\n')
            )
            .setFooter({ text: `${rows.length} embeds` });

        return interaction.reply({ embeds: [embed], ephemeral: true });
    },

    async handleView(interaction) {
        const name = interaction.options.getString('name');
        const [rows] = await pool.query(
            'SELECT * FROM embeds WHERE name = ? AND guild_id = ?',
            [name, interaction.guildId]
        );
        
        if (!rows.length) {
            return interaction.reply({
                content: `**Cannot find embed \`${name}\`**`,
                ephemeral: true
            });
        }

        const embedData = rows[0];

        const embed = new EmbedBuilder()
            .setTitle(embedData.title || null)
            .setDescription(embedData.description || null)
            .setFooter({ text: embedData.footer || '' })
            .setColor(safeColor(embedData.color))

            if (embedData.image_url) embed.setImage(embedData.image_url);

            if (embedData.author) {
                embed.setAuthor({ name: embedData.author });
                if (embedData.avatar_url) embed.setThumbnail(embedData.avatar_url);
            }

        return interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
};

module.exports.handleAuthorButton = async function(interaction) {
    if (!isAuthorized(interaction)) {
        return interaction.reply({ content: `**You don't have permission to use this action**`, ephemeral: true });
    }

    const { name } = parseCustomId(interaction);

    const [rows] = await pool.query(
        'SELECT * FROM embeds WHERE name=? AND guild_id=?',
        [name, interaction.guildId]
    );

    if (!rows.length) {
        return interaction.reply({ content: '**Embed not found**', ephemeral: true });
    }

    const embedData = rows[0];

    const authorInput = new TextInputBuilder()
        .setCustomId('author')
        .setLabel('Author Name')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setValue(embedData.author || '');

    const avatarInput = new TextInputBuilder()
        .setCustomId('avatar_url')
        .setLabel('Avatar URL')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setValue(embedData.avatar_url || '');
    
    const modal = new ModalBuilder()
        .setCustomId(`editAuthorModal:${name}`)
        .setTitle('Edit Author + Avatar')
        .addComponents(
            new ActionRowBuilder().addComponents(authorInput),
            new ActionRowBuilder().addComponents(avatarInput)
        );

    await interaction.showModal(modal);
};

module.exports.handleAuthorModal = async function(interaction) {
    if (!isAuthorized(interaction)) {
        return interaction.reply({ 
            content: `**You don't have permission to use this action**`, 
            ephemeral: true 
        });
    }

    const { name } = parseCustomId(interaction);

    await interaction.deferReply({ ephemeral: true });

    let author = interaction.fields.getTextInputValue('author')?.trim();
    let avatar_url = interaction.fields.getTextInputValue('avatar_url')?.trim();
    if (author === '') author = null;
    if (avatar_url === '') avatar_url = null;

    if (avatar_url && !isValidHttpUrl(avatar_url)) {
        return interaction.editReply({ 
            content: '**Invalid avatar URL**', 
            ephemeral: true 
        });
    }

    await pool.query(
        'UPDATE embeds SET author=?, avatar_url=?, timestamp=NOW() WHERE name=? AND guild_id=?',
        [author || null, avatar_url || null, name, interaction.guildId]
    );

    const embed = new EmbedBuilder()
        .setAuthor({ name: author || 'No author' })
        .setColor(0x00bfff)
        .setTitle('Preview')

    if (avatar_url) {
        embed.setThumbnail(avatar_url);
    }
    return interaction.editReply({
        embeds: [embed]
    });
};

module.exports.handleEditButton = async function(interaction) {
    if (!isAuthorized(interaction)) {
        return interaction.reply({ content: `**You don't have permission to use this action**`, ephemeral: true });
    }

    const { name } = parseCustomId(interaction);

    const [rows] = await pool.query(
        'SELECT * FROM embeds WHERE name=? AND guild_id=?',
        [name, interaction.guildId]
    );

    if (!rows.length) {
        return interaction.reply({ 
            content: '**Embed not found**', 
            ephemeral: true 
        });
    }

    const existingEmbed = rows[0];

    const modal = new ModalBuilder()
        .setCustomId(`editEmbed:${name}`)
        .setTitle('Edit Embed');

    const fields = ['title', 'description', 'footer', 'color', 'image_url'];
    for (const id of fields) {
        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                .setCustomId(id)
                .setLabel(id.charAt(0).toUpperCase() + id.slice(1).replace('_', ' '))
                .setStyle(id === 'description' ? TextInputStyle.Paragraph : TextInputStyle.Short)
                .setRequired(false)
                .setValue(existingEmbed?.[id] || '')
            )
        );
    }

    await interaction.showModal(modal);
};

module.exports.handleComponent = async function(interaction) {
    const { customId } = interaction;
    if (customId.startsWith('editEmbed:')) {
        return await module.exports.handleEditButton(interaction);
    }
    if (customId.startsWith('editAuthor:')) {
        return await module.exports.handleAuthorButton(interaction);
    }
};

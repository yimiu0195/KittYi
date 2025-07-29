const {
    SlashCommandBuilder, 
    ModalBuilder, 
    TextInputBuilder,
    TextInputStyle, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ChannelType
} = require('discord.js');

const db = require('../utils/db');
const { DateTime } = require('luxon');
const { isAuthorized } = require('../utils/auth.js');

function formatTime(val) {
    if (!val) return '';
    const date = new Date(val);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('schedule')
        .setDescription('Manage scheduled messages')

        .addSubcommand(sub =>
            sub.setName('add')
                .setDescription('Add a new schedule'))

        .addSubcommand(sub =>
            sub.setName('edit')
                .setDescription('Edit an existing schedule')
                .addStringOption(opt => 
                    opt.setName('name')
                        .setDescription('Schedule name to edit')
                        .setRequired(true)))

        .addSubcommand(sub =>
            sub.setName('delete')
                .setDescription('Delete a schedule')
                .addStringOption(opt => 
                    opt.setName('name')
                        .setDescription('Schedule name to delete')
                        .setRequired(true)))

        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('List all schedules'))
            
        .addSubcommand(sub =>
            sub.setName('send')
                .setDescription('Set the destination channel')
                .addStringOption(opt => 
                    opt.setName('name')
                        .setDescription('Schedule name')
                        .setRequired(true))
                .addChannelOption(opt => 
                    opt.setName('channel')
                        .setDescription('Destination channel')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)))
        
        .addSubcommand(sub =>
            sub.setName('pause')
            .setDescription('Pause a schedule')
                .addStringOption(opt => 
                    opt.setName('name')
                        .setDescription('Schedule name')
                        .setRequired(true)))
        
        .addSubcommand(sub =>
            sub.setName('resume')
                .setDescription('Resume a schedule')
                .addStringOption(opt => 
                    opt.setName('name')
                        .setDescription('Schedule name')
                        .setRequired(true))),

    async execute(interaction) {
        if (!isAuthorized(interaction)) {
            return interaction.reply({ 
                content: `**Nah bro, you don't have permission**`, 
                ephemeral: true 
            });
        }

        const sub = interaction.options.getSubcommand();
        const name = interaction.options.getString('name');
        const guildId = interaction.guild.id;

        if (sub === 'add' || sub === 'edit') {
            const existingData = sub === 'edit'
                ? (await db.execute('SELECT * FROM schedulers WHERE name_scheduler = ? AND guild_id = ?', [name, guildId]))[0][0] || {}
                : {};

            const modal = new ModalBuilder()
                .setCustomId(`schedule:step1:${sub}:${name || ''}`)
                .setTitle(`${sub === 'edit' ? 'Edit' : 'Add'} schedule: Step 1`)
                .addComponents(
                    ...(sub === 'add' ? [
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('name_scheduler')
                                .setLabel('Schedule name')
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true)
                        )
                    ] : []),

                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('send_time')
                            .setLabel('Time (YYYY-MM-DD HH:MM)')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                            .setValue(formatTime(existingData.send_time))
                    ),

                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('timezone')
                            .setLabel('Timezone (Asia/Ho_Chi_Minh, Asia/Bangkok,...)')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(false)
                            .setValue(existingData.timezone || 'UTC')
                    ),

                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('message_type')
                            .setLabel('Type (embed or text)')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                            .setValue(existingData.message_type || '')
                    )
                );
            return interaction.showModal(modal);
        }

        const channel = interaction.options.getChannel('channel');

        switch (sub) {
            case 'delete': {
                await db.execute('DELETE FROM schedulers WHERE name_scheduler = ? AND guild_id = ?', [name, guildId]);
                return interaction.reply({ 
                    content: `**Schedule** \`${name}\` **deleted**`, 
                    ephemeral: true 
                });
            }
            case 'send': {
                await db.execute('UPDATE schedulers SET channel_id = ? WHERE name_scheduler = ? AND guild_id = ?', [channel.id, name, guildId]);
                return interaction.reply({ 
                    content: `**Schedule** \`${name}\` **will send to** ${channel}`, 
                    ephemeral: true 
                });
            }
            case 'pause':
            case 'resume': {
                const status = sub === 'pause' ? 'pending' : 'sent';
                const [result] = await db.execute('UPDATE schedulers SET status_scheduler = ? WHERE name_scheduler = ? AND guild_id = ?', [status, name, guildId]);
                return interaction.reply({
                    content: result.affectedRows ? `${sub === 'pause' ? '**⏸️ Paused**' : '**▶️ Resumed**'} **schedule** \`${name}\`` : `**Schedule** \`${name}\` **not found**`,
                    ephemeral: true
                });
            }
            case 'list': {
                const [rows] = await db.execute('SELECT name_scheduler, send_time, message_type, repeat_time, status_scheduler FROM schedulers WHERE guild_id = ?', [guildId]);
                if (!rows.length) return interaction.reply({ 
                    content: '**No schedules found**', 
                    ephemeral: true 
                });
                const list = rows.map(r => `• \`${r.name_scheduler}\` - ${r.message_type} - ${formatTime(r.send_time)} - repeat: ${r.repeat_time || 'none'} - status: ${r.status_scheduler || 'pending'}`).join('\n');
                return interaction.reply({ 
                    content: `**Schedules:**\n${list}`, 
                    ephemeral: true 
                });
            }
        }
    },

    async handleModal(interaction) {
        if (!isAuthorized(interaction)) {
            return interaction.reply({ 
                content: `**Nah bro, you don't have permission**`, 
                ephemeral: true 
            });
        }

        const [prefix, step, mode, name, ...rest] = interaction.customId.split(':');
        const guildId = interaction.guild.id;

        if (prefix !== 'schedule') return;

        if (step === 'step1') {
            const rawSendTime = interaction.fields.getTextInputValue('send_time');
            const timezone = interaction.fields.getTextInputValue('timezone')?.trim() || 'UTC';
            const messageType = interaction.fields.getTextInputValue('message_type');
            const finalName = mode === 'add' ? interaction.fields.getTextInputValue('name_scheduler') : name;

            if (!['text', 'embed'].includes(messageType)) {
                return interaction.reply({ 
                    content: '**Invalid message type. Use `text` or `embed`**', 
                    ephemeral: true 
                });
            }

            const step2Btn = new ButtonBuilder()
                .setCustomId(`schedule:open_step2:${mode}:${finalName}:${encodeURIComponent(rawSendTime)}:${encodeURIComponent(timezone)}:${messageType}`)
                .setLabel('➡️ Continue to Step 2')
                .setStyle(ButtonStyle.Primary);

            const step1Btn = new ButtonBuilder()
                .setCustomId(`schedule:redo_step1:${mode}:${finalName}`)
                .setLabel('🔁 Edit Step 1')
                .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder().addComponents(step1Btn, step2Btn);

            return interaction.reply({
                content: `**Step 1 saved for** \`${finalName}\`. **Choose an action below:**`,
                ephemeral: true,
                components: [row]
            });
        }

        if (step === 'step2') {
            const [rawSendTime, timezone, messageType] = rest.map(decodeURIComponent);
            const mention = interaction.fields.getTextInputValue('mention_target')?.trim() || '';
            const content = interaction.fields.getTextInputValue('content');
            const finalContent = mention ? `${mention}\n${content}` : content;
            const repeatTime = interaction.fields.getTextInputValue('repeat_time')?.trim().toLowerCase() || 'none';
            const intervalMinutes = parseInt(interaction.fields.getTextInputValue('interval_minutes')) || null;

            let sendTimeUTC;
            try {
                sendTimeUTC = DateTime.fromFormat(rawSendTime, 'yyyy-MM-dd HH:mm', { zone: timezone }).toUTC().toSQL({ includeOffset: false });
            } catch (e) {
                return interaction.reply({ 
                    content: '**Invalid time format or timezone**', 
                    ephemeral: true 
                });
            }

            const scheduleName = name;

            if (mode === 'add') {
                const [exists] = await db.execute('SELECT name_scheduler FROM schedulers WHERE name_scheduler = ? AND guild_id = ?', [scheduleName, guildId]);
                if (exists.length) {
                    return interaction.reply({ 
                        content: `**Schedule** \`${scheduleName}\` **already exists**`, 
                        ephemeral: true 
                    });
                }

                await db.execute(`INSERT INTO schedulers (name_scheduler, content, message_type, send_time, timezone, repeat_time, interval_minutes, status_scheduler, guild_id, channel_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
                [scheduleName, finalContent, messageType, sendTimeUTC, timezone, repeatTime, intervalMinutes, guildId, interaction.channel.id]);
            } else {
                await db.execute(`UPDATE schedulers SET content = ?, message_type = ?, send_time = ?, timezone = ?, repeat_time = ?, interval_minutes = ?
                    WHERE name_scheduler = ? AND guild_id = ?`,
                [finalContent, messageType, sendTimeUTC, timezone, repeatTime, intervalMinutes, scheduleName, guildId]);
            }

            console.log('Step 2 Values:', {
                name: scheduleName,
                guildId,
                finalContent,
                messageType,
                sendTimeUTC,
                timezone,
                repeatTime,
                intervalMinutes,
            });
            
            return interaction.reply({ 
                content: `**Schedule** \`${scheduleName}\` ${mode}ed.`, 
                ephemeral: true 
            });
        }
    },

    async handleComponent(interaction) {
        if (!isAuthorized(interaction)) {
            return interaction.reply({ 
                content: `**Nah bro, you don't have permission**`, 
                ephemeral: true 
            });
        }
        
        const [prefix, action, mode, name, ...rest] = interaction.customId.split(':');
        if (prefix !== 'schedule') return;

        if (action === 'redo_step1') {
            const existingData = mode === 'edit'
                ? (await db.execute('SELECT * FROM schedulers WHERE name_scheduler = ? AND guild_id = ?', 
                    [name, interaction.guild.id]))[0][0] || {}
                : {};

        const modal = new ModalBuilder()
            .setCustomId(`schedule:step1:${mode}:${name || ''}`)
            .setTitle(`${mode === 'edit' ? 'Edit' : 'Add'} schedule: Step 1`)
            .addComponents(
                ...(mode === 'add' ? [
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('name_scheduler')
                            .setLabel('Schedule name')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                            .setValue(name || '')
                    )
                ] : []),

                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('send_time')
                        .setLabel('Time (YYYY-MM-DD HH:mm)')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                        .setValue(formatTime(existingData.send_time))
                ),

                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('timezone')
                        .setLabel('Timezone (Asia/Ho_Chi_Minh, Asia/Bangkok..)')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)
                        .setValue(existingData.timezone || 'UTC')
                ),

                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('message_type')
                        .setLabel('Type (embed or text)')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                        .setValue(existingData.message_type || '')
                )
            );

            return interaction.showModal(modal);
        }

        if (action === 'open_step2') {
            const [rawSendTime, timezone, messageType] = rest.map(decodeURIComponent);

            const modal = new ModalBuilder()
                .setCustomId(`schedule:step2:${mode}:${name}:${encodeURIComponent(rawSendTime)}:${encodeURIComponent(timezone)}:${messageType}`)
                .setTitle('Step 2: Content and Repeat')
                .addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('content')
                            .setLabel('Message content or embed name')
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(true)
                    ),

                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('mention_target')
                            .setLabel('Mention (optional: @everyone, <@&role_id>)')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(false)
                    ),

                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('repeat_time')
                            .setLabel('Repeat (minutes, hourly, daily, none,...)')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(false)
                    ),

                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('interval_minutes')
                            .setLabel('⏱ Interval in minutes (1, 2, 3...)')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(false)
                    )
                );

            return interaction.showModal(modal);
        }
    }
};
const { Events } = require('discord.js');

const helpMenu = require('../handlers/help')

module.exports = {
    name: Events.InteractionCreate,

    async execute(interaction) {
        if (
            !interaction.isCommand() &&
            !interaction.isStringSelectMenu() &&
            !interaction.isModalSubmit() &&
            !interaction.isButton()
        )
        return;

        const client = interaction.client;

        try {
        // Help menu
        if(interaction.isStringSelectMenu() && interaction.customId === 'help_menu') {
            return await helpMenu(interaction)
        }

        // Detect command type
        let command = null;

        if (interaction.isChatInputCommand()) {
            command = client.commands.get(interaction.commandName);

        } else {
            const customId = interaction.customId || '';
            const value = interaction.values?.[0] || '';

            if (value.startsWith('equipments_') || customId.startsWith('equip_')) {
                command = client.commands.get('equip');
            } else if (value.startsWith('Crystals_') || customId.startsWith('xtal_')) {
                command = client.commands.get('xtal');
            } else if (
                value.startsWith('consumables_') ||
                customId.startsWith('usable_')
            ) {
                command = client.commands.get('usable');
            } else if (
                value.startsWith('avatars_') || 
                customId.startsWith('avatar_')
            ) {
                command = client.commands.get('avatar');
            } else if (
                value.startsWith('avatarlist_') || 
                customId.startsWith('avatarlist_')
            ) {
                command = client.commands.get('avatarlist');
            } else if (
                value.startsWith('embeds_') ||
                customId.startsWith('embed_') ||
                customId.startsWith('createEmbed') ||
                customId.startsWith('editEmbed') ||
                customId.startsWith('editAuthor:') ||
                customId.startsWith('editAuthorModal:')
            ) {
                command = client.commands.get('embed');
            } else if (
                customId.startsWith('schedule:') ||
                customId.startsWith('scheduleModal:')
            ) {
                command = client.commands.get('schedule');
            }
        }

        if (!command) return;

        // Execute appropriate handler
        if (interaction.isChatInputCommand()) {
            await command.execute(interaction);

        } else if (
            (interaction.isStringSelectMenu() || interaction.isButton()) &&
            typeof command.handleComponent === 'function'
        ) {
            await command.handleComponent(interaction);

        } else if (interaction.isModalSubmit()) {
            const customId = interaction.customId;

            if (customId.startsWith('editAuthorModal:') && typeof command.handleAuthorModal === 'function') {
                await command.handleAuthorModal(interaction);
            } else if (
                (customId.startsWith('createEmbed:') || customId.startsWith('editEmbed:')) &&
                typeof command.handleModal === 'function'
            ) {
                await command.handleModal(interaction);

            } else if (typeof command.handleModal === 'function') {
                await command.handleModal(interaction);
            }
        }

        } catch (err) {
            console.error('❌ Error handling interaction:', err);
            const reply = {
                content: '**If you see this message, please contact Hua. Thank you!**',
                ephemeral: true,
            };

            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: `**There was an error processing the command (please pretend that you didn't see this line)**`, ephemeral: true });
                } else {
                    await interaction.followUp({ content: `There was an error processing the command (please pretend that you didn't see this line)`, ephemeral: true });
                }
            } catch (sendError) {
                console.error('❌ Failed to send error reply:', sendError);
            }
        }
    },
};
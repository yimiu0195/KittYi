const {
    Events,
    EmbedBuilder } = require('discord.js');

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
        if (interaction.isStringSelectMenu() && interaction.customId === 'help_menu') {
            let embed;
            switch (interaction.values[0]) {
                case 'toram_news':
                    embed = new EmbedBuilder()
                        .setColor(0xf37472)
                        .setTitle('🌸   Toram News (Administrator only)  🌸')
                        .setDescription(
                            '\n- **/toram news** `[channel]` - Register a channel to receive Toram news\n' +
                            '- **/toram list** - List the 10 most recent Toram news posts\n' +
                            '- **/toram get** `[id]` - Get Info by ID (Use `/toram list` to get ID)\n' +
                            '- **/toram remove** - Unsubscribe from Toram news'
                        );
                    break;

                case 'toram_search':
                    embed = new EmbedBuilder()
                        .setColor(0x9472f3)
                        .setTitle('🌸   Toram Search    🌸')
                        .setDescription(
                            '\n- **/xtal** `[name]` - Search for Crystals\n' +
                            '- **/equip** `[name]` - Search for Equipments\n' +
                            '- **/usable** `[name]` - Search for Consumables\n' +
                            '- **/avatar** `[name]` - Search for Avatars\n' +
                            '- **/avatarlist** - List avatars released in a year'
                        );
                    break;

                case 'embed_cmds':
                    embed = new EmbedBuilder()
                        .setColor(0xe7f3ec)
                        .setTitle('🌸   Embed Commands (Administrator only)  🌸')
                        .setDescription(
                            '\n- **/embed create** `[embed name]` - Create an embed\n' +
                            '- **/embed edit** `[embed name]` - Edit an existing embed\n' +
                            '- **/embed view** `[embed name]` - View an embed\n' +
                            '- **/embed message** `[embed name]` `[channel]` - Send an embed message\n' +
                            '- **/embed delete** `[embed name]` - Delete an embed\n' +
                            '- **/embed list** - List all embeds'
                        );
                    break;

                case 'schedule_cmds':
                    embed = new EmbedBuilder()
                        .setColor(0xd6cdb2)
                        .setTitle('🌸   Schedule Commands (Administrator only)   🌸')
                        .setDescription(
                            '\n- **/schedule add** - Add a new schedule\n' +
                            '- **/schedule edit** `[schedule name]` - Edit an existing schedule\n' +
                            '- **/schedule send** `[schedule name]` `[channel]` - Set the destination channel\n' +
                            '- **/schedule delete** `[schedule name]` - Delete a schedule\n' +
                            '- **/schedule pause** `[schedule name]` - Pause a schedule\n' +
                            '- **/schedule resume** `[schedule name]` - Resume a schedule\n' +
                            '- **/schedule list** - List all schedules'
                        );
                    break;

                case 'other_cmds':
                    embed = new EmbedBuilder()
                        .setColor(0xf6e09e)
                        .setTitle('🌸   Other Commands    🌸')
                        .setDescription(
                            '\n- **/help** - Show this help message\n'
                        );
                    break;
                    
                case 'tz_cmds':
                    embed = new EmbedBuilder()
                        .setColor(0xffffff)
                        .setTitle('🌸   Timezones   🌸')
                        .setDescription(
                            '\n- **Australia** - `Australia/Lindeman` - UTC +10:00\n' +
                            '- **Canada** - `America/Creston` - UTC -07:00\n' +
                            '- **France** - `Europe/Paris` - UTC +02:00\n' +
                            '- **Germany** - `Europe/Berlin` - UTC +02:00\n' +
                            '- **Hong Kong** - `Asia/Hong_Kong` - UTC +08:00\n' +
                            '- **India** - `Asia/Kolkata` - UTC +05:30\n' +
                            '- **Indonesia** - `Asia/Jakarta` - UTC +07:00\n' +
                            '- **Italy** - `Europe/Rome` - UTC +02:00\n' +
                            '- **Japan** - `Asia/Tokyo` - UTC +09:00\n' +
                            '- **Mexico** - `America/Bahia_Banderas` - UTC -06:00\n'+
                            '- **Philippines** - `Asia/Manila` - UTC +08:00\n' +
                            '- **Taiwan** - `Asia/Taipei` - UTC +08:00\n' +
                            '- **Thailand** - `Asia/Bangkok` - UTC +07:00\n' +
                            '- **United States** - `America/New_York` - UTC -04:00\n' +
                            '- **Viet Nam** - `Asia/Ho_Chi_Minh` - UTC +07:00\n\n' +
                            '> Or visit this site: https://timezonedb.com/time-zones\n'
                        );
                    break;
            }

            return await interaction.update({
                embeds: [embed],
                components: [interaction.message.components[0]],
            });
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
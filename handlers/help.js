const { EmbedBuilder } = require ('discord.js');

module.exports = async function helpMenu(interaction) {
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
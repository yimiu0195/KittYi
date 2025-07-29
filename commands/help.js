const {
	SlashCommandBuilder,
	ActionRowBuilder,
	StringSelectMenuBuilder,
	EmbedBuilder,
} = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Show the help message with available commands'),

	async execute(interaction) {
		const embed = new EmbedBuilder()
			.setColor(0xffffff)
			.setTitle('Did you call me? (˶˃ ᵕ ˂˶) .ᐟ.ᐟ')
			.setDescription('What can I help with? ✮⋆˙');

		const menu = new StringSelectMenuBuilder()
			.setCustomId('help_menu')
			.setPlaceholder('Select a help category')
			.addOptions([
				{
					label: 'Toram News',
					description: 'Commands for Toram news feed',
					value: 'toram_news',
				},
				{
					label: 'Toram Search',
					description: 'Search for crystals, equips, etc',
					value: 'toram_search',
				},
				{
					label: 'Embed Commands',
					description: 'Manage embed templates',
					value: 'embed_cmds',
				},
				{
					label: 'Schedule Commands',
					description: 'Manage scheduled messages',
					value: 'schedule_cmds',
				},
				{
					label: 'Other Commands',
					description: 'Miscellaneous commands',
					value: 'other_cmds',
				},
				{
					label: 'List Timezones',
					description: 'List of Timezones for Schedule Commands',
					value: 'tz_cmds',
				},
			]);

		const row = new ActionRowBuilder().addComponents(menu);

    	await interaction.reply({
			embeds: [embed],
			components: [row],
			ephemeral: false,
		});
	},
};
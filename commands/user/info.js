const { Client, CommandInteraction, EmbedBuilder, APIEmbedField } = require('discord.js');
const commandType = require("../../commandTypes.json");
const { getUnits, unitsLastUpdated, rankColors, trainings, log, getUser} = require('../../helpers');

module.exports = {
	name: 'info',
	description: 'Check a users roster information',
	type: commandType.CHAT_INPUT,
	options: [
		{
			name: "user",
			description: "User you'd like to search",
			type: commandType.args.USER,
		},
		{
			name: "callsign",
			description: "Callsign you'd like to search",
			type: commandType.args.STRING,
		},
		{
			name: "badge",
			description: "Badge you'd like to search",
			type: commandType.args.STRING,
		}
	],
	/**
	 * @param {Client} client
	 * @param {CommandInteraction} interaction
	 * @param {String[]} args
	*/
	hasPermission: async (client, interaction, args) => {
		return true;
	},
	/**
	 * @param {Client} client
	 * @param {CommandInteraction} interaction
	 * @param {String[]} args
	 */
	run: async (client, interaction, args) => {
		if(!args[0]) {
			return interaction.reply({
				content: `Hm, did you put a callsign or user?`,
				ephemeral: true
			})
		}

		let units = await getUnits();
		let unit = await getUser(args[0], interaction);

		if(!unit) {
			return interaction.reply({
				content: "Hm, we can't seem to find that user.",
				ephemeral: true
			});
		}

		const fields = [
			{ name: 'Callsign', value: unit.callsign, inline: true },
			{ name: 'Badge', value: unit.badge, inline: true },

			{ name: 'Rank', value: unit.rank, inline: false },
			{ name: 'Tenure', value: unit.tenure, inline: true },
		]

		const trainingFields = [];

		unit.training.forEach(training => {
			trainingFields.push({ name: training.name, value: training.value === 'TRUE' ? '✅' : '❌', inline: true})
		})

		await log(`Searched [${unit.callsign}] ${unit.name}'s record`, interaction);
		await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(rankColors[unit.rank])
					.setTitle(unit.name)
					.addFields(fields),
				new EmbedBuilder()
					.setColor(rankColors[unit.rank])
					.setTitle(`Training`)
					.addFields(trainingFields)
					.setFooter({
						text: 'Last Updated'
					})
					.setTimestamp(unitsLastUpdated())
			]
		})
	}
}

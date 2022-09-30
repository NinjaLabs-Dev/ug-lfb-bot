const { Client, CommandInteraction, EmbedBuilder, APIEmbedField } = require('discord.js');
const commandType = require("../../commandTypes.json");
const { getUnits, unitsLastUpdated, rankColors, trainings, log} = require('../../helpers');

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

		let callsign;
		if(args[0].includes('-')) {
			callsign = args[0].toUpperCase();
		} else {
			let user = interaction.guild.members.cache.find(u => u.id === args[0]);

			if(!user || user.bot || user.system) {
				await interaction.reply({
					content: `Oops! There seems to be an issue with that user.`,
					ephemeral: true
				})
			} else {
				let _callsign = user.displayName.match(/(?<=\[).+?(?=\])/g);
				if(_callsign.length) {
					callsign = _callsign[0];
				}
			}
		}

		if(callsign) {
			let units = await getUnits();
			let unit = units.find(x => x.callsign === callsign);

			if(!unit) {
				return interaction.reply({
					content: "Hm we can't find a user with that callsign.",
					ephemeral: true
				});
			}

			const fields = [
				{ name: 'Rank', value: unit.rank, inline: true },
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
						.setTitle(`${unit.callsign} - ${unit.name}`)
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
		} else {
			await interaction.reply({
				content: "Hm we either can't find that user or they don't have a callsign!",
				ephemeral: true
			});
		}
	}
}

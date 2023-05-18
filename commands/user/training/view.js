const { Client, CommandInteraction, EmbedBuilder, UserSelectMenuBuilder, ActionRowBuilder,
	StringSelectMenuBuilder, UserSelectMenuInteraction
} = require('discord.js');
const { unitsLastUpdated, rankColors, trainings, getUser, getUnits} = require('../../../helpers');

module.exports = {
	subCommand: true,
	/**
	 * @param {Client} client
	 * @param {CommandInteraction} interaction
	 */
	hasPermission: async (client, interaction) => {
		return interaction.member.roles.cache.find(r => r.id === process.env.TRAINER_ROLE_ID);
	},
	/**
	 * @param {Client} client
	 * @param {CommandInteraction} interaction
	 */
	run: async (client, interaction) => {
		const userSelectMenu = new UserSelectMenuBuilder()
			.setCustomId('training-view/user')
			.setPlaceholder('Select user')
			.setMinValues(1)

		const actionUserRow = new ActionRowBuilder()
			.addComponents(userSelectMenu)

		await interaction.editReply({
			content: "Select a User",
			components: [actionUserRow],
			ephemeral: true
		})
	},
	/**
	 * @param {Client} client
	 * @param {UserSelectMenuInteraction} interaction
	 */
	menuCallback: async (client, interaction) => {
		await interaction.deferReply({ ephemeral: true });

		let units = await getUnits();

		const menuId = interaction.customId.split('/');
		const action = menuId[0].split('-')[1];
		const trainingOptions = trainings.map(t => {
			return { name: t.name, value: t.key, label: t.name }
		})

		const hasSelectedTraining = interaction.customId.split(`training-${action}/user/`)[1]
		let id = hasSelectedTraining

		if(!hasSelectedTraining) {
			id = interaction.values[0]

			const trainingSelectMenu = new StringSelectMenuBuilder()
				.setCustomId(`training-view/user/${id}`)
				.setPlaceholder('Select training')
				.setMinValues(1)
				.setMaxValues(1)
				.setOptions(trainingOptions)

			const actionTrainingRow = new ActionRowBuilder()
				.addComponents(trainingSelectMenu)

			return interaction.editReply({
				content: "Select a Training",
				components: [actionTrainingRow],
				ephemeral: true
			})
		} else {
			let unit = await getUser(id, interaction);

			unit.training.forEach(training => {
				if(training.key === interaction.values[0]) {
					let fields = [
						{ name: 'Status', value: training.value === 'TRUE' ? 'Qualified' : 'Unqualified', inline: true },
					];

					if(training.value === 'TRUE') {
						fields.push({
							name: 'Trainer',
							value: training.trainer !== '' && training.trainer ? training.trainer : 'Unknown',
							inline: true
						});

						fields.push({
							name: 'Date',
							value: training.date !== '' && training.date ? training.date : 'Unknown',
							inline: false
						});
					}

					return interaction.editReply({
						embeds: [
							new EmbedBuilder()
								.setColor(rankColors[unit.rank])
								.setTitle(`Training Search: ${unit.name} - ${training.name}`)
								.addFields(fields)
								.setFooter({
									text: 'Last Updated'
								})
								.setTimestamp(unitsLastUpdated())
						]
					})
				}
			})
		}
	}
}

const { Client, CommandInteraction, EmbedBuilder, APIEmbedField, StringSelectMenuBuilder, ActionRowBuilder,
	UserSelectMenuBuilder
} = require('discord.js');
const { getUnits, unitsLastUpdated, rankColors, trainings, assignTraining, removeTraining, log, getUser, hasTraining} = require('../../../helpers');

module.exports = {
	subCommand: true,
	/**
	 * @param {Client} client
	 * @param {CommandInteraction} interaction
	 * @param {String[]} args
	 */
	hasPermission: async (client, interaction, args) => {
		return interaction.member.roles.cache.find(r => r.id === process.env.TRAINER_ROLE_ID);
	},
	/**
	 * @param {Client} client
	 * @param {CommandInteraction} interaction
	 * @param {String[]} args
	 */
	run: async (client, interaction, args) => {
		const userSelectMenu = new UserSelectMenuBuilder()
			.setCustomId('training-remove/user')
			.setPlaceholder('Select user')
			.setMinValues(1)

		const actionUserRow = new ActionRowBuilder()
			.addComponents(userSelectMenu)

		interaction.reply({
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
		const menuId = interaction.customId.split('/');
		const menuName = menuId[0].split('-')[0];
		const action = menuId[0].split('-')[1];
		const type = menuId[1];
		const trainingOptions = trainings.map(t => {
			return { name: t.name, value: t.key, label: t.name }
		})

		const hasSelectedTraining = interaction.customId.split(`training-${action}/user/`)[1]
		let id = hasSelectedTraining

		if(!hasSelectedTraining) {
			id = interaction.values[0]
			let user = getUser(id, interaction);

			const trainingSelectMenu = new StringSelectMenuBuilder()
				.setCustomId(`training-remove/user/${id}`)
				.setPlaceholder('Select training')
				.setMinValues(1)
				.setMaxValues(5)
				.setOptions(trainingOptions)

			const actionTrainingRow = new ActionRowBuilder()
				.addComponents(trainingSelectMenu)

			return interaction.reply({
				content: "Select Trainings",
				components: [actionTrainingRow],
				ephemeral: true
			})
		} else {
			let user = getUser(id, interaction);
			await interaction.deferReply({ ephemeral: true });

			for (const training of interaction.values) {
				let trainingPresent = hasTraining(user, training);

				if(!trainingPresent) {
					for (const _training of trainings) {
						if(_training.key === training) {
							await removeTraining(user, _training, interaction)
						}
					}
				}
			}

			return interaction.editReply({
				content: "Training(s) successfully removed.",
			})
		}
	}
}

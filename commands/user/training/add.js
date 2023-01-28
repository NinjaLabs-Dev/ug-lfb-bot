const { Client, CommandInteraction, ActionRowBuilder, StringSelectMenuBuilder, UserSelectMenuBuilder} = require('discord.js');
const { getUnits, unitsLastUpdated, rankColors, columns, trainings, assignTraining, removeTraining, log, getUser } = require('../../../helpers');

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
		const trainingOptions = trainings.map(t => {
			return { name: t.name, value: t.key, label: t.name }
		})

		const trainingSelectMenu = new StringSelectMenuBuilder()
			.setCustomId('training-add/training')
			.setPlaceholder('Select training')
			.setMinValues(1)
			.setOptions(trainingOptions)

		const userSelectMenu = new UserSelectMenuBuilder()
			.setCustomId('training-add/user')
			.setPlaceholder('Select user')
			.setMinValues(1)


		const actionTrainingRow = new ActionRowBuilder()
			.addComponents(trainingSelectMenu)

		const actionUserRow = new ActionRowBuilder()
			.addComponents(userSelectMenu)

		interaction.reply({
			content: "Select Options",
			components: [actionTrainingRow, actionUserRow],
			ephemeral: true
		})
	}
}

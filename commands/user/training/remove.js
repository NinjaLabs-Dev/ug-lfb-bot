const { Client, CommandInteraction, EmbedBuilder, APIEmbedField } = require('discord.js');
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
		interaction.reply({
			content: `Hi ${interaction.commandName}`
		})
	}
}

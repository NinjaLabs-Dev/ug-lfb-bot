const { Client, CommandInteraction } = require('discord.js');
const commandType = require("../../commandTypes.json");
const { updateUnits } = require('../../helpers');

module.exports = {
	name: 'force-update',
	description: 'Force update data',
	type: commandType.CHAT_INPUT,
	/**
	 * @param {Client} client
	 * @param {CommandInteraction} interaction
	 * @param {String[]} args
	*/
	hasPermission: async (client, interaction, args) => {
		return interaction.member.id === process.env.DEVELOPER_ID;
	},
	/**
	 * @param {Client} client
	 * @param {CommandInteraction} interaction
	 * @param {String[]} args
	 */
	run: async (client, interaction, args) => {
		updateUnits();

		console.log('[INFO] Data has been forcibly updated by developer')

		await interaction.editReply({
			content: 'Data has been forcibly updated.',
			ephemeral: true
		})
	}
}

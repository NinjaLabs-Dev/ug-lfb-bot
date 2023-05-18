const { Client, CommandInteraction } = require('discord.js');
const commandType = require("../../commandTypes.json");

module.exports = {
	name: 'ping',
	description: 'Checks if the bot is alive',
	type: commandType.CHAT_INPUT,
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
		await interaction.editReply({
			content: "I'm still alive!",
			ephemeral: true
		})
	}
}

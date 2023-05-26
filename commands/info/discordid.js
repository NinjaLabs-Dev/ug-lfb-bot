const { Client, CommandInteraction } = require('discord.js');
const commandType = require("../../commandTypes.json");

module.exports = {
	name: 'discordid',
	description: 'Get the Discord ID of a user',
	type: commandType.CHAT_INPUT,
	options: [
		{
			name: "user",
			description: "User you'd like to get the id for",
			type: commandType.args.USER,
			required: true
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
		let userId = args.find(arg => arg.name === "user");
		let user = await interaction.guild.members.cache.get(userId.value);

		await interaction.editReply({
			content: `<@${user.user.id}>'s Discord ID is \`${user.user.id}\``,
			ephemeral: true
		})
	}
}

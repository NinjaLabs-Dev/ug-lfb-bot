const { Client, CommandInteraction, codeBlock } = require('discord.js');
const commandType = require("../../commandTypes.json");
const { updateUnits, getUser} = require('../../helpers');

module.exports = {
	name: 'raw-data',
	description: 'See raw data for a unit',
	type: commandType.CHAT_INPUT,
	options: [
		{
			name: "user",
			description: "User you'd like to search",
			type: commandType.args.USER,
			required: true
		},
	],
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
		let unit = await getUser(args.user, interaction);

		if(!unit) {
			return interaction.reply({
				content: "Hm, we can't seem to find that user.",
				ephemeral: true
			});
		}

		console.log('[INFO] Getting raw user data for developer')

		await interaction.reply({
			content: codeBlock('json', JSON.stringify(unit, null, 4)),
			ephemeral: true
		})
	}
}

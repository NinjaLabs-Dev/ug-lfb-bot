const { Client, CommandInteraction, EmbedBuilder} = require('discord.js');
const commandType = require("../../commandTypes.json");
const {stations} = require("../../helpers");

module.exports = {
	name: 'station',
	description: 'Show information of a station',
	type: commandType.CHAT_INPUT,
	options: [
		{
			name: 'station',
			type: commandType.args.STRING,
			description: "Station",
			choices: stations.map((s, i) => {
				return { name: s.name, value: i.toString() }
			}),
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
		let station = stations[parseInt(args[0].value)];

		const embed = new EmbedBuilder()
			.setTitle(station.name)
			.setDescription(`${station.name} station is located at postal ${station.postal}.`)
			.setImage(station.map)
			.setColor(0xba1424);

		return interaction.editReply({
			embeds: [
				embed
			],
		})
	}
}

const { Client, CommandInteraction, EmbedBuilder, APIEmbedField } = require('discord.js');
const commandType = require("../../commandTypes.json");
const { getUnits, unitsLastUpdated, rankColors, trainings, log, getUser} = require('../../helpers');
const client = require("../../index");

module.exports = {
	name: 'remove-induction',
	description: 'Remove induction role',
	type: commandType.CHAT_INPUT,
	options: [
		{
			name: "user",
			description: "User you'd like to remove induction from",
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
		return interaction.member.roles.cache.find(r => r.id === process.env.TRAINER_ROLE_ID);
	},
	/**
	 * @param {Client} client
	 * @param {CommandInteraction} interaction
	 * @param {String[]} args
	 */
	run: async (client, interaction, args) => {
		let userId = args.find(arg => arg.name === "user").value
		let user = await client.users.fetch(userId);
		let member = await interaction.guild.members.fetch(user.id);
		let role = await interaction.guild.roles.cache.get(client.config.INDUCTION_ROLE_ID);
		let hasRole = await interaction.member.roles.cache.has(client.config.INDUCTION_ROLE_ID);

		if(!hasRole) {
			return interaction.editReply({
				content: `Hm, that person doesn't seem to have the induction role.`,
				ephemeral: true
			})
		}

		try {
			await member.roles.remove(role);
		} catch (e) {
			client.sentry.captureException(e);

			return interaction.editReply({
				content: `There was an issue completing this.`,
				ephemeral: true
			})
		}

		return interaction.editReply({
			content: `Removed induction role from ${user.tag}.`,
			ephemeral: true
		});
	}
}

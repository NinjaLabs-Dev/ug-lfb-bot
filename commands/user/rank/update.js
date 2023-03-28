const { Client, CommandInteraction, ActionRowBuilder, StringSelectMenuBuilder, UserSelectMenuBuilder, UserSelectMenuInteraction} = require('discord.js');
const { getUnits, unitsLastUpdated, rankColors, trainings, assignTraining, removeTraining, log, getUser, hasTraining,
	logAction, rankRoles
} = require('../../../helpers');

module.exports = {
	subCommand: true,
	/**
	 * @param {Client} client
	 * @param {CommandInteraction} interaction
	 * @param {String[]} args
	 */
	hasPermission: async (client, interaction, args) => {
		return interaction.member.roles.cache.find(r => r.id === process.env.HR_ROLE_ID);
	},
	/**
	 * @param {Client} client
	 * @param {CommandInteraction} interaction
	 * @param {String[]} args
	 */
	run: async (client, interaction, args) => {
		const userSelectMenu = new UserSelectMenuBuilder()
			.setCustomId('rank-update/user')
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
		await interaction.deferReply({ ephemeral: true });

		let units = await getUnits();
		let id = interaction.values[0];
		let user = getUser(id, interaction);

		if(!user) {
			return interaction.editReply({
				content: "That is not a valid user!",
			})
		}

		let dUser = interaction.guild.members.cache.get(id)
		let rankRole = rankRoles[user.rank]

		let rolesToRemove = [];
		for (let rId of Object.entries(rankRoles)) {
			rId = rId[1]
			let role = await interaction.guild.roles.fetch(rId)

			if(role) {
				rolesToRemove.push(role)
			}
		}

		let ranksToAdd = [
			rankRole.toString(),
			rankRoles["LFB"]
		]

		let watch = user.watch
		if(watch && watch !== '') {
			ranksToAdd.push(rankRoles[watch])
		}

		if(user.isTrainer) {
			ranksToAdd.push(rankRoles["Trainer"])
		}

		dUser.roles.remove(rolesToRemove)
		dUser.roles.add(ranksToAdd)

		return interaction.editReply({
			content: "Rank updated successfully.",
		})
	}
}

const { Client, CommandInteraction, ActionRowBuilder, StringSelectMenuBuilder, UserSelectMenuBuilder, UserSelectMenuInteraction,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle
} = require('discord.js');
const { getUnits, unitsLastUpdated, rankColors, trainings, assignTraining, removeTraining, log, getUser, hasTraining,
	logAction
} = require('../../helpers');
const commandType = require("../../commandTypes.json");

module.exports = {
	name: 'nickname',
	description: 'Update a users nickname',
	type: commandType.CHAT_INPUT,
	options: [],
	/**
	 * @param {Client} client
	 * @param {CommandInteraction} interaction
	 * @param {String[]} args
	 */
	hasPermission: async (client, interaction, args) => {
		// return interaction.member.roles.cache.find(r => r.id === process.env.TRAINER_ROLE_ID);
		return true;
	},
	/**
	 * @param {Client} client
	 * @param {CommandInteraction} interaction
	 * @param {String[]} args
	 */
	run: async (client, interaction, args) => {
		const userSelectMenu = new UserSelectMenuBuilder()
			.setCustomId('nickname')
			.setPlaceholder('Select user')
			.setMinValues(1)

		const actionUserRow = new ActionRowBuilder()
			.addComponents(userSelectMenu)

		interaction.editReply({
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
		let id = interaction.values[0]
		let dUser = await interaction.guild.members.cache.get(id)

		const modal = new ModalBuilder()
			.setCustomId(`nicknameModal-${id}`)
			.setTitle("Change Nickname")

		const nicknameInput = new TextInputBuilder()
			.setCustomId('nickname')
			.setLabel('Nickname')
			.setStyle(TextInputStyle.Short)
			.setRequired(false)
			.setValue(dUser.nickname ?? "")
			.setPlaceholder(dUser.user.username)

		modal.addComponents(new ActionRowBuilder().addComponents(nicknameInput));


		return interaction.showModal(modal);
	}
}

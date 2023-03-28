const { Client, CommandInteraction, ActionRow, ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js');
const commandType = require("../../commandTypes.json");
const client = require("../../index");
const { suggestionStatus, generateSuggestionEmbed, generateManagementSuggestionEmbed, logAction} = require("../../helpers");

module.exports = {
	name: 'nicknameModal',
	/**
	 * @param {Client} client
	 * @param {CommandInteraction} interaction
	 * @param {String[]} userId
	 */
	run: async (client, interaction, userId) => {
		let user = interaction.guild.members.cache.get(userId)
		let nickname = interaction.fields.getTextInputValue('nickname');

		if(!user) {
			return interaction.reply({
				content: "We couldn't find that user!",
				ephemeral: true
			})
		}

		try {
			await user.setNickname(nickname)

			return interaction.reply({
				content: `Updated nickname!`,
				ephemeral: true
			})
		} catch (e) {
			await logAction(`Updated nickname from ${user.nickname ?? user.name} to ${nickname}`, interaction);

			return interaction.reply({
				content: `We can't do that :c`,
				ephemeral: true
			})
		}
	}
}

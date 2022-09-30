const { Client, CommandInteraction, EmbedBuilder} = require('discord.js');
const commandType = require("../../commandTypes.json");
const { getRosterData, log, getUnits, rankColors} = require('../../helpers');
const moment = require("moment");

module.exports = {
	name: 'shifts',
	description: 'Overview of your shifts',
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

		let callsign = interaction.member.displayName.match(/(?<=\[).+?(?=\])/g);
		if(!callsign.length) {
			return interaction.reply({
				content: "Hm we can't find a callsign on your user. Is it set?",
				ephemeral: true
			});
		}

		let unitName = interaction.member.displayName.match(/([^\]]+$)/);
		unitName = unitName[0].slice(1);

		let roster = await getRosterData();
		let sheet = await roster.sheetsByTitle[unitName];

		let rows = await sheet.getRows({
			offset: 8
		});

		let shifts = '';

		rows.forEach(row => {
			// Ensure the shift has a valid date and times
			if(row._rawData[0] && row._rawData[1] && row._rawData[2]) {
				shifts += `**${row._rawData[0]}**: ${row._rawData[1]} - ${row._rawData[2]} \n`
			}
		});

		let units = await getUnits();
		let unit = units.find(u => u.callsign === callsign[0]);

		await sheet.loadCells('E6');
		let totalHours = await sheet.getCellByA1('E6');

		let embed = new EmbedBuilder()
			.setColor(rankColors[unit.rank])
			.setTitle('Shifts Overview')
			.setDescription(shifts)
			.setTimestamp()
			.setFooter({
				text: 'Total Hours: ' + parseFloat(totalHours.value).toFixed(2)
			});

		await log(`[${unit.callsign}] ${unit.name} viewed shifts`, interaction);

		await interaction.reply({
			embeds: [embed],
			ephemeral: true
		})
	}
}

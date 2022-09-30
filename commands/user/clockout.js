const { Client, CommandInteraction } = require('discord.js');
const commandType = require("../../commandTypes.json");
const { getRosterData, log, getUnits } = require('../../helpers');
const moment = require("moment");

module.exports = {
	name: 'clockout',
	description: 'Clock out duty',
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

		let rowNumber = 10;

		let lastRow = rows[rows.length - 1];
		if(lastRow) {
			rowNumber = lastRow._rowNumber;
		}

		await sheet.loadCells('A10:C45');

		let date = sheet.getCellByA1(`A${rowNumber}`);
		if(date.value !== moment().format('D/M/y')) {
			return interaction.reply({
				content: "Hm, I can't find a shift that started today.",
				ephemeral: true
			})
		}

		let endTime = sheet.getCellByA1(`C${rowNumber}`);
		if(endTime.value !== null) {
			return interaction.reply({
				content: "Hm, It seems you've already clocked out of the last shift.",
				ephemeral: true
			})
		}

		endTime.value = moment().format('HH:mm');

		await sheet.saveUpdatedCells();

		let units = await getUnits();
		let unit = units.find(u => u.callsign === callsign[0]);
		await log(`[${unit.callsign}] ${unit.name} clocked out`, interaction);
		console.log(`[INFO] Successfully submitted clock out for ${unitName}`);

		await interaction.reply({
			content: "Clocked out, see you soon!",
			ephemeral: true
		})
	}
}

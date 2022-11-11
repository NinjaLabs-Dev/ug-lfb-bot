const { Client, CommandInteraction } = require('discord.js');
const commandType = require("../../commandTypes.json");
const { getRosterData, log, getUnits } = require('../../helpers');
const moment = require("moment");

module.exports = {
	name: 'clockin',
	description: 'Clock on duty',
	type: commandType.CHAT_INPUT,
	options: [
		{
			name: 'time',
			type: commandType.args.STRING,
			description: "The time of this (14:50)"
		},
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

		if(!sheet) {
			return interaction.reply({
				content: "You don't seem to have a sheet on the roster. Contact Command",
				ephemeral: true
			})
		}

		let rows = await sheet.getRows({
			offset: 8
		});

		let rowNumber = 10;

		let lastRow = rows[rows.length - 1];
		if(lastRow) {
			rowNumber = lastRow._rowNumber + 1;
		}

		await sheet.loadCells('A10:C45');

		let date = sheet.getCellByA1(`A${rowNumber}`);
		date.value = moment().format('D/M/y');

		let startTime = sheet.getCellByA1(`B${rowNumber}`);
		startTime.value = args[0] ? args[0] : moment().format('HH:mm');

		await sheet.saveUpdatedCells();


		let units = await getUnits();
		let unit = units.find(u => u.callsign === callsign[0]);
		await log(`[${unit.callsign}] ${unit.name} clocked in`, interaction);
		console.log(`[INFO] Successfully submitted clock in for ${unitName}`);

		await interaction.reply({
			content: "Clocked in, have a nice shift.",
			ephemeral: true
		})
	}
}

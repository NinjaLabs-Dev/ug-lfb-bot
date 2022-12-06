const { CommandInteraction, EmbedBuilder} = require('discord.js');
const axios = require("axios");
const moment = require("moment");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const rosterCredentials = require("./lfb-bot-00cf901ff71c.json");
const client = require('./index');
let roster;
let hr;

let columns = {
	"NAME": 0,
	"RANK": 1,
	"CALLSIGN": 2,
	"TENURE": 5,
	"DRIVING": 14,
	"COMMS": 15,
	"FIRSTAID": 16,
	"WATER": 17,
	"RTC": 19,
	"ADVDRIVING": 20,
	"COPILOT": 21,
	"PILOT": 22,
	"DISPATCH": 24,
	"FI": 25,
	"SC": 26,
	"TRAINER": 10
}

let trainingOffset = 6;
let trainingColumns = {
	"CALLSIGN": {
		col: 0,
	},
	"DRIVING": {
		col: trainingOffset,
	},
	"DRIVING_DATE": {
		col: trainingOffset + 1,
	},
	"COMMS": {
		col: trainingOffset + 2,
	},
	"COMMS_DATE": {
		col: trainingOffset + 3,
	},
	"FIRSTAID": {
		col: trainingOffset + 4,
	},
	"FIRSTAID_DATE": {
		col: trainingOffset + 5,
	},
	"WATER": {
		col: trainingOffset + 6,
	},
	"WATER_DATE": {
		col: trainingOffset + 7,
	},
	"RTC": {
		col: trainingOffset + 9,
	},
	"RTC_DATE": {
		col: trainingOffset + 10,
	},
	"ADVDRIVING": {
		col: trainingOffset + 11,
	},
	"ADVDRIVING_DATE": {
		col: trainingOffset + 12,
	},
	"COPILOT": {
		col: trainingOffset + 13,
	},
	"COPILOT_DATE": {
		col: trainingOffset + 14,
	},
	"PILOT": {
		col: trainingOffset + 15,
	},
	"PILOT_DATE": {
		col: trainingOffset + 16,
	},
	"DISPATCH": {
		col: trainingOffset + 18,
	},
	"DISPATCH_DATE": {
		col: trainingOffset + 19,
	},
	"FI": {
		col: trainingOffset + 20,
	},
	"FI_DATE": {
		col: trainingOffset + 21,
	},
	"SC": {
		col: trainingOffset + 22,
	},
	"SC_DATE": {
		col: trainingOffset + 23,
	},
}

let trainings = [
	{ name: 'Driving', key: 'DRIVING' },
	{ name: 'Comms', key: 'COMMS' },
	{ name: 'First Aid', key: 'FIRSTAID' },
	{ name: 'Water', key: 'WATER' },
	{ name: 'RTC', key: 'RTC' },
	{ name: 'Adv Driving', key: 'ADVDRIVING' },
	{ name: 'Co-Pilot', key: 'COPILOT' },
	{ name: 'Pilot', key: 'PILOT' },
	{ name: 'Dispatch', key: 'DISPATCH' },
	{ name: 'FI', key: 'FI' },
	{ name: 'SC', key: 'SC' },
	{ name: 'Trainer', key: 'TRAINER' },
]


let rankColors = {
	"Commissioner": 0xd80000,
	"Deputy Commissioner": 0xe74c3c,
	"Area Manager": 0xad1457,
	"Watch Manager": 0x1abc9c,
	"Crew Manager": 0x3498db,
	"Lead Firefighter": 0x9b59b6,
	"Advanced Firefighter": 0xe91e63,
	"Firefighter": 0xf1c40f,
	"Trainee Firefighter": 0xe67e22,
	"Retained Firefighter": 0xe74c3c,
}
let units = [];
let _unitsLastUpdated = null;

authSheets();

// Sync units every 30 seconds
setInterval(async () => {
	syncUnits()
}, 1000 * process.env.UNIT_UPDATE_RATE)

function updateUnits() {
	syncUnits()
}

async function syncUnits() {
	let _units = [];

	let mainRows = await roster.sheetsByTitle['Main Roster'].getRows();

	mainRows.forEach((row, i) => {
		if(row['First Name']) {
			let unitTrainings = [];

			trainings.forEach(training => {
				unitTrainings.push({
					name: training.name,
					value: row[training.name],
					key: training.key
				});
			})

			_units.push({
				row: i,
				name: row['Full Name'],
				callsign: row['Callsign'],
				badge: row['Badge'],
				rank: row['Rank'],
				tenure: row['Tenure'],
				nameBadge: row['Name and Badge'],
				training: unitTrainings,
				hr: {
					citizen: 'Unknown',
					bank: 'Unknown',
					contact: 'Unknown',
					birth: 'Unknown',
					photo: 'Unknown'
				}
			});
		}
	})

	let trainingRows = await roster.sheetsByTitle['Training History'].getRows();

	trainingRows.forEach(row => {
		if(row['Unit']) {
			let unit = _units.find(u => u.nameBadge === row['Unit'])

			if(unit) {
				unit.training.forEach(unitTraining => {
					if (unitTraining.name === row['Training']) {
						unitTraining.trainer = row['Trainer']
						unitTraining.date = row['Training Date']
					}
				})
			}
		}
	})

	let hrRows = await hr.sheetsByTitle['Personnel Info'].getRows();

	hrRows.forEach(row => {
		if(row['Badge']) {
			let unit = _units.find(u => u.badge === row['Badge'])

			if(unit) {
				unit.hr.citizen = row['Citizen ID'];
				unit.hr.bank = row['Bank Account'];
				unit.hr.contact = row['Contact Number'];
				unit.hr.birth = row['DOB'];
				unit.hr.photo = row['Photo'];
			}
		}
	})

	console.log(`[INFO] Updated units at: ${new Date().toISOString()}`)

	units = _units;
	_unitsLastUpdated = new Date();
}

async function updateCell(column, row, value, sheet = "Main Roster") {
	let page = await roster.sheetsByTitle[sheet].getRows({
		limit: 1,
		offset: row,
	});
	page[0][column] = value;
	await page[0].save();

	console.log(`[INFO] Successfully updated ${column} to "${value}"`)
}

async function getRowByValue(column, value, sheet = "Main Roster") {
	let page = await roster.sheetsByTitle[sheet].getRows();
	let row = null

	page.forEach((r, rn) => {
		if(r[column] === value) {
			row = r;
			console.log(`[INFO] Successfully found ${value} on row ${rn}`);
		}
	})

	return [row, page];
}

async function getUnits() {
	return units;
}

function unitsLastUpdated() {
	return _unitsLastUpdated;
}

/**
* @param { CommandInteraction } interaction
*/
function getUserDisplayName(interaction) {
	return `${interaction.user.username}#${interaction.user.discriminator} (${interaction.user.id})`
}

function capitalizeFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * @param row int
 * @param training array
 * @param interaction {CommandInteraction}
*/
async function assignTraining(unit, training, interaction) {
	let columns = ['Unit', 'Training Date', 'Trainer', 'Training']

	let trainer = getUser(interaction.user.id, interaction);
	if(!trainer) {
		return interaction.reply({
			content: "There was an error doing this.",
			ephemeral: true
		})
	}

	let trainingSheet = await roster.sheetsByTitle['Training History']
	let rows = await trainingSheet.getRows({
		offset: 1
	});

	let rowNumber = 2;
	let foundNumber = false
	rows.forEach(row => {
		if(!row['Unit'] && !foundNumber) {
			console.log(row._rowNumber)
			rowNumber = row._rowNumber;
			foundNumber = true
		}
	})

	await trainingSheet.loadCells(`A${rowNumber}:F${rowNumber}`);

	let _unit = trainingSheet.getCellByA1(`B${rowNumber}`);
	_unit.value = `[${unit.badge}] ${unit.name}`;

	let date = trainingSheet.getCellByA1(`C${rowNumber}`);
	date.value = moment().format('DD/M/y');

	let _trainer = trainingSheet.getCellByA1(`D${rowNumber}`);
	_trainer.value = `[${trainer.badge}] ${trainer.name}`;

	let _training = trainingSheet.getCellByA1(`E${rowNumber}`);
	_training.value = training.name;

	await trainingSheet.saveUpdatedCells();
}

/**
 * @param unit array
 * @param training array
 * @param interaction {CommandInteraction}
 */
async function removeTraining(unit, training, interaction) {
	let rows = await roster.sheetsByTitle['Training History'].getRows({ offset: 1 });

	rows.forEach(row => {
		if(row['Unit'] === unit.nameBadge && row['Training'] === training.name) {
			row['Unit'] = '';
			row['Training Date'] = '';
			row['Trainer'] = '';
			row['Training'] = '';

			row.save();
		}
	})
}

async function authSheets() {
	const rosterCredentials = require('./lfb-bot-00cf901ff71c.json');
	const rosterDoc = new GoogleSpreadsheet(process.env.SHEET_ID);
	rosterDoc.useServiceAccountAuth(rosterCredentials).then(async () => {
		roster = rosterDoc;
		await roster.loadInfo();

		const hrDoc = new GoogleSpreadsheet(process.env.HR_SHEET_ID);

		hrDoc.useServiceAccountAuth(rosterCredentials).then(async () => {
			hr = hrDoc;
			await hr.loadInfo();

			console.log("[INFO] Successfully connected to google sheets - HR!");
			return true;
		}).catch(() => {
			console.log("[ERROR] There was an issue connecting to google sheets - HR!")
		});

		console.log("[INFO] Successfully connected to google sheets! - Roster");
		return true;
	}).catch(() => {
		console.log("[ERROR] There was an issue connecting to google sheets - Roster!")
	});
}

/**
 * @param action string
 * @param interaction {CommandInteraction}
 */
async function log(action, interaction) {
	if(!process.env.LOG_CHANNEL) {
		return console.log('[MAJOR] No log channel has been set!')
	}

	let channel = interaction.guild.channels.cache.get(process.env.LOG_CHANNEL);

	if(!channel) {
		return console.log("[MAJOR] Log channel is set but can't be found!");
	}

	let fields = [
		{ name: 'User', value: interaction.member.displayName, inline: true },
		{ name: 'Channel', value: '#' + interaction.channel.name, inline: true },
		{ name: 'Action', value: action }
	]

	let logEmbed = new EmbedBuilder()
		.setColor(0xe74c3c)
		.setTitle('Action Log')
		.addFields(fields)
		.setTimestamp();

	channel.send({
		embeds: [logEmbed]
	});
}

function getRosterData() {
	return roster;
}

/**
 * @param term string
 * @param interaction { CommandInteraction }
 */
function getUser(term, interaction) {
	if(term.includes('-')) {
		let callsign = term.toUpperCase();
		let unit = units.find(u => u.callsign === callsign);

		return unit ?? false;
	}

	if(term.length === 18) {
		let user = client.getDiscordUser(term, interaction.guild);

		let _callsign = user.displayName.match(/(?<=\[).+?(?=\])/g);
		if(_callsign.length) {
			let unit = units.find(u => u.callsign === _callsign[0]);

			return unit ?? false;
		}

		return false;
	}

	if(term.length === 3) {
		let badge = term;
		let unit = units.find(u => u.badge === badge);

		return unit ?? false;
	}

	return false;
}

exports.getUser = getUser;
exports.getUserDisplayName = getUserDisplayName;
exports.rankColors = rankColors;
exports.getUnits = getUnits;
exports.syncUnits = syncUnits;
exports.unitsLastUpdated = unitsLastUpdated;
exports.columns = columns;
exports.trainings = trainings;
exports.capitalizeFirstLetter = capitalizeFirstLetter;
exports.updateUnits = updateUnits;
exports.assignTraining = assignTraining;
exports.removeTraining = removeTraining;
exports.log = log;
exports.getRosterData = getRosterData;
exports.getRowByValue = getRowByValue;

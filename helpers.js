const { CommandInteraction, EmbedBuilder} = require('discord.js');
const axios = require("axios");
const moment = require("moment");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const rosterCredentials = require("./lfb-bot-00cf901ff71c.json");
let roster;

let columns = {
	"NAME": 0,
	"RANK": 1,
	"CALLSIGN": 2,
	"TENURE": 5,
	"DRIVING": 14,
	"COMMS": 15,
	"FIRSTAID": 16,
	"WATER": 17,
	"RTA": 19,
	"ADVDRIVING": 20,
	"COPILOT": 21,
	"PILOT": 22,
	"DISPATCH": 24,
	"FI": 25,
	"SC": 26,
	"TRAINER": 10
}

let trainingColumns = {
	"CALLSIGN": {
		col: 0,
		letter: 'B'
	},
	"DRIVING": {
		col: 5,
		letter: 'G'
	},
	"DRIVING_DATE": {
		col: 6,
		letter: 'H'
	},
	"COMMS": {
		col: 7,
		letter: 'I'
	},
	"COMMS_DATE": {
		col: 8,
		letter: 'J'
	},
	"FIRSTAID": {
		col: 9,
		letter: 'K'
	},
	"FIRSTAID_DATE": {
		col: 10,
		letter: 'L'
	},
	"WATER": {
		col: 11,
		letter: 'M'
	},
	"WATER_DATE": {
		col: 12,
		letter: 'N'
	},
	"RTA": {
		col: 14,
		letter: 'P'
	},
	"RTA_DATE": {
		col: 15,
		letter: 'Q'
	},
	"ADVDRIVING": {
		col: 16,
		letter: 'R'
	},
	"ADVDRIVING_DATE": {
		col: 17,
		letter: 'S'
	},
	"COPILOT": {
		col: 18,
		letter: 'T'
	},
	"COPILOT_DATE": {
		col: 19,
		letter: 'U'
	},
	"PILOT": {
		col: 20,
		letter: 'V'
	},
	"PILOT_DATE": {
		col: 21,
		letter: 'W'
	},
	"DISPATCH": {
		col: 23,
		letter: 'Y'
	},
	"DISPATCH_DATE": {
		col: 24,
		letter: 'Z'
	},
	"FI": {
		col: 25,
		letter: 'AA'
	},
	"FI_DATE": {
		col: 26,
		letter: 'AB'
	},
	"SC": {
		col: 27,
		letter: 'AC'
	},
	"SC_DATE": {
		col: 28,
		letter: 'AD'
	},
}

let trainings = [
	{ name: 'Driving', key: 'DRIVING' },
	{ name: 'Comms', key: 'COMMS' },
	{ name: 'First Aid', key: 'FIRSTAID' },
	{ name: 'Water', key: 'WATER' },
	{ name: 'RTA', key: 'RTA' },
	{ name: 'Adv Driving', key: 'ADVDRIVING' },
	{ name: 'Co-Pilot', key: 'COPILOT' },
	{ name: 'Pilot', key: 'PILOT' },
	{ name: 'Dispatch', key: 'DISPATCH' },
	{ name: 'FI', key: 'FI' },
	{ name: 'SC', key: 'SC' },
	{ name: 'Trainer', key: 'TRAINER' },
]


let rankColors = {
	"Fire Commissioner": 0xd80000,
	"Deputy Fire Commissioner": 0xe74c3c,
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

// Sync units on startup
authRoster();

// Sync units every 30 seconds
setInterval(async () => {
	syncUnits()
}, 1000 * 30)

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
				callsign: row['Badge No.'],
				rank: row['Rank'],
				tenure: row['Tenure'],
				training: unitTrainings
			});
		}
	})

	let trainingRows = await roster.sheetsByTitle['Training Database'].getRows();

	trainingRows.forEach(row => {
		if(row['First Name']) {
			let unit = _units.find(u => u.callsign === row['Badge No.'])

			if(unit) {
				unit.training.forEach(unitTraining => {
					if(unitTraining.key !== 'TRAINER') {
						unitTraining.trainer = row._rawData[trainingColumns[unitTraining.key].col + 1];
						unitTraining.date = row._rawData[trainingColumns[unitTraining.key + '_DATE'].col + 1];
					}
				})
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
async function assignTraining(row, training, interaction) {
	let trainerColumn = training.name;
	let dateColumn = training.name + ' Date';
	let user = interaction.guild.members.cache.find(u => u.id === interaction.member.id);
	let trainerName = user.displayName.match(/([^\]]+$)/);
	if(!trainerName.length) {
		return interaction.reply({
			content: "We couldn't find a callsign for that user.",
			ephemeral: true
		})
	}
	trainerName = trainerName[0].slice(1);

	await updateCell(trainerColumn, row, trainerName, "Training Database");
	await updateCell(dateColumn, row, moment().format('D/M/y'), "Training Database");
}

/**
 * @param row int
 * @param training array
 * @param interaction {CommandInteraction}
 */
async function removeTraining(row, training, interaction) {
	let trainerColumn = training.name;
	let dateColumn = training.name + ' Date';

	await updateCell(trainerColumn, row, '', "Training Database");
	await updateCell(dateColumn, row, '', "Training Database");
}

async function authRoster() {
	const rosterCredentials = require('./lfb-bot-00cf901ff71c.json');
	const doc = new GoogleSpreadsheet(process.env.SHEET_ID);
	doc.useServiceAccountAuth(rosterCredentials).then(async () => {
		roster = doc;
		await roster.loadInfo();
		console.log("[INFO] Successfully connected to google sheets!");

		// Waits for connection and then syncs
		syncUnits();
	}).catch(() => {
		console.log("[ERROR] There was an issue connecting to google sheets!")
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

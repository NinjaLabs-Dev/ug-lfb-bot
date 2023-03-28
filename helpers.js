const { CommandInteraction, EmbedBuilder, UserSelectMenuInteraction } = require('discord.js');
const moment = require("moment");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const client = require('./index');
const { logInfo, logError, logSuccess } = require("./helpers/log");
let roster;
let hr;

let trainings = [
	{ name: 'Driving', key: 'DRIVING' },
	{ name: 'Comms', key: 'COMMS' },
	{ name: 'First Aid', key: 'FIRSTAID' },
	{ name: 'Water', key: 'WATER' },
	{ name: 'RTC', key: 'RTC' },
	{ name: 'Adv Driving', key: 'ADVDRIVING' },
	{ name: 'Co-Pilot', key: 'COPILOT' },
	{ name: 'Pilot', key: 'PILOT' },
	{ name: 'SC', key: 'SC' },
	{ name: 'Dispatch', key: 'DISPATCH' },
	{ name: 'FI', key: 'FI' },
	{ name: 'S&R', key: 'S&R' },
	{ name: 'Trainer', key: 'TRAINER' },
]

let rankColors = {
	"Commissioner": 0xd80000,
	"Deputy Commissioner": 0xe74c3c,
	"Asst. Commissioner": 0xe74c3c,
	"Area Manager": 0xad1457,
	"Red Watch Manager": 0x1abc9c,
	"Blue Watch Manager": 0x1abc9c,
	"Crew Manager": 0x3498db,
	"Lead Firefighter": 0x9b59b6,
	"Advanced Firefighter": 0xe91e63,
	"Firefighter": 0xf1c40f,
	"Trainee Firefighter": 0xe67e22,
	"Retained Firefighter": 0xe74c3c,
}

let rankRoles = {
	"Commissioner": 1023688801966628891,
	"Deputy Commissioner": "1023688801966628889",
	"Asst. Commissioner": "1023688801966628888",
	"Area Manager": "1023688801966628887",
	"Red Watch Manager": "1023688801966628886",
	"Blue Watch Manager": "1023688801966628885",
	"Lead Firefighter": "1023688801945649171",
	"Advanced Firefighter": "1023688801945649170",
	"Firefighter": "1023688801945649169",
	"Trainee Firefighter": "1023688801945649168",
	"Retained Firefighter": "1023688801945649167",
	"Red": "1064239790842728540",
	"Blue": "1064239889928945736",
	"Trainer": "1023688801916309623",
	"LFB": "1023688801945649166",
}

let stations = [
	{
		name: "Rockford Drive (Main HQ)",
		postal: "505",
		map: "https://cdn.ninjalabs.dev/vGhIk.png"
	},
	{
		name: "Seaview Road",
		postal: "2018",
		map: "https://cdn.ninjalabs.dev/LvT5F.png"
	}
]

let units = [];
let _unitsLastUpdated = null;

authSheets();

setTimeout(() => {
    updateUnits()
}, 5000);

// Sync units every 30 seconds
// setInterval(async () => {
// 	syncUnits()
// }, 1000 * process.env.UNIT_UPDATE_RATE)

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
				isHR: row['HR'] === "TRUE",
				isTrainer: row['Trainer'] === "TRUE",
				callsign: row['Callsign'],
				badge: row['Badge'],
				rank: row['Rank'],
				tenure: row['Tenure'],
				nameBadge: row['Name and Badge'],
				watch: row['Watch'],
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

	logInfo(`Updated units at: ${new Date().toISOString()}`)

	units = _units;
	_unitsLastUpdated = new Date();
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
	await syncUnits();

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
 * @param unit array
 * @param training array
 * @param interaction {CommandInteraction|UserSelectMenuInteraction}
*/
async function assignTraining(unit, training, interaction) {
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
 * @param interaction {CommandInteraction|UserSelectMenuInteraction}
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

			logSuccess(`Successfully connected to HR Sheet`)
			return true;
		}).catch(() => {
			logError(`Unable to connect to HR Sheet`)
		});

		logSuccess(`Successfully connected to Roster Sheet`)
		return true;
	}).catch(() => {
		logError(`Unable to connect to Roster Sheet`)
	});
}

/**
 * @param action string
 * @param interaction {CommandInteraction}
 */
async function logAction(action, interaction) {
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
 * @param interaction { UserSelectMenuInteraction|CommandInteraction }
 */
function getUser(term, interaction) {
	if(term.includes('-')) {
		let callsign = term.toUpperCase();
		let unit = units.find(u => u.callsign === callsign);

		return unit ?? false;
	}

	if(term.length === 18) {
		let user = client.getDiscordUser(term, interaction.guild);

		if(user) {

			let _callsign = user.displayName?.match(/(?<=\[).+?(?=\])/g);
			if(_callsign && _callsign.length) {
				let unit = units.find(u => u.callsign === _callsign[0]);

				return unit ?? false;
			}
			return false;
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

function hasTraining(user, trainingName) {
	user.training.forEach(training => {
		if(training.name === trainingName || training.key === trainingName) {
			return true;
		}
	})

	return false;
}

exports.getUser = getUser;
exports.getUserDisplayName = getUserDisplayName;
exports.rankColors = rankColors;
exports.getUnits = getUnits;
exports.syncUnits = syncUnits;
exports.unitsLastUpdated = unitsLastUpdated;
exports.trainings = trainings;
exports.capitalizeFirstLetter = capitalizeFirstLetter;
exports.updateUnits = updateUnits;
exports.assignTraining = assignTraining;
exports.removeTraining = removeTraining;
exports.logAction = logAction;
exports.getRosterData = getRosterData;
exports.getRowByValue = getRowByValue;
exports.stations = stations;
exports.hasTraining = hasTraining;
exports.rankRoles = rankRoles;

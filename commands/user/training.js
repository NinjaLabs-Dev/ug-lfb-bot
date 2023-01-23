const { Client, CommandInteraction, EmbedBuilder, APIEmbedField } = require('discord.js');
const commandType = require("../../commandTypes.json");
const { getUnits, unitsLastUpdated, rankColors, columns, trainings, assignTraining, removeTraining, log, getUser } = require('../../helpers');

module.exports = {
	name: 'training',
	description: 'Show or update a users training status',
	type: commandType.CHAT_INPUT,
	options: [
		{
			name: 'action',
			type: commandType.args.STRING,
			description: "The action you'd like to make (view, add, remove)",
			choices: [
				{ name: 'View', value: 'view' },
				{ name: 'Add', value: 'add' },
				{ name: 'Remove', value: 'remove' },
			],
			required: true
		},
		{
			name: 'training',
			type: commandType.args.STRING,
			description: "What training you would like to effect",
			choices: trainings.map(t => {
				return { name: t.name, value: t.key }
			}),
			required: true
		},
		{
			name: "user",
			description: "User you'd like to search",
			type: commandType.args.USER,
		},
		{
			name: "callsign",
			description: "Callsign you'd like to search",
			type: commandType.args.STRING,
		},
		{
			name: "badge",
			description: "Badge you'd like to search",
			type: commandType.args.STRING,
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
		const tfExcludedTraining = ['RTC', 'Adv Driving', 'Co-Pilot', 'Pilot', 'Dispatch', 'FI', 'SC'];
		const rfExcludedTraining = tfExcludedTraining;
		const ffExcludedTraining = ['FI', 'SC', 'Pilot'];
		const afExcludedTraining = ['SC', 'Pilot'];

		if(!args[2]) {
			return interaction.reply({
				content: `Hm, did you put a callsign, user or badge?`,
				ephemeral: true
			})
		}

		let units = await getUnits();
		let unit = await getUser(args[2], interaction);

		if(!unit) {
			return interaction.reply({
				content: "Hm, we can't seem to find that user.",
				ephemeral: true
			});
		}

		let action = args[0];

		if(action === 'view') {
			if(!columns[args[1].toUpperCase()]) {
				return interaction.reply({
					content: "We couldn't find that training, did you spell it correctly?",
					ephemeral: true
				});
			}

			let training = {};
			unit.training.forEach(t => {
				if(t.name.toUpperCase().replace(' ', '') === args[1].toUpperCase().replace(' ', '')) {
					training = t;
				}
			})
			let fields = [
				{ name: 'Status', value: training.value === 'TRUE' ? 'Qualified' : 'Unqualified', inline: true },
			];

			if(training.value === 'TRUE') {
				fields.push({
					name: 'Trainer',
					value: training.trainer !== '' && training.trainer ? training.trainer : 'Unknown',
					inline: true
				});

				fields.push({
					name: 'Date',
					value: training.date !== '' && training.date ? training.date : 'Unknown'
				});
			}

			await log(`Searched ${unit.name}'s [${unit.callsign}] ${unit.name} status`, interaction);

			await interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setColor(rankColors[unit.rank])
						.setTitle(`Training Search: ${unit.name} - ${training.name}`)
						.addFields(fields)
						.setFooter({
							text: 'Last Updated'
						})
						.setTimestamp(unitsLastUpdated())
				]
			})
		} else if(action === 'add') {
			if(!interaction.member.roles.cache.has(process.env.TRAINER_ROLE_ID)) {
				return interaction.reply({
					content: "Are you sure you have permission to do that?",
					ephemeral: true
				});
			}

			if(!columns[args[1].toUpperCase()]) {
				return interaction.reply({
					content: "We couldn't find that training, did you spell it correctly?",
					ephemeral: true
				});
			}

			let training = {};
			unit.training.forEach(t => {
				if(t.name.toUpperCase().replace(' ', '') === args[1].toUpperCase().replace(' ', '')) {
					training = t;
				}
			})

			if(
				unit.rank === 'Deputy Fire Commissioner' ||
				unit.rank === 'Fire Commissioner' ||
				(unit.rank === 'Retained Firefighter' && rfExcludedTraining.includes(training.name)) ||
				(unit.rank === 'Trainee Firefighter' && tfExcludedTraining.includes(training.name)) ||
				(unit.rank === 'Firefighter' && ffExcludedTraining.includes(training.name)) ||
				(unit.rank === 'Advanced Firefighter' && afExcludedTraining.includes(training.name))) {
				return interaction.reply({
					content: "That is an invalid action",
					ephemeral: true
				});
			}

			if(training.value === 'TRUE') {
				return interaction.reply({
					content: "That user already has that training assigned!",
					ephemeral: true
				});
			} else {
				await interaction.reply({
					content: 'Successfully assigned training to user',
					ephemeral: true
				})

				await assignTraining(unit, trainings.find(t => t.key === args[1].toUpperCase()), interaction)
			}

			await log(`Added ${training.name} to [${unit.callsign}] ${unit.name}`, interaction);
		} else if(action === 'remove') {
			if(!interaction.member.roles.cache.has(process.env.TRAINER_ROLE_ID)) {
				return interaction.reply({
					content: "Are you sure you have permission to do that?",
					ephemeral: true
				});
			}

			if(!columns[args[1].toUpperCase()]) {
				return interaction.reply({
					content: "We couldn't find that training, did you spell it correctly?",
					ephemeral: true
				});
			}

			let training = {};
			unit.training.forEach(t => {
				if(t.name.toUpperCase().replace(' ', '') === args[1].toUpperCase().replace(' ', '')) {
					training = t;
				}
			})

			if(
				unit.rank === 'Deputy Fire Commissioner' ||
				unit.rank === 'Fire Commissioner' ||
				(unit.rank === 'Retained Firefighter' && rfExcludedTraining.includes(training.name)) ||
				(unit.rank === 'Trainee Firefighter' && tfExcludedTraining.includes(training.name)) ||
				(unit.rank === 'Firefighter' && ffExcludedTraining.includes(training.name)) ||
				(unit.rank === 'Advanced Firefighter' && afExcludedTraining.includes(training.name))) {
				return interaction.reply({
					content: "That is an invalid action",
					ephemeral: true
				});
			}


			if(training.value !== 'TRUE') {
				return interaction.reply({
					content: "That user hasn't got that training assigned!",
					ephemeral: true
				});
			} else {
				await removeTraining(unit, trainings.find(t => t.key === args[1].toUpperCase()), interaction)
			}

			await log(`Removed ${training.name} from [${unit.callsign}] ${unit.name}`, interaction);
			await interaction.reply({
				content: 'Successfully removed training from user',
				ephemeral: true
			})
		}
	}
}

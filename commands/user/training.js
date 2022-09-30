const { Client, CommandInteraction, EmbedBuilder, APIEmbedField } = require('discord.js');
const commandType = require("../../commandTypes.json");
const { getUnits, unitsLastUpdated, rankColors, columns, trainings, assignTraining, removeTraining, log } = require('../../helpers');

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
		}
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
		if(!args[2]) {
			return interaction.reply({
				content: `Hm, did you put a callsign or user?`,
				ephemeral: true
			})
		}

		let callsign;
		if(args[2].includes('-')) {
			callsign = args[2].toUpperCase();
		} else {
			let user = interaction.guild.members.cache.find(u => u.id === args[2]);

			if(!user || user.bot || user.system) {
				await interaction.reply({
					content: `Oops! There seems to be an issue with that user.`,
					ephemeral: true
				})
			} else {
				let _callsign = user.displayName.match(/(?<=\[).+?(?=\])/g);
				if(_callsign.length) {
					callsign = _callsign[0];
				}
			}
		}

		if(callsign) {
			let units = await getUnits();
			let unit = units.find(x => x.callsign === callsign);

			if(!unit) {
				return interaction.reply({
					content: "Hm we can't find a user with that callsign.",
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
					if(t.name.toUpperCase() === args[1].toUpperCase()) {
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
							.setTitle(`Training Search: ${unit.callsign} - ${training.name}`)
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
					if(t.name.toUpperCase() === args[1].toUpperCase()) {
						training = t;
					}
				})

				if(
					unit.rank === 'Deputy Fire Commissioner' ||
					unit.rank === 'Fire Commissioner' ||
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
					await assignTraining(unit.row, trainings.find(t => t.key === args[1].toUpperCase()), interaction)
				}

				await log(`Added ${training.name} to [${unit.callsign}] ${unit.name}`, interaction);
				await interaction.reply({
					content: 'Successfully assigned training to user',
					ephemeral: true
				})
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
					if(t.name.toUpperCase() === args[1].toUpperCase()) {
						training = t;
					}
				})

				const tfExcludedTraining = ['RTA', 'Adv Driving', 'Co-Pilot', 'Pilot', 'Dispatch', 'FI', 'SC'];
				const ffExcludedTraining = ['FI', 'SC'];
				const afExcludedTraining = ['SC'];

				if(
					unit.rank === 'Deputy Fire Commissioner' ||
					unit.rank === 'Fire Commissioner' ||
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
					await removeTraining(unit.row, trainings.find(t => t.key === args[1].toUpperCase()), interaction)
				}

				await log(`Removed ${training.name} from [${unit.callsign}] ${unit.name}`, interaction);
				await interaction.reply({
					content: 'Successfully removed training from user',
					ephemeral: true
				})
			}
		} else {
			await interaction.reply({
				content: "Hm we either can't find that user or they don't have a callsign!",
				ephemeral: true
			});
		}
	}
}

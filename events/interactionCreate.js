const client = require("../index");
const { getUserDisplayName, trainings} = require('../helpers');
const commandType = require("../commandTypes.json");
const { logInfo, logError, logSuccess } = require("../helpers/log");
const {StringSelectMenuBuilder, ActionRowBuilder, codeBlock, InteractionType} = require("discord.js");

client.on("interactionCreate", async (interaction) => {
	// Slash Command Handling
	if (interaction.isCommand()) {
		await interaction.deferReply({ ephemeral: false }).catch(() => {});


		if(interaction.guild.id !== process.env.GUILD_ID) {
			console.log(`[ERROR] Unknown server usage detected! ${interaction.guild.name} ${interaction.guild.id}`)
			return;
		}

		let cmd = client.commands.get(interaction.commandName);
		if (!cmd) {
			logError(`${getUserDisplayName(interaction)}: Attempted to run ${interaction.commandName} but the command wasn't found.`)

			return interaction.followUp({ content: "An error has occurred", ephemeral: true });
		}

		let args = [];
		let subCommand = false

		interaction.options.data.forEach(option => {
			if(option.type === commandType.args.SUBCOMMAND) {
				const name = interaction.commandName;
				const subCommandName = interaction.options.getSubcommand();

				subCommand = client.subCommands.get(`${name}/${subCommandName}`)
				subCommand.name = subCommandName;

				if(!subCommand) {
					logInfo(`${getUserDisplayName(interaction)}: Attempted to run '${name} ${subCommandName}' but the command wasn't found.`)

					return interaction.followUp({ content: "An error has occurred", ephemeral: true });
				}
			} else if(option.value) {
				args.push({
					name: option.name,
					value: option.value,
					type: option.type
				})
			}
		})

		if(interaction.guild) {
			interaction.member = interaction.guild.members.cache.get(interaction.user.id);
		}

		if(subCommand) {
			cmd = subCommand
		}

		const hasPermission = await cmd.hasPermission(client, interaction, args);

		if(hasPermission) {
			let name = subCommand ? `${interaction.commandName} ${cmd.name}` : `${interaction.commandName}`
			logInfo(`${getUserDisplayName(interaction)}: Ran /${name}`)

			try {
				await cmd.run(client, interaction, args);
			} catch (e) {
				client.sentry.captureException(e);
				console.error(e)

				logInfo(`${getUserDisplayName(interaction)}: Attempted to run ${interaction.commandName}, there was an issue running command.`)

				return interaction.editReply({
					content: 'There was an issue doing this. Contact Support. \n Error: \n ' + codeBlock("text", e),
					ephemeral: true
				})
			}
		} else {
			logInfo(`${getUserDisplayName(interaction)}: Attempted to run ${interaction.commandName}, they lack the permission.`)

			return interaction.editReply({ content: "You do not have permission to do that.", ephemeral: true });
		}
	}

	// Context Menu Handling
	if(interaction.isContextMenuCommand()) {
		await interaction.deferReply({ ephemeral: false });

		const command = client.commands.get(interaction.commandName);
		if (command) command.run(client, interaction);
	}

	if(interaction.isAnySelectMenu()) {
		const menuId = interaction.customId.split('/');
		const menuName = menuId[0].split('-')[0];
		const action = menuId[0].split('-')[1];

		let cmd
		if(menuId.length > 1) {
			cmd = client.subCommands.get(`${menuName}/${action}`)
		} else {
			cmd = client.commands.get(`${menuName}`)
		}

		if(interaction.guild) {
			interaction.member = interaction.guild.members.cache.get(interaction.user.id);
		}

		try {
			await cmd.menuCallback(client, interaction)
		} catch (e) {
			client.sentry.captureException(e);

			if(menuId.length > 1) {
				logInfo(`${getUserDisplayName(interaction)}: Attempted to run ${menuName}/${action}, there was an issue running command.`)
			} else {
				logInfo(`${getUserDisplayName(interaction)}: Attempted to run ${menuName}, there was an issue running command.`)
			}

			if(interaction.deferred) {
				return interaction.editReply({
					content: 'There was an issue doing this. Contact Support. \n Error: \n ' + codeBlock("text", e),
					ephemeral: true
				})
			} else {
				return interaction.editReply({
					content: 'There was an issue doing this. Contact Support. \n Error: \n ' + codeBlock("text", e),
					ephemeral: true
				})
			}
		}
	}

	if(interaction.type === InteractionType.ModalSubmit) {
		let args = interaction.customId.split('-');
		let fileName = args[0]
		let suggestionId = args[1];
		const modal = client.modals.get(fileName);

		if(!modal) {
			console.log(`[ERROR] ${getUserDisplayName(interaction)}: Attempted to run ${interaction.customId} but the modal wasn't found.`);

			return interaction.followUp({ content: "An error has occurred", ephemeral: true });
		}

		await modal.run(client, interaction, suggestionId);
	}
});


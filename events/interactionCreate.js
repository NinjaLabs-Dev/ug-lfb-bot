const client = require("../index");
const { getUserDisplayName } = require('../helpers');
const commandType = require("../commandTypes.json");

client.on("interactionCreate", async (interaction) => {
	// Slash Command Handling
	if (interaction.isCommand()) {
		// await interaction.deferReply({ ephemeral: false }).catch(() => {});


		if(interaction.guild.id !== process.env.GUILD_ID) {
			console.log(`[ERROR] Unknown server usage detected! ${interaction.guild.name} ${interaction.guild.id}`)
			return;
		}

		let cmd = client.commands.get(interaction.commandName);
		if (!cmd) {
			console.log(`[ERROR] ${getUserDisplayName(interaction)}: Attempted to run ${interaction.commandName} but the command wasn't found.`)

			return interaction.followUp({ content: "An error has occurred", ephemeral: true });
		}

		let args = [];
		let subCommand = false

		interaction.options.data.forEach(option => {
			if(option.type === commandType.args.SUBCOMMAND) {
				const name = interaction.commandName;
				const subCommandName = interaction.options.getSubcommand();

				subCommand = client.subCommands.get(`${name}/${subCommandName}`)

				if(!subCommand) {
					console.log(`[ERROR] ${getUserDisplayName(interaction)}: Attempted to run '${name} ${subCommandName}' but the command wasn't found.`)

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
			console.log(`[INFO] ${getUserDisplayName(interaction)}: Ran ${interaction.commandName}`)
			try {
				cmd.run(client, interaction, args);
			} catch (e) {
				console.log(`[INFO] ${getUserDisplayName(interaction)}: Attempted to run ${interaction.commandName}, there was an issue running command.`)
				return interaction.reply({
					content: 'There was an issue doing this. Contact Support.',
					ephemeral: true
				})
			}
		} else {
			console.log(`[INFO] ${getUserDisplayName(interaction)}: Attempted to run ${interaction.commandName}, they lack the permission.`)
			return interaction.reply({ content: "You do not have permission to do that.", ephemeral: true });
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
		const menuName = menuId[0];
		const action = menuId[1];


	}
});


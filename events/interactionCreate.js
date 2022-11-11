const client = require("../index");
const { getUserDisplayName } = require('../helpers');

client.on("interactionCreate", async (interaction) => {
	// Slash Command Handling
	if (interaction.isCommand()) {
		// await interaction.deferReply({ ephemeral: false }).catch(() => {});


		if(interaction.guild.id !== process.env.GUILD_ID) {
			console.log(`[ERROR] Unknown server usage detected! ${interaction.guild.name} ${interaction.guild.id}`)
			return;
		}

		const cmd = client.commands.get(interaction.commandName);
		if (!cmd) {
			console.log(`[ERROR] ${getUserDisplayName(interaction)}: Attempted to run ${interaction.commandName} but the command wasn't found.`)

			return interaction.followUp({ content: "An error has occurred", ephemeral: true });
		}

		const args = [];

		for (let option of interaction.options.data) {
			if (option.type === "SUB_COMMAND") {
				if (option.name) args.push(option.name);
				option.options?.forEach((x) => {
					if (x.value) args.push(x.value);
				});
			} else if (option.value) args.push(option.value);
		}

		if(interaction.guild) {
			interaction.member = interaction.guild.members.cache.get(interaction.user.id);
		}

		const hasPermission = await cmd.hasPermission(client, interaction, args);

		if(hasPermission) {
			console.log(`[INFO] ${getUserDisplayName(interaction)}: Ran ${interaction.commandName}`)
			try {
				cmd.run(client, interaction, args);
			} catch (e) {
				return interaction.reply({
					content: 'There was an issue doing this. Contact Support.',
					ephemeral: true
				})
			}
		} else {
			return interaction.followUp({ content: "You do not have permission to do that.", ephemeral: true });
		}
	}

	// Context Menu Handling
	if (interaction.isContextMenuCommand()) {
		await interaction.deferReply({ ephemeral: false });
		const command = client.commands.get(interaction.commandName);
		if (command) command.run(client, interaction);
	}
});


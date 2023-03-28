const { glob } = require('glob');
const { promisify } = require('util');
const { Client } = require('discord.js');
const { readdir } = require('fs/promises');
const commandType = require("./commandTypes.json");
const { subCommand } = require("./commands/user/training/add");
const { logInfo, logError, logSuccess } = require("./helpers/log");

const globPromise = promisify(glob);

/**
 * @param {Client} client
 */
module.exports = async (client) => {
	logInfo("Starting up bot, registering events")

	// Events
	const eventFiles = await globPromise(`./events/*.js`);
	eventFiles.map((value) => require(value));

	// Slash Commands
	const commandFiles = await globPromise(`./commands/**/*.js`);

	let commands = [];

	commandFiles.map((value) => {
		const file = require(value);
		if (!file?.name) return;

		client.commands.set(file.name, file);
		logInfo(`Found Command: ${file.name}`)

		if (file.type !== commandType.CHAT_INPUT) delete file.description;
		commands.push(file);

		file.options?.forEach(option => {
			if(option.type === commandType.args.SUBCOMMAND) {
				const subCommandFileDir = value.replace(`.js`, `/${option.name}.js`);

				try {
					const subCommandFile = require(subCommandFileDir)

					client.subCommands.set(`${file.name}/${option.name}`, subCommandFile)
					logInfo(`Found Sub Commands: ${file.name} ${option.name}`)
				} catch (e) {
					logError(`Unable to find sub commands file: ${subCommandFileDir}`)
				}
			}
		})
	});

	// Modals
	const modalFiles = await globPromise(`./components/modals/**/*.js`);

	let modals = [];
	modalFiles.map((value) => {
		const file = require(value);
		if (!file?.name) return;
		client.modals.set(file.name, file);
		logInfo(`Found modal: ${file.name}`)

		modals.push(file);
	});

	client.on('ready', async () => {
		// Register commands in all guilds
		logInfo(`Client Ready`)

		client.application.commands.set(commands).then(_ => {
			logSuccess(`Registered commands to Discord successfully`)
		});
	});

	client.on('error', async (error) => {
		console.error(error)
		console.log("[MAJOR] There was a script error, this should be looked into")
	})

	client.on('warn', async (error) => {
		console.log("[ERROR] There was a script warning, this should be looked into")
	})
}

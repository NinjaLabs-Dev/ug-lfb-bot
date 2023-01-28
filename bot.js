const { glob } = require('glob');
const { promisify } = require('util');
const { Client } = require('discord.js');
const { readdir } = require('fs/promises');
const commandType = require("./commandTypes.json");
const {subCommand} = require("./commands/user/training/add");

const globPromise = promisify(glob);

/**
 * @param {Client} client
 */
module.exports = async (client) => {
	console.log('[INFO] Starting up bot, registering events')

	// Events
	const eventFiles = await globPromise(`./events/*.js`);
	eventFiles.map((value) => require(value));

	// Slash Commands
	const commandFiles = await globPromise(`./commands/**/*.js`);

	let commands = [];
	let subCommands = [];

	commandFiles.map((value) => {
		const file = require(value);
		if (!file?.name) return;

		client.commands.set(file.name, file);
		console.log('[INFO] Found command: ' + file.name)

		if (file.type !== commandType.CHAT_INPUT) delete file.description;
		commands.push(file);

		file.options?.forEach(option => {
			if(option.type === commandType.args.SUBCOMMAND) {
				const subCommandFileDir = value.replace(`.js`, `/${option.name}.js`);

				try {
					const subCommandFile = require(subCommandFileDir)

					client.subCommands.set(`${file.name}/${option.name}`, subCommandFile)
					console.log("[INFO] Found sub command: " + file.name + " " + option.name)
				} catch (e) {
					console.log('[ERROR] Unable to find sub command file: '+ subCommandFileDir)
				}
			}
		})
	});

	client.on('ready', async () => {
		// Register commands in all guilds
		console.log('[INFO] Client ready');

		client.application.commands.set(commands).then(_ => {
			console.log('[INFO] Registered commands to Discord');
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

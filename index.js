const { Client, Collection, GatewayIntentBits, ActivityFlagsBitField } = require('discord.js');
const { logInfo, logError, logSuccess } = require("./helpers/log");
const axios = require('axios');
require('dotenv').config()

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers
	],
	presence: {
		status: 'online'
	}
});

module.exports = client;

client.commands = new Collection();
client.subCommands = new Collection();
client.config = process.env;
client.selectCache = new Collection();

client.getDiscordUser = (id, guild = false) => {
	if(client.user.id === id) {
		return false;
	}

	if(guild) {
		return guild.members.cache.find(u => u.id === id && !u.bot && !u.system);
	}

	return client.users.cache.find(u => u.id === id && !u.bot && !u.system);
}

require('./bot.js')(client);

client.login(client.config.TOKEN).then(r => {
	client.user.setPresence({
		activities: [{
			name: process.env.STATUS
		}]
	})

	logInfo("Client connected to Discord")

	setInterval(() => {
		axios.get('https://kuma.ninjalabs.dev/api/push/JFuK9sQ6wN?msg=OK&ping=')
	}, 60*1000)
});

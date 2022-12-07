const { Client, Collection, GatewayIntentBits, ActivityFlagsBitField } = require('discord.js');
const axios = require('axios');
require('dotenv').config()

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
	],
	presence: {
		status: 'online'
	}
});

module.exports = client;

client.commands = new Collection();
client.config = process.env;

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
	console.log("[INFO] Client connected to Discord")

	setInterval(() => {
		axios.get('https://kuma.ninjalabs.dev/api/push/JFuK9sQ6wN?msg=OK&ping=')
	}, 60*1000)
});

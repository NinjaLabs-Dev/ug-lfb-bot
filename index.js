const { Client, Collection, GatewayIntentBits, ActivityFlagsBitField } = require('discord.js');
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

client.getUser = (id) => {
	if(client.user.id === id) {
		return false;
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
});

const { Client, Collection, GatewayIntentBits, ActivityFlagsBitField, Partials } = require('discord.js');
const { logInfo, logError, logSuccess } = require("./helpers/log");
const axios = require('axios');
require('dotenv').config()
const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers
	],
	partials: [
		Partials.GuildMember
	],
	presence: {
		status: 'online'
	}
});

client.config = process.env;

Sentry.init({
	dsn: client.config.SENTRY_URL,
	tracesSampleRate: 1.0,
});

client.sentry = Sentry;

const transaction = Sentry.startTransaction({
	op: "initial",
	name: "Bot Startup",
});


module.exports = client;

client.commands = new Collection();
client.subCommands = new Collection();
client.modals = new Collection();
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

	transaction.finish();

	setInterval(() => {
		axios.get(client.config.KUMA_URL)
			.catch(() => {
				console.log("Unable to update Kuma")
			});
	}, 60*1000)
});

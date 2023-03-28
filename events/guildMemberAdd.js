const client = require("../index");
const { getUserDisplayName, trainings} = require('../helpers');
const commandType = require("../commandTypes.json");
const { logInfo, logError, logSuccess } = require("../helpers/log");
const {StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder} = require("discord.js");
const moment = require("moment");

client.on("guildMemberAdd", async (member) => {
	let channel = member.guild.channels.cache.get(process.env.USER_LOG_CHANNEL);

	if(!channel) {
		return logError("Log channel is set but can't be found!");
	}

	const fields = [
		{ name: "Name", value: `${member.user.username}#${member.user.discriminator}` },
		{ name: "Account Created", value: `${moment(member.user.createdAt).format('D/M/Y H:m')}` },
	]

	const embed = new EmbedBuilder()
		.setTitle("User Joined")
		.setFields(fields)
		.setThumbnail(member.displayAvatarURL())
		.setTimestamp()

	channel.send({
		embeds: [embed]
	});
});


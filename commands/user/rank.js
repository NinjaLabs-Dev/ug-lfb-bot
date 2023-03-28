const commandType = require("../../commandTypes.json");

module.exports = {
	name: 'rank',
	description: "Manage a unit's current rank",
	type: commandType.CHAT_INPUT,
	options: [
		{
			name: 'update',
			type: commandType.args.SUBCOMMAND,
			description: "Update a user's current rank (Discord Only)",
		},
	],
}

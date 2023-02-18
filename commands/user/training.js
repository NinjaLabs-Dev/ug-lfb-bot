const commandType = require("../../commandTypes.json");

module.exports = {
	name: 'training',
	description: 'Manage or view a users training',
	type: commandType.CHAT_INPUT,
	options: [
		{
			name: 'view',
			type: commandType.args.SUBCOMMAND,
			description: 'View specific training for a user.',
		},
		{
			name: 'add',
			type: commandType.args.SUBCOMMAND,
			description: 'Add training to a specific user.',
		},
		{
			name: 'remove',
			type: commandType.args.SUBCOMMAND,
			description: 'Remove training from a specific user.',
		},
	],
}

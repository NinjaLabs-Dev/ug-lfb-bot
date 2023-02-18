const colors = require('colors/safe');

function logInfo(message) {
	return console.log(colors.blue(`[ INFO ] : ${ message }`))
}

function logError(message) {
	return console.log(colors.red(`[ ERRO ] : ${ message }`))
}

function logSuccess(message) {
	return console.log(colors.green(`[ SUCC ] : ${ message }`))
}

module.exports = {
	logInfo,
	logError,
	logSuccess
}

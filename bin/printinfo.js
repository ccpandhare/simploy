const shell = require('shelljs');
const chalk = require('chalk');

module.exports = () => {
	const whichNode = shell.which('node').stdout;
	const cwd = shell.pwd().stdout;
	console.log('Using', chalk.green.bold(whichNode));
	return {cwd};
};

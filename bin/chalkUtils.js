const chalk = require('chalk');

const format = (normal, highlight) => text =>
	text
		.split('$')
		.reduce((p, c, i) => p + (i % 2 ? highlight(` ${c} `) : normal(c)), '');

const yellow = format(chalk.yellow, chalk.black.bgYellow);
const red = format(chalk.red, chalk.white.bgRed);
const green = format(chalk.greenBright, chalk.black.bgGreenBright);

const logFn = fn => text => console.log(fn(text));
const logYellow = logFn(yellow);
const logRed = logFn(red);
const logGreen = logFn(green);

module.exports = {
	yellow,
	red,
	green,
	logYellow,
	logRed,
	logGreen,
};

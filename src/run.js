const util = require('util');
const fs = require('fs');
const shell = require('shelljs');
const {join} = require('path');

const genExec = cmd =>
	util.promisify((cmd, cb) =>
		shell.exec(cmd, {timeout: 5 * 60 * 1000}, (code, stdout, stderr) => {
			const err = code === 0 ? null : code;
			const result = {code, stdout, stderr};
			if (err) cb(result);
			else cb(null, result);
		})
	)(cmd);

const readCommandsFromJSON = () => {
	if (fs.existsSync('ghwh-deploy.json')) {
		return [
			...JSON.parse(fs.readFileSync('ghwh-deploy.json', {encoding: 'utf-8'}))
				.commands,
			'getFinishingCommands',
		];
	} else {
		return ['getFinishingCommands'];
	}
};

const getFinishingCommands = () => ['git checkout master'];

const createOutputObjectsFromCommands = commands => {
	return commands.map(command => ({command}));
};

module.exports = (db, name, sha) => {
	return new Promise(async (resolve, reject) => {
		const path = db.get(name).value().path;
		const commands = [
			'which git',
			`changeDirectoryToRepo`,
			'git checkout master',
			'git pull origin master',
			`git checkout ${sha}`,
			'readCommandsFromJSON',
		];
		const outputs = createOutputObjectsFromCommands(commands);
		const saveOutputs = _ => db.set(`${name}.outputs`, outputs).write();
		saveOutputs();
		let op;
		try {
			for (op of outputs) {
				const {command} = op;
				if (command === 'readCommandsFromJSON') {
					// read commands from the JSON config file
					outputs.push(
						...createOutputObjectsFromCommands(readCommandsFromJSON())
					);
				} else if (command === 'getFinishingCommands') {
					outputs.push(
						...createOutputObjectsFromCommands(getFinishingCommands())
					);
				} else if (command === 'changeDirectoryToRepo') {
					// shell.exec(cd) doesn't persist the new directory
					shell.cd(path);
					op.code = 0;
				} else {
					// coerce to string and run
					const output = await genExec(`${command}`);
					Object.assign(op, output);
				}
				saveOutputs();
			}
			// reset to catch any non-command errors and avoid overriding a command's output
			op = null;
			resolve();
			shell.cd(join(__dirname, '../'));
		} catch (err) {
			shell.exec('git checkout master');
			op = op || {command: 'unknown'};
			Object.assign(op, err);
			saveOutputs();
			shell.cd(join(__dirname, '../'));
			reject(op);
		}
	});
};

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

module.exports = (path, sha) => {
	return new Promise(async (resolve, reject) => {
		const outputs = [{command: 'setup'}];
		try {
			if (!shell.which('git')) throw new Error('Git not available');
			shell.cd(path);
			const config = JSON.parse(
				fs.readFileSync(`ghwh-deploy.json`, {
					encoding: 'utf-8',
				})
			);
			const commands = [
				'git checkout master',
				'git pull origin master',
				`git checkout ${sha}`,
				...config.commands,
			];
			for (let command of commands) {
				if (typeof command !== 'string') continue;
				outputs.push({command});
				const output = await genExec(command);
				outputs[outputs.length - 1] = {command, ...output};
			}
			shell.exec('git checkout master');
			resolve(outputs);
			shell.cd(join(__dirname, '../'));
		} catch (err) {
			shell.exec('git checkout master');
			outputs.push(Object.assign(outputs.pop(), err));
			shell.cd(join(__dirname, '../'));
			reject(outputs);
		}
	});
};

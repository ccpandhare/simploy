import util from 'util';
import fs from 'fs';
import shell from 'shelljs';

const genExec = cmd =>
	util.promisify((cmd, cb) =>
		shell.exec(cmd, {timeout: 5 * 60 * 1000}, (code, stdout, stderr) => {
			const err = code === 0 ? null : code;
			const result = {code, stdout, stderr};
			if (err) cb(result);
			else cb(null, result);
		})
	)(cmd);

export default (path, sha) => {
	return new Promise(async (resolve, reject) => {
		const outputs = [];
		try {
			if (!shell.which('git')) {
				outputs.push({command: 'which git'});
				throw new Error('Git not available');
			}
			shell.pushd(path);
			const config = JSON.parse(
				fs.readFileSync(`ghwh-deploy.json`, {
					encoding: 'utf-8',
				})
			);
			const {commands} = config;
			commands.unshift(
				'git checkout master',
				'git pull origin master',
				`git checkout ${sha}`
			);
			for (let command of commands) {
				if (typeof command !== 'string') continue;
				outputs.push({command});
				const output = await genExec(command);
				outputs[outputs.length - 1] = {command, ...output};
			}
			resolve(outputs);
			shell.popd();
		} catch (err) {
			outputs.push(Object.assign(outputs.pop(), err));
			shell.popd();
			reject(outputs);
		}
	});
};

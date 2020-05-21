import path from 'path';
import {fileURLToPath} from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default (req, res, db) => {
	const name = req.query.name;
	let file = 'untracked.svg';
	if (typeof name === 'string' && db.get(name).value() != null) {
		const state = db.get(name).value().state;
		switch (state) {
			case 'deployed':
				file = 'deployed.svg';
				break;
			case 'undeployed':
				file = 'deploy_failed.svg';
				break;
			case 'success':
				file = 'deploying.svg';
				break;
			case 'pending':
				file = 'ci_running.svg';
				break;
			case 'failure':
			case 'error':
				file = 'ci_failed.svg';
				break;
		}
	}
	res
		.header('Cache-Control', 'private, no-cache, no-store, must-revalidate')
		.sendFile(path.join(__dirname, '../badges/', file));
};

const fs = require('fs');

const run = require('./run.js');
const filterPayload = require('./filterPayload.js');

const STATES = ['pending', 'success', 'failure', 'error'];

const sendErrorMessage = (message, res, name, db) => {
	if (name && db.has(name).value()) {
		db.set(`${name}.message`, message)
			.set(`${name}.state`, 'undeployed')
			.write();
	}
	res.status(400).send({message});
};

module.exports = (req, res, db) => {
	if (
		STATES.indexOf(req.body.state) !== -1 &&
		typeof req.body.name === 'string'
	) {
		// Is a state event
		const payload = req.body;
		if (db.has(payload.name).value()) {
			// Check if a local directory is linked
			let isDir = false;
			try {
				isDir = fs.lstatSync(db.get(payload.name).value().path).isDirectory();
			} catch (err) {
				// Local dir no longer exists
			}
			if (isDir) {
				// Valid local dir
				if (!db.get(`${payload.name}.events`).value()) {
					db.set(`${payload.name}.events`, []).write();
				}
				db.set(`${payload.name}.state`, payload.state)
					.set(`${payload.name}.message`, payload.description)
					.get(`${payload.name}.events`)
					.unshift(filterPayload(payload))
					.write();
				res.send({
					status: 'OK',
					state: payload.state,
					description: payload.description,
				});
				if (payload.state === 'success')
					run(db.get(payload.name).value().path, payload.sha)
						.then(outputs => {
							db.set(`${payload.name}.state`, 'deployed')
								.set(`${payload.name}.message`, 'Deployed Successfully')
								.set(`${payload.name}.outputs`, outputs)
								.write();
						})
						.catch(outputs => {
							db.set(`${payload.name}.state`, 'not-deployed')
								.set(
									`${payload.name}.message`,
									`Failed to deploy. ${
										outputs[outputs.length - 1].command
									} returned a non-zero exit code.`
								)
								.set(`${payload.name}.outputs`, outputs)
								.write();
						});
			} else {
				// Local path not a dir
				const message = 'Invalid local directory linked to ghwh-deploy';
				sendErrorMessage(message, res, payload.name, db);
			}
		} else {
			// Directory not linked
			const message = `No local path found for ${payload.name}. Please the link path to your repository`;
			sendErrorMessage(message, res, payload.name, db);
		}
	} else {
		message = 'Not a valid state event. Ignored';
		sendErrorMessage(message, res);
	}
};

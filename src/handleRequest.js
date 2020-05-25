const fs = require('fs');

const run = require('./run.js');
const {filterStatusPayload} = require('./filterPayload.js');

const sendErrorMessage = (message, res, name, db) => {
	if (name && db.has(name).value()) {
		db.set(`${name}.message`, message)
			.set(`${name}.state`, 'not-deployed')
			.write();
	}
	res.status(400).send({message});
};

const deploy = (payload, db) => {
	const {name, sha} = payload;
	run(db.get(name).value().path, sha)
		.then(outputs => {
			db.set(`${name}.state`, 'deployed')
				.set(`${name}.message`, 'Deployed Successfully')
				.set(`${name}.outputs`, outputs)
				.write();
		})
		.catch(outputs => {
			db.set(`${name}.state`, 'not-deployed')
				.set(
					`${name}.message`,
					`Failed to deploy. ${
						outputs[outputs.length - 1].command
					} returned a non-zero exit code.`
				)
				.set(`${name}.outputs`, outputs)
				.write();
		});
};

module.exports = async (req, res, db) => {
	const event = req.headers['x-github-event'];
	if (event === 'status') {
		try {
			const payload = await filterStatusPayload(req.body);
			const {name, state, description} = payload;
			if (db.has(name).value()) {
				let isDirValid = false;
				try {
					isDirValid = fs.lstatSync(db.get(name).value().path).isDirectory();
				} catch (err) {}
				if (isDirValid) {
					if (!db.get(`${name}.events`).value()) {
						db.set(`${name}.events`, []).write();
					}
					db.set(`${name}.state`, state)
						.set(`${name}.message`, description)
						.get(`${name}.events`)
						.unshift(payload)
						.write();
					res.send({
						status: 'OK',
						state,
						description,
					});
					if (state === 'success') deploy(payload, db);
				} else {
					const message = 'Invalid local directory linked to ghwh-deploy';
					sendErrorMessage(message, res, name, db);
				}
			} else {
				const message = `No local path found for ${name}. Please the link path to your repository`;
				sendErrorMessage(message, res, name, db);
			}
		} catch (err) {
			message = `Error! Not a valid status event. ${JSON.stringify(err)}`;
			sendErrorMessage(message, res);
		}
	} else {
		message = 'Not a valid event. Ignored';
		sendErrorMessage(message, res);
	}
};

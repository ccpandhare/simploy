const fs = require('fs');

const run = require('./run.js');
const {filterStatusPayload, filterPushPayload} = require('./filterPayload.js');

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
	run(db, name, sha)
		.then(_ => {
			db.set(`${name}.state`, 'deployed')
				.set(`${name}.message`, 'Deployed Successfully')
				.write();
		})
		.catch(failedCommand => {
			db.set(`${name}.state`, 'not-deployed')
				.set(
					`${name}.message`,
					`Failed to deploy. ${failedCommand.command} returned non-zero exit code ${failedCommand.code}.`
				)
				.write();
		});
};

const makeSureDirIsValid = (name, db) => {
	const error = new Error(
		`Invalid local path linked to ${name}. Please re-link.`
	);
	try {
		const isValid = fs.lstatSync(db.get(`${name}.path`).value()).isDirectory();
		if (isValid) return true;
		else throw error;
	} catch (err) {
		throw error;
	}
};

const prependEvent = (payload, name, db) => {
	if (!db.get(`${name}.events`).value()) {
		db.set(`${name}.events`, []).write();
	}
	db.set(`${name}.state`, payload.state)
		.set(`${name}.message`, payload.description)
		.get(`${name}.events`)
		.unshift(payload)
		.write();
};

module.exports = async (req, res, db) => {
	const event = req.headers['x-github-event'];
	if (event === 'status') {
		try {
			const payload = await filterStatusPayload(req.body);
			const {name, state, description} = payload;
			makeSureDirIsValid(name, db);
			prependEvent(payload, name, db);
			res.send({
				status: 'OK',
				state,
				description,
			});
			if (state === 'success') deploy(payload, db);
		} catch (err) {
			sendErrorMessage(err.message, res);
		}
	} else if (event === 'push') {
		try {
			// handle push event
			const payload = await filterPushPayload(req.body);
			const {name} = payload;
			makeSureDirIsValid(name, db);
			prependEvent(payload, name, db);
			res.send({
				status: 'OK',
			});
			deploy(payload, db);
		} catch (err) {
			sendErrorMessage(err.message, res);
		}
	} else {
		message = 'Not a valid event. Ignored';
		sendErrorMessage(message, res);
	}
};

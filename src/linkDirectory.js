const fs = require('fs');

module.exports = (req, res, db) => {
	if (req.headers.host === 'localhost:5000') {
		const {path, repo} = req.body;
		if (typeof path !== 'string' || !fs.lstatSync(path).isDirectory()) {
			res.send({OK: false, error: 'Invalid path'});
			return;
		}
		if (typeof repo !== 'string' || !repo.match(/^[^/]+\/[^/]+$/)) {
			res.send({OK: false, error: 'Invalid repo'});
			return;
		}
		if (!db.get(repo).value()) {
			db.set(repo, {path}).write();
		} else {
			db.set(`${repo}.path`, path).write();
		}
		res.send({OK: true, newPath: db.get(`${repo}.path`).value()});
	} else {
		res.status(404).send('Not Found');
	}
};

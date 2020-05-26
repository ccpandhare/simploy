module.exports = (req, res, db) => {
	const name = req.query.name;
	if (db.has(name).value()) res.send(db.get(name).value());
	else
		res.status(404).send({
			error: 'No such repo',
		});
};

const express = require('express');
const bodyParser = require('body-parser');
const lowdb = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const handleRequest = require('./handleRequest');
const renderBadge = require('./renderBadge');

const adapter = new FileSync('db.json');
const db = lowdb(adapter);
const port = 5000;
const app = express();
app.use(bodyParser.json());

const useDb = fn => (req, res) => fn(req, res, db);

app.post('/ghwh-deploy', useDb(handleRequest));

app.get('/ghwh-badge', useDb(renderBadge));

app.listen(port, () => {
	console.log(`ghwh-deploy listening at port ${port}.`);
});

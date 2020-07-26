const path = require('path');
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const lowdb = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const handleRequest = require('./handleRequest');
const renderBadge = require('./renderBadge');
const getData = require('./getData');
const linkDirectory = require('./linkDirectory');

const adapter = new FileSync(path.join(__dirname, '../db.json'));
const db = lowdb(adapter);
const port = 5000;
const app = express();

app.use(bodyParser.json());
app.use(morgan('dev'));

const useDb = fn => (req, res) => fn(req, res, db);

app.post('/simploy', useDb(handleRequest));

app.get('/simploy-badge', useDb(renderBadge));

app.get('/simploy-data', useDb(getData));

app.post('/simploy-link', useDb(linkDirectory));

app.use(express.static('public'));

app.listen(port, () => {
	console.log(`simploy listening at port ${port}.`);
});

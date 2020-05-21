import lowdb from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync.js';
import express from 'express';
import bodyParser from 'body-parser';
import handleRequest from './handleRequest.js';
import renderBadge from './renderBadge.js';

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

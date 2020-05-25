#! node
const fs = require('fs');
const readline = require('readline');
const axios = require('axios').default;

const printInfo = require('./printinfo');
const {logRed, logGreen, red, yellow} = require('./chalkUtils');

const rl = readline.createInterface(process.stdin, process.stdout);

const {cwd} = printInfo();

const getRepo = () =>
	new Promise((resolve, reject) => {
		const validateRepo = repo => {
			let match;
			if (typeof repo === 'string' && repo.trim().match(/^[^/]+\/[^/]+$/)) {
				resolve(repo.trim());
			} else if ((match = repo.trim().match(/([^/]+)\/([^/]+)\.git$/))) {
				resolve(`${match[1]}/${match[2]}`);
			} else {
				reject(new Error(`Invalid repo "${repo}" received`));
			}
		};
		const getRepoFromStdin = () => {
			rl.question(
				red(
					'Couldn\'t find repo from package.json. Enter the repository you want to link. \nFor example, for https://github.com/torvalds/linux, enter "torvalds/linux" without the quotes:\n'
				),
				validateRepo
			);
		};
		const hasPackageJSON = fs.existsSync('package.json');
		if (hasPackageJSON) {
			logGreen('package.json found');
			const package = fs.readFileSync('package.json');
			const repo = JSON.parse(package).repository;
			const hasValidRepo = typeof repo === 'object';
			if (hasValidRepo) validateRepo(repo.url);
			else getRepoFromStdin();
		} else getRepoFromStdin();
	});

getRepo()
	.then(repo => {
		rl.question(
			yellow(`Are you sure you want to link $${repo}$ to $${cwd}$ (Y/n)? `),
			answer => {
				if (answer.toLowerCase() === 'y') {
					logGreen('$Linking...$');
					axios
						.post('http://localhost:5000/ghwh-link', {
							path: cwd,
							repo,
						})
						.then(res => {
							const {OK} = res.data;
							if (OK) logGreen('$SUCCESS$');
							else logRed(`Error Occured: $${res.data.error}`);
							process.exit(!OK);
						});
				} else {
					logRed('$Not linking, bye$');
					process.exit(1);
				}
			}
		);
	})
	.catch(err => {
		logRed(`Error occured: $${err.message}$`);
		process.exit(1);
	});

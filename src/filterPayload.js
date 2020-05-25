const filterStatusPayload = payload => {
	return new Promise((resolve, reject) => {
		try {
			resolve({
				sha: payload.sha,
				name: payload.repository.full_name,
				target_url: payload.target_url,
				state: payload.state,
				description: payload.description,
				sender: {
					login: payload.sender.login,
					avatar_url: payload.sender.avatar_url,
					html_url: payload.sender.html_url,
					type: payload.sender.type,
				},
				branches: payload.branches.map(({name}) => name),
				repository: {
					full_name: payload.repository.full_name,
					html_url: payload.repository.html_url,
				},
			});
		} catch (error) {
			reject(error);
		}
	});
};

module.exports = {filterStatusPayload};

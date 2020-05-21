export default payload => ({
	sha: payload.sha,
	target_url: payload.target_url,
	avatar_url: payload.avatar_url,
	context: payload.context,
	state: payload.state,
	description: payload.description,
	commit: {
		message: payload.commit.commit.message,
		url: payload.commit.url,
	},
	sender: {
		login: payload.sender.login,
		avatar_url: payload.sender.avatar_url,
		html_url: payload.sender.html_url,
		type: payload.sender.type,
	},
	branches: payload.branches.map(({name}) => name),
	created_at: payload.created_at,
	updated_at: payload.updated_at,
	repository: {
		full_name: payload.repository.full_name,
		html_url: payload.repository.html_url,
	},
});

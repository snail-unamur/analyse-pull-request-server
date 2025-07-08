import checkGitHubRepoAccess from '../utils/githubControlAccess.js';
import retrieveAccessToken from '../utils/token.js';

const hasAccessToRepo = async (req, res, next) => {
	try {
		const token = retrieveAccessToken(req.headers);
		const { repoOwner, repoName } = req.params; // or from elsewhere

		const hasAccess = await checkGitHubRepoAccess(repoOwner, repoName, token);

		if (!hasAccess) {
			return res.status(403).send('You do not have access to this repository');
		}

		next();
	} catch (error) {
		return res.status(401).json({ message: error.message });
	}
};

export default hasAccessToRepo;

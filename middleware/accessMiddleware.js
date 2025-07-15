import hasAccessToGitHubRepository from '../utils/githubControlAccess.js';
import extractAccessToken from '../utils/tokenExtractor.js';

const hasAccessToRepo = async (req, res, next) => {
	try {
		const token = extractAccessToken(req.headers);
		const { repoOwner, repoName } = req.params;
		
		const githubHead = {
			repoOwner: repoOwner,
			repoName: repoName,
			accessToken: token
		};

		const hasAccess = await hasAccessToGitHubRepository(githubHead);

		if (!hasAccess) {
			return res.status(403).send('You do not have access to this repository');
		}
		
		req.githubHead = githubHead;

		next();
	} catch (error) {
		return res.status(401).json({ message: error.message });
	}
};

export default hasAccessToRepo;

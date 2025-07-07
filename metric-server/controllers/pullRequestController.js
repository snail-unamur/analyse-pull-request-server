import asyncHandler from 'express-async-handler';
import Repository from '../models/Repository.js';

/*
 * @desc    Fetch certain pull request with a prNumber (number, not objectID)
 * @route   GET /api/:repoName/pullRequest/:prNumber
 * @access  Private
 */
const getPullRequest = asyncHandler(async (req, res) => {
	const repoName = req.params.repoName;
	const prNumber = parseInt(req.params.prNumber);

	const result = await Repository.find({repo_name: repoName}, "analyzed_branches").lean();
	const pullRequest = result[0].analyzed_branches[0].pullRequests.find(pullRequest => pullRequest.number === prNumber);

	if (pullRequest) {
		res.json(pullRequest);
	} else {
		res.status(404);
		throw new Error('Pull Request not found');
	}
});

export { getPullRequest };

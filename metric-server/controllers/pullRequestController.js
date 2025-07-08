import asyncHandler from 'express-async-handler';
import Repository from '../models/Repository.js';

/*
 * @desc    Fetch all pull requests for a repository
 * @route   GET /api/:repoOwner/:repoName/pullRequest
 * @query   prNumbers (comma-separated list of PR numbers)
 */
const getPullRequests = asyncHandler(async (req, res) => {
	const { repoOwner, repoName } = req.params;
	const prNumbers = req.query.prNumbers ? req.query.prNumbers.split(',').map(Number) : [];

	const result = await Repository.find({repo_name: repoName, repo_owner: repoOwner}, "analyzed_branches").lean();
	const pullRequests = result[0].analyzed_branches[0].pullRequests.filter(pullRequest => prNumbers.includes(pullRequest.number));

	if (pullRequests) {
		res.json(pullRequests);
	} else {
		res.status(404);
		throw new Error('Pull Requests not found');
	}
});

/*
 * @desc    Fetch certain pull request with a prNumber (number, not objectID)
 * @route   GET /api/:repoOwner/:repoName/pullRequest/:prNumber
 */
const getPullRequest = asyncHandler(async (req, res) => {
	const { repoOwner, repoName, prNumber } = req.params;
	const castPrNumber = parseInt(prNumber);

	const result = await Repository.find({repo_name: repoName, repo_owner: repoOwner}, "analyzed_branches").lean();
	const pullRequest = result[0].analyzed_branches[0].pullRequests.find(pullRequest => pullRequest.number === castPrNumber);

	if (pullRequest) {
		res.json(pullRequest);
	} else {
		res.status(404);
		throw new Error('Pull Request not found');
	}
});

export { getPullRequest, getPullRequests };

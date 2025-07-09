import asyncHandler from 'express-async-handler';
import Repository from '../models/Repository.js';
import calculateMetrics from '../util/metricsCalculator.js';

/*
 * @desc    Fetch metrics for all pull requests in a repository
 * @route   GET /api/:repoOwner/:repoName/pullRequest
 * @query   prNumbers (comma-separated list of PR numbers)
 */
const getMetricsForPullRequests = asyncHandler(async (req, res) => {
	const { repoOwner, repoName } = req.params;
	const prNumbers = req.query.prNumbers ? req.query.prNumbers.split(',').map(Number) : [];

	const repo = await Repository.findOne({ repo_name: repoName, repo_owner: repoOwner }, "analyzed_branches settings").lean();
	const pullRequests = repo.analyzed_branches[0].pullRequests.filter(pullRequest => prNumbers.includes(pullRequest.number));

	if (pullRequests) {
		const result = pullRequests.map(pullRequest => calculateMetrics(pullRequest.number, repo.settings, pullRequest.analysis));

		res.json(result);
	} else {
		res.status(404);
		throw new Error('Pull Requests not found');
	}
});

/*
 * @desc    Fetch metrics for a certain pull request with a prNumber (number, not objectID)
 * @route   GET /api/:repoOwner/:repoName/pullRequest/:prNumber
 */
const getMetricsForPullRequest = asyncHandler(async (req, res) => {
	const { repoOwner, repoName, prNumber } = req.params;
	const castPrNumber = parseInt(prNumber);

	const repo = await Repository.findOne({ repo_name: repoName, repo_owner: repoOwner }, "analyzed_branches settings").lean();
	const pullRequest = repo.analyzed_branches[0].pullRequests.find(pullRequest => pullRequest.number === castPrNumber);

	if (pullRequest) {
		const result = calculateMetrics(pullRequest.number, repo.settings, pullRequest.analysis);

		res.json(result);
	} else {
		res.status(404);
		throw new Error('Pull Request not found');
	}
});

export { getMetricsForPullRequest as getPullRequest, getMetricsForPullRequests as getPullRequests };

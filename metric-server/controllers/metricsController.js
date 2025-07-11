import asyncHandler from 'express-async-handler';
import Repository from '../models/Repository.js';
import calculateMetrics from '../utils/analysis.js';

/*
 * @desc    Fetch metrics for all pull requests in a repository
 * @route   GET /api/:repoOwner/:repoName/pullRequest
 * @query   prNumbers (comma-separated list of PR numbers)
 * @access  Public
 */
const getMetricsForPullRequests = asyncHandler(async (req, res) => {
	const { repoOwner, repoName } = req.params;
	const prNumbers = req.query.prNumbers ? req.query.prNumbers.split(',').map(Number) : [];

	const repo = await Repository.findOne({ repo_name: repoName, repo_owner: repoOwner }, "analyzed_branches settings").lean();
	const pullRequests = repo.analyzed_branches[0].pullRequests.filter(pullRequest => prNumbers.includes(pullRequest.number));

	if (pullRequests) {
		let result = [];

		try {
			result = await Promise.all(
				pullRequests.map(pullRequest => calculateMetrics(repo.settings, pullRequest))
			);
		} catch (error) {
			res.status(500);
			throw new Error(`Error calculating metrics: ${error.message}`);
		}


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
		let result;
		
		try {
			result = await calculateMetrics(repo.settings, pullRequest);
		} catch (error) {
			res.status(500);
			throw new Error(`Error calculating metrics: ${error.message}`);
		}

		res.json(result);
	} else {
		res.status(404);
		throw new Error('Pull Request not found');
	}
});

export { getMetricsForPullRequest, getMetricsForPullRequests };


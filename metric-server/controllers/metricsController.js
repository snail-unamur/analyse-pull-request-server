import asyncHandler from 'express-async-handler';
import calculate from '../models/metricCalculator.js';
import { getOrInitRepo } from '../models/Repository.js';

/*
 * @desc    Fetch metrics for all pull requests in a repository
 * @route   GET /api/:repoOwner/:repoName/pullRequest
 * @query   prNumbers (comma-separated list of PR numbers)
 * @access  Public
 */
const getMetricsForPullRequests = asyncHandler(async (req, res) => {
	const prNumbers = req.query.prNumbers ? req.query.prNumbers.split(',').map(Number) : [];
	const githubHead = req.githubHead;

	const repo = await getOrInitRepo(githubHead.repoOwner, githubHead.repoName);

	if (repo) {
		let result = [];

		try {
			result = await Promise.all(
				prNumbers.map(number => calculate(githubHead, repo.settings, number))
			);
		} catch (error) {
			res.status(500);
			throw new Error(`Error calculating metrics: ${error.message}`);
		}

		res.json(result);
	} else {
		res.status(404);
		throw new Error('Error while retrieving PR infos.');
	}
});

/*
 * @desc    Fetch metrics for a certain pull request with a prNumber (number, not objectID)
 * @route   GET /api/:repoOwner/:repoName/pullRequest/:prNumber
 */
const getMetricsForPullRequest = asyncHandler(async (req, res) => {
	const prNumber = parseInt(req.params.prNumber);
	const githubHead = req.githubHead;

	const repo = await getOrInitRepo(githubHead.repoOwner, githubHead.repoName);

	if (repo) {
		let result;

		try {
			result = await calculate(githubHead, repo.settings, prNumber);
		} catch (error) {
			res.status(500);
			throw new Error(`Error calculating metrics: ${error.message}`);
		}

		res.json(result);
	} else {
		res.status(404);
		throw new Error('Error while retrieving PR infos.');
	}
});

export { getMetricsForPullRequest, getMetricsForPullRequests };

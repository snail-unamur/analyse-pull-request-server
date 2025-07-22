import asyncHandler from 'express-async-handler';
import calculate from '../models/metricCalculator.js';
import { log } from '../utils/logger.js';
import retrieveConfigurationForRepo from '../api/settingRequest.js';

/*
 * @desc    Fetch metrics for all pull requests in a repository
 * @route   GET /api/:repoOwner/:repoName/pullRequest
 * @query   prNumbers (comma-separated list of PR numbers)
 * @access  Public
 */
const getMetricsForPullRequests = asyncHandler(async (req, res) => {
	const prNumbers = req.query.prNumbers ? req.query.prNumbers.split(',').map(Number) : [];
	const githubHead = req.githubHead;

	log('Request received');

	try {
		const configuration = await retrieveConfigurationForRepo(githubHead);
		const result = await Promise.all(
			prNumbers.map(number => calculate(githubHead, configuration, number))
		);

		res.json(result);
		log('Response sent');
	} catch (error) {
		res.status(500);
		throw new Error(`Error calculating metrics: ${error.message}`);
	}
});

/*
 * @desc    Fetch metrics for a certain pull request with a prNumber (number, not objectID)
 * @route   GET /api/:repoOwner/:repoName/pullRequest/:prNumber
 */
const getMetricsForPullRequest = asyncHandler(async (req, res) => {
	const prNumber = parseInt(req.params.prNumber);
	const githubHead = req.githubHead;

	log('Request received', prNumber);

	try {
		const configuration = await retrieveConfigurationForRepo(githubHead);
		const result = await calculate(githubHead, configuration, prNumber);

		res.json(result);
		log('Response sent', prNumber);
	} catch (error) {
		res.status(500);
		throw new Error(`Error calculating metrics: ${error.message}`);
	}
});

export { getMetricsForPullRequest, getMetricsForPullRequests };

import express from 'express';
import {
	getMetricsForPullRequests,
	getMetricsForPullRequest
} from '../controllers/metricsController.js';
import hasAccessToRepo from '../middleware/accessMiddleware.js';

const router = express.Router({ mergeParams: true });

router.route('/').get(hasAccessToRepo, getMetricsForPullRequests);
router.route('/:prNumber').get(hasAccessToRepo, getMetricsForPullRequest);

export default router;

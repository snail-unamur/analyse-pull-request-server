import express from 'express';
import {
	getPullRequest
} from '../controllers/pullRequestController.js';
import hasAccessToRepo from '../middleware/accessMiddleware.js';

const router = express.Router({ mergeParams: true });

router.route('/:prNumber').get(hasAccessToRepo, getPullRequest);

export default router;

import express from 'express';
import {
	getPullRequest
} from '../controllers/pullRequestController.js';

const router = express.Router({ mergeParams: true });

router.route('/:prNumber').get(getPullRequest);

export default router;

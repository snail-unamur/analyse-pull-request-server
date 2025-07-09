import express from 'express';
import {
	getSettingsForRepo,
    updateSettingsForRepo
} from '../controllers/settingsController.js';
import hasAccessToRepo from '../middleware/accessMiddleware.js';

const router = express.Router({ mergeParams: true });

router.route('/').get(hasAccessToRepo, getSettingsForRepo);
router.route('/').put(hasAccessToRepo, updateSettingsForRepo);

export default router;
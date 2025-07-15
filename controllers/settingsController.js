import asyncHandler from 'express-async-handler';
import { getOrInitRepo, updateRepoSettings } from '../models/Repository.js';

/**
 * @desc    Fetch settings for a specific repository
 * @route   GET /api/:repoOwner/:repoName/settings
 * @access  Public
 */
const getSettingsForRepo = asyncHandler(async (req, res) => {
    const githubHead = req.githubHead;

	const repo = await getOrInitRepo(githubHead.repoOwner, githubHead.repoName);

    if (repo) {
        res.json(repo.settings);
    } else {
        res.status(404);
        throw new Error('Repository not found');
    }
});

/**
 * @desc    Update settings for a specific repository
 * @route   PUT /api/:repoOwner/:repoName/settings
 * @access  Public
 */
const updateSettingsForRepo = asyncHandler(async (req, res) => {
    const githubHead = req.githubHead;
    const settings = req.body;

    const updatedRepo = await updateRepoSettings(githubHead.repoOwner, githubHead.repoName, settings);

    if (updatedRepo) {
        res.json(updatedRepo.settings);
    } else {
        res.status(404);
        throw new Error('Repository not found');
    }
});

export { getSettingsForRepo, updateSettingsForRepo };
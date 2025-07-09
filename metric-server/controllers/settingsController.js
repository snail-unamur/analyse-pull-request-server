import asyncHandler from 'express-async-handler';
import Repository from '../models/Repository.js';

/**
 * @desc    Fetch settings for a specific repository
 * @route   GET /api/:repoOwner/:repoName/settings
 * @access  Public
 */
const getSettingsForRepo = asyncHandler(async (req, res) => {
    const { repoOwner, repoName } = req.params;

    const repo = await Repository.findOne({ repo_name: repoName, repo_owner: repoOwner }, "settings").lean();

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
    const { repoOwner, repoName } = req.params;
    const settings = req.body;

    const updatedRepo = await Repository.findOneAndUpdate(
        { repo_name: repoName, repo_owner: repoOwner },
        { settings: settings },
        { new: true, fields: "settings" }
    ).lean();

    if (updatedRepo) {
        res.json(updatedRepo.settings);
    } else {
        res.status(404);
        throw new Error('Repository not found');
    }
});

export { getSettingsForRepo, updateSettingsForRepo };
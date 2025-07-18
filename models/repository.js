import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const settingsSchema = new Schema({
	analysis_metrics: {
		type: [
			{
				id: String,
				checked: Boolean,
				source: String,
			},
		],
		default: [
			{ id: 'complexity', checked: true, source: 'SonarQube' },
			{ id: 'cognitive_complexity', checked: true, source: 'SonarQube' },
			{ id: 'ncloc', checked: true, source: 'SonarQube' },
			{ id: 'instability', checked: true, source: 'CodeQL' },
			{ id: 'new_coverage', checked: true, source: 'SonarQube' }
		],
	},
	radar_thresholds: {
		complexity: {
			a: {
				lower_bound: { type: Number, default: 0 },
				upper_bound: { type: Number, default: 3 },
			},
			b: {
				lower_bound: { type: Number, default: 3 },
				upper_bound: { type: Number, default: 6 },
			},
			c: {
				lower_bound: { type: Number, default: 6 },
				upper_bound: { type: Number, default: 9 },
			},
			d: {
				lower_bound: { type: Number, default: 9 },
				upper_bound: { type: Number, default: 12 },
			},
			e: {
				lower_bound: { type: Number, default: 12 },
				upper_bound: { type: Number, default: 15 }, // Upper limit is +15
			},
		},
		cognitive_complexity: {
			a: {
				lower_bound: { type: Number, default: 0 },
				upper_bound: { type: Number, default: 3 },
			},
			b: {
				lower_bound: { type: Number, default: 3 },
				upper_bound: { type: Number, default: 6 },
			},
			c: {
				lower_bound: { type: Number, default: 6 },
				upper_bound: { type: Number, default: 9 },
			},
			d: {
				lower_bound: { type: Number, default: 9 },
				upper_bound: { type: Number, default: 12 },
			},
			e: {
				lower_bound: { type: Number, default: 12 },
				upper_bound: { type: Number, default: 15 }, // Upper limit is +15
			},
		},
		ncloc: {
			a: {
				lower_bound: { type: Number, default: 0 },
				upper_bound: { type: Number, default: 5 },
			},
			b: {
				lower_bound: { type: Number, default: 5 },
				upper_bound: { type: Number, default: 10 },
			},
			c: {
				lower_bound: { type: Number, default: 10 },
				upper_bound: { type: Number, default: 20 },
			},
			d: {
				lower_bound: { type: Number, default: 20 },
				upper_bound: { type: Number, default: 30 },
			},
			e: {
				lower_bound: { type: Number, default: 30 },
				upper_bound: { type: Number, default: 40 }, // Upper limit is +40
			},
		},
		instability: {
			a: {
				lower_bound: { type: Number, default: 0 },
				upper_bound: { type: Number, default: 0.2 },
			},
			b: {
				lower_bound: { type: Number, default: 0.2 },
				upper_bound: { type: Number, default: 0.4 },
			},
			c: {
				lower_bound: { type: Number, default: 0.4 },
				upper_bound: { type: Number, default: 0.6 },
			},
			d: {
				lower_bound: { type: Number, default: 0.6 },
				upper_bound: { type: Number, default: 0.8 },
			},
			e: {
				lower_bound: { type: Number, default: 0.8 },
				upper_bound: { type: Number, default: 1 }, // Upper limit is 100%
			},
		},
		new_coverage: {
			a: {
				lower_bound: { type: Number, default: 1 },
				upper_bound: { type: Number, default: 0.8 },
			},
			b: {
				lower_bound: { type: Number, default: 0.8 },
				upper_bound: { type: Number, default: 0.6 },
			},
			c: {
				lower_bound: { type: Number, default: 0.6 },
				upper_bound: { type: Number, default: 0.4 },
			},
			d: {
				lower_bound: { type: Number, default: 0.4 },
				upper_bound: { type: Number, default: 0.2 },
			},
			e: {
				lower_bound: { type: Number, default: 0.2 },
				upper_bound: { type: Number, default: 0 }, // Upper limit is 0%
			},
		},
	}
});

const repoSchema = new Schema({
	repo_owner: String,
	repo_name: String,
	settings: settingsSchema,
});

const repository = model("repository", repoSchema);

export const getOrInitRepo = async (repoOwner, repoName) => {
	let repo = await repository.findOne(
		{ repo_name: repoName, repo_owner: repoOwner },
		"settings"
	).lean();

	if (!repo) {
		repo = new repository({
			repo_name: repoName,
			repo_owner: repoOwner,
			settings: {}
		});

		await repo.save();
	}

	return repo;
};

export const updateRepoSettings = async (repoOwner, repoName, settings) => {
	const updatedRepo = await repository.findOneAndUpdate(
		{ repo_name: githubHead.repoName, repo_owner: githubHead.repoOwner },
		{ settings: settings },
		{ new: true, fields: "settings" }
	).lean();

	return updatedRepo;
}
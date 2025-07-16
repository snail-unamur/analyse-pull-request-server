import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const settingsSchema = new Schema({
	analysis_metrics: {
		type: [
			{
				id: String,
				name: String,
				checked: Boolean,
				source: String,
				coefficient: Number,
			},
		],
		default: [
			{ id: 'complexity', name: 'Cyclomatic Complexity', checked: true, coefficient: 1.5, source: 'SonarQube' },
			{ id: 'cognitive_complexity', name: 'Cognitive Complexity', checked: true, coefficient: 1.5, source: 'SonarQube' },
			{ id: 'duplicated_lines_density', name: 'Duplicated Lines Density', checked: false, coefficient: 1.5, source: 'SonarQube' },
			{ id: 'ncloc', name: 'Lines of Code', checked: false, coefficient: 1.5, source: 'SonarQube' },
			{ id: 'code_smells', name: 'Code Smells', checked: false, coefficient: 1.5, source: 'SonarQube' },
			{ id: 'bugs', name: 'Bugs', checked: false, coefficient: 1.5, source: 'SonarQube' },
			{ id: 'vulnerabilities', name: 'Vulnerabilities', checked: false, coefficient: 1.5, source: 'SonarQube' },
			{ id: 'instability', name: 'Instability', checked: true, coefficient: 1.5, source: 'CodeQL' },
			{ id: 'new_coverage', name: 'Coverage for New Lines', checked: true, coefficiant: 1.5, source: 'SonarQube' }
		],
	},
	risk_threshold_value: {
		a: {
			lower_bound: { type: Number, default: 0 },
			upper_bound: { type: Number, default: 20 },
		},
		b: {
			lower_bound: { type: Number, default: 20 },
			upper_bound: { type: Number, default: 40 },
		},
		c: {
			lower_bound: { type: Number, default: 40 },
			upper_bound: { type: Number, default: 60 },
		},
		d: {
			lower_bound: { type: Number, default: 60 },
			upper_bound: { type: Number, default: 80 },
		},
		e: {
			lower_bound: { type: Number, default: 80 },
			upper_bound: { type: Number, default: 100 },
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
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const analysisSchema = new Schema({
	likert_scale: {
		user_id: Number,
		point: Number,
	},
	quality_gate: {
		status: Boolean,
		fail_reasons: [String],
	},
	risk_score: { score: Number, category: Number },
	current_code_churns: [
		{
			path: String,
			current_code_churn: Number,
		},
	],
	current_bug_frequencies: [
		{
			path: String,
			current_bug_frequency: Number,
			current_buggy_pr_count: Number,
			current_pr_count: Number,
		},
	],
	current_co_changes: [
		{
			path: String,
			current_co_change: [
				{
					path: String,
					co_change_rate: Number,
				},
			],
		},
	],
	highly_buggy_file_result: {
		category: Number,
		count: Number,
	},
	highly_churn_file_result: {
		category: Number,
		count: Number,
	},
	pr_size_result: {
		category: Number,
	},
	author_merge_rate_result: {
		category: Number,
	},
	current_page_rank_result: {
		category: Number,
		score: { type: Number, default: 0.5 },
	},
});

const pullRequestSchema = new Schema({
	id: Number,
	number: Number,
	title: String,
	description: String,
	sha: String,
	url: String,
	state: String,
	labels: [String],
	buggyIssueCount: Number,
	createdAt: Date,
	branch_name: {
		origin: String,
		destination: String,
	},
	lines: {
		additions: Number,
		deletions: Number,
		changes: Number,
	},
	merger: {
		name: String,
		id: String,
	},
	reviewers: [
		{
			name: String,
			id: String,
		},
	],
	assignees: [
		{
			name: String,
			id: String,
		},
	],
	files: [
		{
			origin_sha: String,
			destination_sha: String,
			name: String,
			path: String,
			total_line_of_code: Number,
			status: String,
			additions: Number,
			deletions: Number,
			changes: Number,
		},
	],
	author: {
		name: String,
		id: String,
		login: String,
		cur_avg_risk_score: Number,
		cur_pull_request_count: Number,
		cur_merged_pull_request_count: Number,
	},
	analysis: analysisSchema,
});

const Repository = model('Repository', pullRequestSchema);

export default Repository;

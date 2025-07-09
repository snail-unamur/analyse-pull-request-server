const mongoose = require("mongoose");
const { Schema, SchemaTypes, model } = mongoose;

const settingsSchema = new Schema({
	analysis_metrics: {
		type: [
			{
				metric: String,
				checked: Boolean,
        coefficient: Number,
			},
		],
		default: [
			{ metric: 'Code Churn', checked: true, coefficient: 1.5 },
			{ metric: 'Previous Bug Frequency', checked: true, coefficient: 1.5 },
			{ metric: 'Co-changed Files', checked: true, coefficient: 1.5 },
		],
	},
  metric_management: {
    highly_churn_file: {
      file_threshold: { type: Number, default: 5 },
    },
    highly_buggy_file: {
      file_threshold: { type: Number, default: 0.4 },
    },
    highly_co_change_file: {
      file_threshold: { type: Number, default: 50 },
    },
  },
  risk_value: {
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

const fileSchema = new Schema({
  name: String,
  path: String,
  sha: String,
  total_line_of_code: Number,
  total_code_churn: Number,
  total_buggy_pr_count: Number,
  total_pr_count: Number,
  total_bug_frequency: Number,
  total_co_changes: [
    {
      path: String,
      co_change_rate: Number,
    },
  ],
});

const analysisSchema = new Schema({
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
    value: Number,
    count: Number,
  },
  highly_churn_file_result: {
    value: Number,
    count: Number,
  },
  pr_size_result: {
    value: Number,
  },
});

const pullRequestSchema = new Schema({
  id: Number,
  number: Number,
  title: String,
  description: String,
  isAddedInIncrementalAnalysis: { type: Boolean, default: false },
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
  analysis: analysisSchema,
});

const analyzedBranchSchema = new Schema({
  branch_name: String,
  files: [fileSchema],
  pullRequests: [pullRequestSchema],
});

const repoSchema = new Schema({
  repo_id: Number,
  repo_name: String,
  repo_owner: String,
  repo_url: String,
  repo_token: String,
  is_initial_analyze_finished: { type: Boolean, default: false },
  settings: settingsSchema,
  overview: [{}],
  analyzed_branches: [analyzedBranchSchema],
});

const Repository = model("Repository", repoSchema);

module.exports = Repository;

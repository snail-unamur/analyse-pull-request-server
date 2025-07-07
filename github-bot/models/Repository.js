const mongoose = require("mongoose");
const { Schema, SchemaTypes, model } = mongoose;

const collaboratorSchema = new Schema({
  name: String,
  id: Number,
  login: String,
  role: String,
  is_active: {
    type: Boolean,
    default: true,
  },
  total_risk_score: Number,
  total_pull_request_count: Number,
  total_merged_pull_request_count: Number,
});

const settingsSchema = new Schema({
	analysis_metrics: {
		type: [
			{
				metric: String,
				checked: Boolean,
			},
		],
		default: [
			{ metric: 'Risk Score', checked: true },
			{ metric: 'Impacted Files', checked: true },
			{ metric: 'Code Churn', checked: true },
			{ metric: 'Previous Bug Frequency', checked: true },
			{ metric: 'Co-changed Files', checked: true },
			{ metric: 'Developer Statistics', checked: true },
		],
	},
  metric_management: {
    highly_churn_file: {
      file_threshold: { type: Number, default: 5 },
      a: {
        lower_bound: { type: Number, default: 0 },
        upper_bound: { type: Number, default: 0 },
      },
      b: {
        lower_bound: { type: Number, default: 0 },
        upper_bound: { type: Number, default: 16 },
      },
      c: {
        lower_bound: { type: Number, default: 16 },
        upper_bound: { type: Number, default: 33 },
      },
      d: {
        lower_bound: { type: Number, default: 33 },
        upper_bound: { type: Number, default: 50 },
      },
      e: {
        lower_bound: { type: Number, default: 50 },
        upper_bound: { type: Number, default: 100 },
      },
    },
    highly_buggy_file: {
      file_threshold: { type: Number, default: 0.4 },
      a: {
        lower_bound: { type: Number, default: 0 },
        upper_bound: { type: Number, default: 0 },
      },
      b: {
        lower_bound: { type: Number, default: 0 },
        upper_bound: { type: Number, default: 12 },
      },
      c: {
        lower_bound: { type: Number, default: 12 },
        upper_bound: { type: Number, default: 20 },
      },
      d: {
        lower_bound: { type: Number, default: 20 },
        upper_bound: { type: Number, default: 30 },
      },
      e: {
        lower_bound: { type: Number, default: 30 },
        upper_bound: { type: Number, default: 100 },
      },
    },
    highly_co_change_file: {
      file_threshold: { type: Number, default: 50 },
    },
    pr_size: {
      a: {
        lower_bound: { type: Number, default: 0 },
        upper_bound: { type: Number, default: 10 },
      },
      b: {
        lower_bound: { type: Number, default: 10 },
        upper_bound: { type: Number, default: 50 },
      },
      c: {
        lower_bound: { type: Number, default: 50 },
        upper_bound: { type: Number, default: 200 },
      },
      d: {
        lower_bound: { type: Number, default: 200 },
        upper_bound: { type: Number, default: 1000 },
      },
      e: {
        lower_bound: { type: Number, default: 1000 },
        upper_bound: { type: Number, default: 1000000 },
      },
    },
    author_merge_rate: {
      a: {
        lower_bound: { type: Number, default: 93 },
        upper_bound: { type: Number, default: 100 },
      },
      b: {
        lower_bound: { type: Number, default: 87 },
        upper_bound: { type: Number, default: 93 },
      },
      c: {
        lower_bound: { type: Number, default: 81 },
        upper_bound: { type: Number, default: 87 },
      },
      d: {
        lower_bound: { type: Number, default: 75 },
        upper_bound: { type: Number, default: 81 },
      },
      e: {
        lower_bound: { type: Number, default: 0 },
        upper_bound: { type: Number, default: 75 },
      },
    },
    page_rank_score: {
      a: {
        lower_bound: { type: Number, default: 0 },
        upper_bound: { type: Number, default: 10 },
      },
      b: {
        lower_bound: { type: Number, default: 10 },
        upper_bound: { type: Number, default: 30 },
      },
      c: {
        lower_bound: { type: Number, default: 30 },
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
    },
    risk_score: {
      formula: {
        highly_churn_file_coefficient: { type: Number, default: 1.25 },
        highly_buggy_file_coefficient: { type: Number, default: 2 },
        pr_size_coefficient: { type: Number, default: 1.75 },
        author_merge_rate_coefficient: { type: Number, default: 1 },
        page_rank_score_coefficient: { type: Number, default: 4 },
      },
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
    },
  },
  quality_gate: {
    type: [
      {
        metric_name: String,
        threshold: Number,
      },
    ],
		default: [
			{ metric_name: 'risk_score', threshold: 40 },
			{ metric_name: 'highly_churn_file', threshold: 25 },
			{ metric_name: 'highly_buggy_file', threshold: 20 },
			{ metric_name: 'pr_size', threshold: 200 },
		],
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
    score: Number
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
    cur_total_risk_score: Number,
    cur_pull_request_count: Number,
    cur_merged_pull_request_count: Number,
  },
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
  source_code_location_path: String,
  is_initial_analyze_finished: { type: Boolean, default: false },
  project_tags: [String],
  collaborators: [collaboratorSchema],
  settings: settingsSchema,
  overview: [{}],
  analyzed_branches: [analyzedBranchSchema],
});

const Repository = model("Repository", repoSchema);

module.exports = Repository;

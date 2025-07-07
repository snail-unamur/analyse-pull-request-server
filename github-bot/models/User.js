const mongoose = require('mongoose');
const { Schema, SchemaTypes, model } = mongoose;

const userSchema = new Schema({
	user_login: String,
	user_email: String,
	user_name: String,
	user_github_id: String,
	user_gh_access_token: String,
	user_repo_ids: [String],
});

const User = model("User", userSchema);
module.exports = User;

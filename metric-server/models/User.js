import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema, model } = mongoose;

const userSchema = new Schema({
	user_login: String,
	user_email: String,
	user_name: String,
	user_github_id: String,
	user_gh_access_token: String,
	user_repo_ids: [String],
});

// userSchema.pre('save', async function (next) {
// 	if (!this.isModified('user_gh_access_token')) {
// 		return next();
// 	}

// 	const salt = await bcrypt.genSalt(10);
// 	this.user_gh_access_token = await bcrypt.hash(
// 		this.user_gh_access_token,
// 		salt
// 	);
// });

const User = model('User', userSchema);

export default User;

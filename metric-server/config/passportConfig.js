import passport from 'passport';
import passportGithub2 from 'passport-github2';
import User from '../models/User.js';

import dotenv from 'dotenv';
dotenv.config();

const GITHUB_CALLBACK_URL = 'http://localhost:6002/api/auth/github/callback';

/* passport.use(
	new passportGithub2.Strategy(
		{
			clientID: process.env.GITHUB_CLIENT_ID,
			clientSecret: process.env.GITHUB_CLIENT_SECRET,
			callbackURL: GITHUB_CALLBACK_URL,
		},
		async (accessToken, refreshToken, profile, cb) => {
			let user = await User.findOne({
				user_github_id: profile.id,
			}).exec();
			if (user === null) {
				user = await User.create({
					user_github_id: profile.id,
					user_name: profile.displayName,
					user_gh_access_token: accessToken,
				});
			} else {
				user.user_gh_access_token = accessToken;
				user.save();
			}

			return cb(null, user);
		}
	)
); */

passport.serializeUser((user, cb) => {
	cb(null, user.user_github_id);
});

passport.deserializeUser(async (id, cb) => {
	const user = await User.findOne({ user_github_id: id }).catch((err) => {
		cb(err, null);
	});
	
	if (user) {
		cb(null, user);
	}
});

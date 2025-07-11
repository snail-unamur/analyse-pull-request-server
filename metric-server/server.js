import express from 'express';
import dotenv from 'dotenv';
import metricsRoutes from './routes/metricsRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import connectToDB from './config/databaseConfig.js';
import cookieSession from 'cookie-session';
import cors from 'cors';
import bodyParser from 'body-parser';

dotenv.config();
connectToDB();

const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));

app.get('/', (req, res) => {
	res.send('API is running....');
});

app.use(
	cookieSession({
		maxAge: 24 * 60 * 60 * 1000, // 1d
		keys: [process.env.COOKIE_KEY],
	})
);

app.use('/api/:repoOwner/:repoName/settings', settingsRoutes);
app.use('/api/:repoOwner/:repoName/pullRequest', metricsRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 6002;
app.listen(PORT, console.log(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`));

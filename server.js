/* Third-party modules */
import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import wallRoutes from './routes/wall.routes.js';

/* Load environment variables */
dotenv.config();

/* Initialize express */
const app = express();
const port = process.env.PORT ?? 3000;

/* Configure middleware */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

/* Configure session */
app.use(session({
    secret: process.env.SESSION_SECRET ?? 'your_session_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

/* Set view engine */
app.set('view engine', 'ejs');
app.set('views', './views');

/* Routes */
app.use('/', authRoutes);
app.use('/', wallRoutes);

/* Start server */
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

export default app; 
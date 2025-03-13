require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./config/db');
const { initServer } = require('./config/server');
const authRoutes = require('./routes/auth');
const streamRoutes = require('./routes/stream');
const rootRoutes = require('./routes/root');
const protectedRoutes = require('./routes/protectedRoute');

const PORT = process.env.PORT || 5001;
const app = express();

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

initDB();

app.use('/auth', authRoutes);
app.use('/stream', streamRoutes);
app.use('/', rootRoutes);
app.use('/protected', protectedRoutes);

const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

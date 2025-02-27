const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const db = require('./db');
const streamingRoutes = require('./streaming');

dotenv.config();

const PORT = process.env.PORT || 5001;
const app = express();

const corsMiddleware = cors({ origin: 'http://localhost:3000' });
app.use(corsMiddleware);
app.use(express.json());

app.get('/test', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM users'); // Remplace `users` par ta table réelle
        res.json(result.rows);
    } catch (err) {
        console.error("Database query error:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get('/', (req, res) => {
    res.send('Welcome to the Hypertube API!');
});

streamingRoutes(app);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

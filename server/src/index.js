const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const db = require('./db');
const path = require('path');
const httpAttach = require('http-attach')
const HLSServer = require('hls-server')

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

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

app.get('/testvideo', (req, res) => {
    res.sendFile(path.join(__dirname, '../videos/testvideo/testvideo.mp4'));
});

const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

const hls = new HLSServer(server, {
    path: '/streams',
    dir: 'videos/testvideo'
})

httpAttach(server, corsMiddleware)

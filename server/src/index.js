const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const db = require('./db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
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

// Routes
app.get('/', (req, res) => {
    res.send('Welcome to the Hypertube API!');
});

app.get('/testvideo.mp4', (req, res) => {
    res.sendFile(__dirname + '/testvideo.mp4');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

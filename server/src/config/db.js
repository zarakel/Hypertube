const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
});

const initDB = async () => {
    try {
        await pool.connect();
        console.log('✅ Connected to the database');
    } catch (error) {
        console.error('❌ Database connection error:', error);
        throw error;
    }
};

module.exports = { pool, initDB };
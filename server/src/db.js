const { Pool } = require('pg');

const pool = new Pool({
  user: 'hypertube_user',
  password: 'password',
  host: 'db',
  port: 5432, // default Postgres port
  database: 'hypertube'
});

module.exports = {
  query: (text, params) => pool.query(text, params)
};
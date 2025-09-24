const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: 'mysql', // or 'mysql' if running in Docker network
  port: 3306,
  user: 'grafana',
  password: 'grafana',
  database: 'grafana',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test connection function
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
}

module.exports = {
  pool,
  testConnection
};
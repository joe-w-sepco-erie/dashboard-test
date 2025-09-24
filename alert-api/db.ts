const mysql = require('mysql2/promise');

// Database configuration interface
interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  waitForConnections: boolean;
  connectionLimit: number;
  queueLimit: number;
}

// Database configuration
const dbConfig: DatabaseConfig = {
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
async function testConnection(): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
    return true;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Database connection failed:', errorMessage);
    return false;
  }
}

export { pool, testConnection };
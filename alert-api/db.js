"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.testConnection = testConnection;
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
exports.pool = pool;
// Test connection function
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Database connected successfully');
        connection.release();
        return true;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Database connection failed:', errorMessage);
        return false;
    }
}
//# sourceMappingURL=db.js.map
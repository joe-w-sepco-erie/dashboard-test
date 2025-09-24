import { pool } from './db';

// Create alerts table
const createAlertsTable = async (): Promise<void> => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS alerts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      alert_name VARCHAR(255) NOT NULL,
      alert_state VARCHAR(50) NOT NULL,
      alert_message TEXT,
      rule_id VARCHAR(255),
      rule_name VARCHAR(255),
      rule_url TEXT,
      dashboard_id VARCHAR(255),
      panel_id VARCHAR(255),
      tags TEXT,
      alert_values TEXT,
      generator_url TEXT,
      fingerprint VARCHAR(255),
      silence_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      fired_at TIMESTAMP NULL,
      resolved_at TIMESTAMP NULL,
      INDEX idx_alert_state (alert_state),
      INDEX idx_created_at (created_at),
      INDEX idx_alert_name (alert_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await pool.execute(createTableQuery);
    console.log('Alerts table created successfully or already exists');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating alerts table:', errorMessage);
    throw error;
  }
};

// Initialize database
const initDatabase = async (): Promise<void> => {
  try {
    await createAlertsTable();
    console.log('Database initialized successfully');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Database initialization failed:', errorMessage);
    process.exit(1);
  }
};

export { initDatabase, createAlertsTable };
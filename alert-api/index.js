const express = require('express');
const cors = require('cors');
const { pool, testConnection } = require('./db');
const { initDatabase } = require('./init-db');

const app = express();
const port = 3003;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Alert API Server', 
    status: 'running',
    endpoints: {
      alerts: 'POST /alerts - Receive Grafana alerts',
      health: 'GET /health - Health check'
    }
  });
});

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.json({
    status: 'ok',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Grafana alerts webhook endpoint
app.post('/alerts', async (req, res) => {
  try {
    console.log('Received alert webhook:', JSON.stringify(req.body, null, 2));
    
    const alerts = req.body.alerts || [];
    
    if (!Array.isArray(alerts) || alerts.length === 0) {
      return res.status(400).json({ 
        error: 'No alerts found in request body',
        expected: 'Array of alerts in body.alerts'
      });
    }

    const insertedAlerts = [];

    for (const alert of alerts) {
      try {
        // Parse alert data
        const alertData = {
          alert_name: alert.labels?.alertname || 'Unknown Alert',
          alert_state: alert.status || 'unknown',
          alert_message: alert.annotations?.summary || alert.annotations?.description || '',
          rule_id: alert.labels?.rule_id || null,
          rule_name: alert.labels?.rule_name || null,
          rule_url: alert.generatorURL || null,
          dashboard_id: alert.labels?.dashboard_id || null,
          panel_id: alert.labels?.panel_id || null,
          tags: JSON.stringify(alert.labels || {}),
          values: JSON.stringify(alert.values || {}),
          generator_url: alert.generatorURL || null,
          fingerprint: alert.fingerprint || null,
          silence_url: alert.silenceURL || null,
          fired_at: alert.startsAt ? new Date(alert.startsAt) : null,
          resolved_at: alert.endsAt && alert.status === 'resolved' ? new Date(alert.endsAt) : null
        };

        // Insert into database
        const insertQuery = `
          INSERT INTO alerts (
            alert_name, alert_state, alert_message, rule_id, rule_name, rule_url,
            dashboard_id, panel_id, tags, alert_values, generator_url, fingerprint,
            silence_url, fired_at, resolved_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await pool.execute(insertQuery, [
          alertData.alert_name,
          alertData.alert_state,
          alertData.alert_message,
          alertData.rule_id,
          alertData.rule_name,
          alertData.rule_url,
          alertData.dashboard_id,
          alertData.panel_id,
          alertData.tags,
          alertData.values,
          alertData.generator_url,
          alertData.fingerprint,
          alertData.silence_url,
          alertData.fired_at,
          alertData.resolved_at
        ]);

        insertedAlerts.push({
          id: result.insertId,
          alert_name: alertData.alert_name,
          alert_state: alertData.alert_state
        });

        console.log(`Alert inserted successfully: ${alertData.alert_name} (${alertData.alert_state})`);
      } catch (alertError) {
        console.error('Error processing individual alert:', alertError.message);
        console.error('Alert data:', alert);
      }
    }

    res.json({
      message: 'Alerts processed successfully',
      processed: alerts.length,
      inserted: insertedAlerts.length,
      alerts: insertedAlerts
    });

  } catch (error) {
    console.error('Error processing alerts:', error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get recent alerts endpoint (for testing/viewing)
app.get('/alerts', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const [rows] = await pool.execute(
      'SELECT * FROM alerts ORDER BY created_at DESC LIMIT ?',
      [limit]
    );
    
    res.json({
      alerts: rows,
      count: rows.length
    });
  } catch (error) {
    console.error('Error fetching alerts:', error.message);
    res.status(500).json({
      error: 'Failed to fetch alerts',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }

    // Initialize database tables
    await initDatabase();

    // Start server
    app.listen(port, () => {
      console.log(`Alert API server listening on port ${port}`);
      console.log(`Health check: http://localhost:${port}/health`);
      console.log(`Webhook endpoint: http://localhost:${port}/alerts`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
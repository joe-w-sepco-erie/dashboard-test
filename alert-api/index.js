"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors = require('cors');
const db_1 = require("./db");
const init_db_1 = require("./init-db");
const app = (0, express_1.default)();
const port = 3003;
// Middleware
app.use(cors());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
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
    const dbConnected = await (0, db_1.testConnection)();
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
                const [result] = await db_1.pool.execute(insertQuery, [
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
            }
            catch (alertError) {
                const errorMessage = alertError instanceof Error ? alertError.message : 'Unknown error';
                console.error('Error processing individual alert:', errorMessage);
                console.error('Alert data:', alert);
            }
        }
        res.json({
            message: 'Alerts processed successfully',
            processed: alerts.length,
            inserted: insertedAlerts.length,
            alerts: insertedAlerts
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error processing alerts:', errorMessage);
        res.status(500).json({
            error: 'Internal server error',
            message: errorMessage
        });
    }
});
// Get recent alerts endpoint (for testing/viewing)
app.get('/alerts', async (req, res) => {
    try {
        const limitParam = req.query.limit;
        const limit = parseInt(limitParam) || 50;
        const [rows] = await db_1.pool.execute('SELECT * FROM alerts ORDER BY created_at DESC LIMIT ?', [limit]);
        res.json({
            alerts: rows,
            count: rows.length
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error fetching alerts:', errorMessage);
        res.status(500).json({
            error: 'Failed to fetch alerts',
            message: errorMessage
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
        const dbConnected = await (0, db_1.testConnection)();
        if (!dbConnected) {
            throw new Error('Database connection failed');
        }
        // Initialize database tables
        await (0, init_db_1.initDatabase)();
        // Start server
        app.listen(port, () => {
            console.log(`Alert API server listening on port ${port}`);
            console.log(`Health check: http://localhost:${port}/health`);
            console.log(`Webhook endpoint: http://localhost:${port}/alerts`);
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to start server:', errorMessage);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=index.js.map
const https = require('https');
const http = require('http');
const express = require('express');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

const signalingManager = require('./managers/SignalingManager');
const roomManager = require('./managers/RoomManager');
const logger = require('./utils/logger');

require('dotenv').config();

const app = express();

// Serve static files
app.use(express.static('public'));

// Health check endpoint (Heroku requirement)
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        stats: roomManager.getStats()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Create server (HTTP for Heroku, HTTPS for local)
let server;

if (process.env.NODE_ENV === 'production') {
    // Production: Heroku provides SSL termination
    server = http.createServer(app);
    logger.info('Running in PRODUCTION mode (HTTP server)');
} else {
    // Development: Use self-signed certificates
    try {
        const sslConfig = {
            key: fs.readFileSync(path.join(__dirname, '../certs/key.pem')),
            cert: fs.readFileSync(path.join(__dirname, '../certs/cert.pem'))
        };
        server = https.createServer(sslConfig, app);
        logger.info('Running in DEVELOPMENT mode (HTTPS server)');
    } catch (error) {
        logger.warn('SSL certificates not found, using HTTP');
        server = http.createServer(app);
    }
}

// Create WebSocket server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    logger.info('New client connected');
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            signalingManager.handleMessage(ws, data);
        } catch (error) {
            logger.error(`Parse error: ${error.message}`);
        }
    });
    
    ws.on('close', () => {
        signalingManager.handleDisconnect(ws);
        logger.info('Client disconnected');
    });
    
    ws.on('error', (error) => {
        logger.error(`WebSocket error: ${error.message}`);
    });
});

// Dynamic port for Heroku
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
    logger.success(`🚀 Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`WebSocket ready for connections`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, closing server...');
    wss.clients.forEach(client => {
        client.close();
    });
    server.close(() => {
        logger.success('Server closed');
        process.exit(0);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
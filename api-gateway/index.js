const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const QUESTION_SERVICE_URL = process.env.QUESTION_SERVICE_URL || 'http://localhost:8080';

app.use(cors());

// Debugging: Log all incoming requests
app.use((req, res, next) => {
    console.log(`[API-GATEWAY] ${req.method} ${req.url}`);
    next();
});

// Proxy for User Service
app.use('/api/user-service', createProxyMiddleware({
    target: USER_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api/user-service': '',
    },
}));

// Proxy for Question Service
app.use('/api/question-service', createProxyMiddleware({
    target: QUESTION_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api/question-service': '',
    },
}));

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the API Gateway' });
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', service: 'api-gateway' });
});

app.listen(PORT, () => {
    console.log(`API Gateway is running on port ${PORT}`);
});

module.exports = app;

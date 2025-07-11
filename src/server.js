const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/config');
const receiptRoutes = require('./routes/receipts');

const app = express();

// Middleware
app.use(cors());
// Increase body size limits to handle base64 encoded images
// Base64 encoding increases size by ~33%, so 10MB image becomes ~13MB
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/receipts', receiptRoutes);

// Health check endpoint at root level
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Receipt OCR Backend API',
    version: '1.0.0',
    endpoints: {
      'GET /api/receipts/types': 'Get available receipt types and templates',
      'POST /api/receipts/process': 'Process receipt image',
      'GET /api/receipts/health': 'Health check'
    }
  });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Error:', error.message);
  res.status(500).json({
    success: false,
    error: error.message || 'Internal server error'
  });
});

// Start server only when this file is executed directly
const PORT = config.port;
const HOST = process.env.HOST || '0.0.0.0';

if (require.main === module) {
  app.listen(PORT, HOST, () => {
    console.log(`Server running on ${HOST}:${PORT}`);
    console.log(`API available at http://${HOST}:${PORT}/api`);
    console.log(`Frontend available at http://${HOST}:${PORT}`);
  });
}

module.exports = app;

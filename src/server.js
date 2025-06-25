const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/config');
const receiptRoutes = require('./routes/receipts');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/receipts', receiptRoutes);

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

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
  console.log(`Frontend available at http://localhost:${PORT}`);
});
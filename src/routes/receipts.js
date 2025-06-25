const express = require('express');
const router = express.Router();
const { upload, processImage } = require('../middleware/upload');
const { validateReceiptType, validateImageFile, rateLimiter } = require('../middleware/validation');
const ReceiptService = require('../services/receiptService');

const receiptService = new ReceiptService();

// Get available receipt types and their templates
router.get('/types', async (req, res) => {
  try {
    const templates = receiptService.getReceiptTemplates();
    res.json({
      success: true,
      data: {
        types: Object.keys(templates),
        templates: templates
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Process receipt image
router.post('/process', rateLimiter(), upload.single('image'), processImage, validateImageFile, validateReceiptType, async (req, res) => {
  try {
    const { receiptType } = req.body;
    const result = await receiptService.processReceipt(req.file.buffer, receiptType);
    
    res.json({
      success: true,
      data: result.data,
      receiptType: result.receiptType,
      count: result.count,
      imageSize: req.file.size,
      processedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Receipt processing service is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
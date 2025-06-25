const config = require('../config/config');

const validateReceiptType = (req, res, next) => {
  const validTypes = ['bale', 'popup_collection', 'weigh_bridge'];
  const { receiptType } = req.body;

  if (!receiptType) {
    return res.status(400).json({
      success: false,
      error: 'Receipt type is required'
    });
  }

  if (!validTypes.includes(receiptType)) {
    return res.status(400).json({
      success: false,
      error: `Invalid receipt type. Valid types are: ${validTypes.join(', ')}`
    });
  }

  next();
};

const validateImageFile = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'Image file is required'
    });
  }

  if (!config.upload.allowedMimeTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed'
    });
  }

  if (req.file.size > config.upload.maxFileSize) {
    return res.status(400).json({
      success: false,
      error: `File size exceeds limit of ${config.upload.maxFileSize / (1024 * 1024)}MB`
    });
  }

  next();
};

const rateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
  const requests = new Map();

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!requests.has(ip)) {
      requests.set(ip, []);
    }

    const requestTimes = requests.get(ip).filter(time => time > windowStart);
    
    if (requestTimes.length >= max) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.'
      });
    }

    requestTimes.push(now);
    requests.set(ip, requestTimes);
    next();
  };
};

module.exports = {
  validateReceiptType,
  validateImageFile,
  rateLimiter
};
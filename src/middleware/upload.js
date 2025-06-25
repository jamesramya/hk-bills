const multer = require('multer');
const sharp = require('sharp');
const config = require('../config/config');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.upload.maxFileSize
  },
  fileFilter: fileFilter
});

const processImage = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    // Convert image to JPEG format for consistent processing
    const processedBuffer = await sharp(req.file.buffer)
      .jpeg({ quality: 90 })
      .toBuffer();
    
    req.file.buffer = processedBuffer;
    req.file.mimetype = 'image/jpeg';
    next();
  } catch (error) {
    next(new Error(`Image processing failed: ${error.message}`));
  }
};

module.exports = { upload, processImage };
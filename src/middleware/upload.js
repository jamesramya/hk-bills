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

const handleBase64Image = (req, res, next) => {
  // Check if image is provided as base64 in request body
  if (req.body.imageBase64 && !req.file) {
    try {
      const base64Data = req.body.imageBase64;
      let imageBuffer;
      let mimeType;

      // Handle data URL format (data:image/png;base64,...)
      if (base64Data.startsWith('data:')) {
        const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) {
          return res.status(400).json({
            success: false,
            error: 'Invalid base64 image format'
          });
        }
        mimeType = matches[1];
        imageBuffer = Buffer.from(matches[2], 'base64');
      } else {
        // Plain base64 string - assume PNG
        imageBuffer = Buffer.from(base64Data, 'base64');
        mimeType = 'image/png';
      }

      // Validate MIME type
      if (!config.upload.allowedMimeTypes.includes(mimeType)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.'
        });
      }

      // Validate file size
      if (imageBuffer.length > config.upload.maxFileSize) {
        return res.status(400).json({
          success: false,
          error: `File size exceeds limit of ${config.upload.maxFileSize / (1024 * 1024)}MB`
        });
      }

      // Create a file object similar to multer
      req.file = {
        buffer: imageBuffer,
        mimetype: mimeType,
        size: imageBuffer.length,
        originalname: `image.${mimeType.split('/')[1]}`,
        fieldname: 'image'
      };

    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid base64 image data'
      });
    }
  }
  
  next();
};

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
    // Return a more specific error message for image processing failures
    const errorMessage = error.message.includes('Input file contains unsupported image format') 
      ? 'Invalid or corrupted image file. Please use a valid JPEG, PNG, or WebP image.'
      : `Image processing failed: ${error.message}`;
    
    return res.status(400).json({
      success: false,
      error: errorMessage
    });
  }
};

module.exports = { upload, handleBase64Image, processImage };
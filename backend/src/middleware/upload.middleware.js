const multer = require('multer');
const path = require('path');
const fs = require('fs');
const env = require('../config/env');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(env.UPLOAD_DIR, 'profiles', req.user.id);
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(env.UPLOAD_DIR, 'products');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `product-${uniqueSuffix}${ext}`);
  },
});

const profileFileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Accepted: ${allowed.join(', ')}`), false);
  }
};

const productImageFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Product images must be JPG, JPEG, PNG, or WEBP'), false);
  }
};

const uploadProfileFile = multer({
  storage: profileStorage,
  fileFilter: profileFileFilter,
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
}).single('file');

const uploadProductImage = multer({
  storage: productStorage,
  fileFilter: productImageFilter,
  limits: { fileSize: env.MAX_PRODUCT_IMAGE_MB * 1024 * 1024 },
}).single('image');

const csvStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(env.UPLOAD_DIR, 'temp');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `csv-${Date.now()}.csv`);
  },
});

const csvFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.csv' || file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'), false);
  }
};

const csvUpload = multer({ storage: csvStorage, fileFilter: csvFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const productImageUpload = multer({ storage: productStorage, fileFilter: productImageFilter, limits: { fileSize: env.MAX_PRODUCT_IMAGE_MB * 1024 * 1024 } });

const handleMulterError = (uploadFn) => (req, res, next) => {
  uploadFn(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: `File too large. Maximum allowed size is ${env.MAX_FILE_SIZE_MB}MB.`,
        });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

module.exports = {
  uploadProfileFile: handleMulterError(uploadProfileFile),
  uploadProductImage: handleMulterError(uploadProductImage),
  productImageUpload,
  csvUpload,
};

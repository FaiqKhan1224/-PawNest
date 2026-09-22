const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const env = require('../config/env');
const HttpError = require('../utils/httpError');

fs.mkdirSync(env.paths.uploads, { recursive: true });

const allowed = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, env.paths.uploads),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${allowed[file.mimetype] || path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (allowed[file.mimetype]) return cb(null, true);
    cb(new HttpError(400, 'Only JPG, PNG, WEBP or GIF images up to 4 MB are allowed.'));
  },
});

module.exports = upload;

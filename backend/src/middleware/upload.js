const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const HttpError = require('../utils/httpError');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new HttpError(400, 'Only JPG, PNG, WEBP or GIF images up to 4 MB are allowed.'));
  },
});

upload.toCloud = (buffer) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: 'pawnest' }, (err, result) => (err ? reject(err) : resolve(result)))
      .end(buffer);
  });

module.exports = upload;
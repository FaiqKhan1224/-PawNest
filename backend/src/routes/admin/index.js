const asyncHandler = require('../../utils/asyncHandler');
const express = require('express');
const { protect, adminOnly } = require('../../middleware/auth');
const upload = require('../../middleware/upload');
const HttpError = require('../../utils/httpError');

const router = express.Router();
router.use(protect, adminOnly);

router.use('/', require('./dashboard'));
router.use('/products', require('./products'));
router.use('/categories', require('./categories'));
router.use('/orders', require('./orders'));
router.use('/customers', require('./customers'));
router.use('/reviews', require('./reviews'));
router.use('/coupons', require('./coupons'));
router.use('/ai', require('./ai'));
router.use('/settings', require('./settings'));

router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) throw new HttpError(400, 'Choose an image to upload.');
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});
router.post('/upload', upload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) throw new HttpError(400, 'Choose an image to upload.');
  const result = await upload.toCloud(req.file.buffer);
  res.status(201).json({ url: result.secure_url });
}));

module.exports = router;

const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const HttpError = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

const ids = (user) => user.wishlist.map(String);

router.get('/', asyncHandler(async (req, res) => {
  res.json({ ids: ids(req.user) });
}));

router.post('/toggle', asyncHandler(async (req, res) => {
  const { productId } = req.body || {};
  if (!mongoose.isValidObjectId(productId)) throw new HttpError(400, 'Invalid product.');
  const has = ids(req.user).includes(String(productId));
  if (has) {
    await User.updateOne({ _id: req.user._id }, { $pull: { wishlist: productId } });
  } else {
    if (!(await Product.exists({ _id: productId, isActive: true }))) throw new HttpError(404, 'Product not found.');
    await User.updateOne({ _id: req.user._id }, { $addToSet: { wishlist: productId } });
  }
  const fresh = await User.findById(req.user._id).select('wishlist');
  res.json({ ids: ids(fresh), added: !has });
}));

router.post('/merge', asyncHandler(async (req, res) => {
  const incoming = (Array.isArray(req.body && req.body.ids) ? req.body.ids : []).filter((id) => mongoose.isValidObjectId(id)).slice(0, 100);
  if (incoming.length) {
    const valid = await Product.find({ _id: { $in: incoming }, isActive: true }).select('_id').lean();
    await User.updateOne({ _id: req.user._id }, { $addToSet: { wishlist: { $each: valid.map((p) => p._id) } } });
  }
  const fresh = await User.findById(req.user._id).select('wishlist');
  res.json({ ids: ids(fresh) });
}));

module.exports = router;

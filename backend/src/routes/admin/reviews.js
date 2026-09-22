const express = require('express');
const mongoose = require('mongoose');
const Review = require('../../models/Review');
const HttpError = require('../../utils/httpError');
const asyncHandler = require('../../utils/asyncHandler');
const { escapeRegex, toInt } = require('../../utils/text');
const { recalcProductRating } = require('../../services/ratings');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const page = toInt(req.query.page, 1, { min: 1, max: 10000 });
  const limit = toInt(req.query.limit, 10, { min: 1, max: 100 });
  const filter = {};
  if (mongoose.isValidObjectId(req.query.product)) filter.product = req.query.product;
  if (['published', 'hidden'].includes(req.query.status)) filter.status = req.query.status;
  if (req.query.rating) filter.rating = Number(req.query.rating);
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(String(req.query.q).slice(0, 60)), 'i');
    filter.$or = [{ name: rx }, { comment: rx }, { title: rx }];
  }
  const [reviews, total, published, hidden] = await Promise.all([
    Review.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('product', 'name slug images brand').lean(),
    Review.countDocuments(filter),
    Review.countDocuments({ status: 'published' }),
    Review.countDocuments({ status: 'hidden' }),
  ]);
  res.json({ reviews, total, page, pages: Math.max(1, Math.ceil(total / limit)), summary: { published, hidden } });
}));

router.patch('/:id/status', asyncHandler(async (req, res) => {
  if (!['published', 'hidden'].includes(req.body.status)) throw new HttpError(400, 'Status must be published or hidden.');
  const review = await Review.findByIdAndUpdate(req.params.id, { $set: { status: req.body.status } }, { new: true });
  if (!review) throw new HttpError(404, 'Review not found.');
  await recalcProductRating(review.product);
  res.json({ review });
}));

router.patch('/:id/reply', asyncHandler(async (req, res) => {
  const text = String(req.body.text || '').trim().slice(0, 600);
  const review = await Review.findByIdAndUpdate(req.params.id, { $set: { adminReply: { text, at: text ? new Date() : null } } }, { new: true });
  if (!review) throw new HttpError(404, 'Review not found.');
  res.json({ review });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) throw new HttpError(404, 'Review not found.');
  await recalcProductRating(review.product);
  res.json({ message: 'Review deleted.' });
}));

module.exports = router;

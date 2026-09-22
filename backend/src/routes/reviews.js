const express = require('express');
const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const HttpError = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');
const { protect } = require('../middleware/auth');
const { toInt } = require('../utils/text');
const { recalcProductRating, ratingDistribution } = require('../services/ratings');

// Mounted at /api/products/:productId/reviews
const productReviews = express.Router({ mergeParams: true });

async function findProduct(idOrSlug) {
  const query = mongoose.isValidObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug };
  const product = await Product.findOne({ ...query, isActive: true }).select('_id name');
  if (!product) throw new HttpError(404, 'Product not found.');
  return product;
}

const shapeReview = (r) => ({
  _id: r._id,
  name: r.name,
  rating: r.rating,
  title: r.title,
  comment: r.comment,
  verifiedPurchase: r.verifiedPurchase,
  adminReply: r.adminReply && r.adminReply.text ? r.adminReply : null,
  createdAt: r.createdAt,
});

productReviews.get('/', asyncHandler(async (req, res) => {
  const product = await findProduct(req.params.productId);
  const page = toInt(req.query.page, 1, { min: 1, max: 1000 });
  const limit = toInt(req.query.limit, 6, { min: 1, max: 30 });
  const sort = { newest: { createdAt: -1 }, highest: { rating: -1, createdAt: -1 }, lowest: { rating: 1, createdAt: -1 } }[req.query.sort] || { createdAt: -1 };
  const filter = { product: product._id, status: 'published' };
  const [reviews, total, distribution] = await Promise.all([
    Review.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    Review.countDocuments(filter),
    ratingDistribution(product._id),
  ]);
  res.json({ reviews: reviews.map(shapeReview), total, page, pages: Math.max(1, Math.ceil(total / limit)), distribution });
}));

productReviews.post('/', protect, asyncHandler(async (req, res) => {
  const product = await findProduct(req.params.productId);
  const rating = Number(req.body.rating);
  const comment = String(req.body.comment || '').trim();
  const title = String(req.body.title || '').trim().slice(0, 120);
  if (!(rating >= 1 && rating <= 5) || !Number.isInteger(rating)) throw new HttpError(400, 'Please choose a star rating from 1 to 5.');
  if (comment.length < 5) throw new HttpError(400, 'Please write a few words about the product.');

  const verified = !!(await Order.exists({ user: req.user._id, status: { $ne: 'Cancelled' }, 'items.product': product._id }));
  const review = await Review.findOneAndUpdate(
    { product: product._id, user: req.user._id },
    { $set: { name: req.user.name, rating, title, comment, verifiedPurchase: verified, status: 'published' } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  const stats = await recalcProductRating(product._id);
  res.status(201).json({ review: shapeReview(review), rating: stats.avgRating, reviewCount: stats.reviewCount });
}));

// Mounted at /api/reviews
const publicReviews = express.Router();

publicReviews.get('/featured', asyncHandler(async (req, res) => {
  const pool = await Review.aggregate([
    { $match: { status: 'published', rating: 5, $expr: { $gte: [{ $strLenCP: '$comment' }, 50] } } },
    { $sample: { size: 18 } },
  ]);
  await Review.populate(pool, { path: 'product', select: 'name slug animals isActive' });
  const seen = new Set();
  const picked = [];
  for (const r of pool) {
    if (!r.product || !r.product.isActive || seen.has(r.name) || seen.has(String(r.product._id))) continue;
    seen.add(r.name);
    seen.add(String(r.product._id));
    const animal = r.product.animals && r.product.animals[0];
    picked.push({
      _id: r._id,
      name: r.name,
      rating: r.rating,
      comment: r.comment,
      product: { name: r.product.name, slug: r.product.slug },
      role: { dogs: 'Dog Owner', cats: 'Cat Owner', birds: 'Bird Owner', rabbits: 'Rabbit Owner', fish: 'Fish Keeper' }[animal] || 'Pet Parent',
    });
    if (picked.length === 3) break;
  }
  res.json({ reviews: picked });
}));

module.exports = { productReviews, publicReviews };

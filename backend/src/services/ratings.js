const Review = require('../models/Review');
const Product = require('../models/Product');

async function recalcProductRating(productId) {
  const [row] = await Review.aggregate([
    { $match: { product: productId, status: 'published' } },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const avgRating = row ? Math.round(row.avg * 10) / 10 : 0;
  const reviewCount = row ? row.count : 0;
  await Product.updateOne({ _id: productId }, { $set: { avgRating, reviewCount } });
  return { avgRating, reviewCount };
}

async function ratingDistribution(productId) {
  const rows = await Review.aggregate([
    { $match: { product: productId, status: 'published' } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
  ]);
  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  rows.forEach((r) => { dist[r._id] = r.count; });
  return dist;
}

module.exports = { recalcProductRating, ratingDistribution };

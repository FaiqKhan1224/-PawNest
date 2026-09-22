const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const HttpError = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');
const { publicProduct } = require('../utils/serialize');
const { escapeRegex, csv, toInt } = require('../utils/text');
const { ratingDistribution } = require('../services/ratings');

const router = express.Router();

function buildFilter(q) {
  const filter = { isActive: true };
  if (q.animal) filter.animals = { $in: csv(q.animal) };
  if (q.category) filter.category = { $in: csv(q.category) };
  if (q.brand) filter.brand = { $in: csv(q.brand) };
  if (q.minRating) filter.avgRating = { $gte: Number(q.minRating) || 0 };
  if (q.featured === 'true') filter.featured = true;
  if (q.inStock === 'true') filter.stock = { $gt: 0 };
  if (q.deals === 'true') {
    filter.priceVisible = true;
    filter.discountPercent = { $gt: 0 };
  }
  // Price filters only ever match products whose price is public.
  const min = Number(q.minPrice);
  const max = Number(q.maxPrice);
  if ((min > 0) || (max > 0)) {
    filter.priceVisible = true;
    filter.price = {};
    if (min > 0) filter.price.$gte = min;
    if (max > 0) filter.price.$lte = max;
  }
  const search = String(q.q || '').trim().slice(0, 80);
  if (search) {
    filter.$and = search.split(/\s+/).map((token) => {
      const rx = new RegExp(escapeRegex(token), 'i');
      return { $or: [{ name: rx }, { brand: rx }, { subCategory: rx }, { category: rx }, { animals: rx }, { description: rx }] };
    });
  }
  return filter;
}

router.get('/', asyncHandler(async (req, res) => {
  const page = toInt(req.query.page, 1, { min: 1, max: 10000 });
  const limit = toInt(req.query.limit, 12, { min: 1, max: 48 });
  const sort = String(req.query.sort || 'popular');
  const filter = buildFilter(req.query);

  // Hidden-price products never take part in price ordering, so the order itself can't leak a hidden price.
  const sortStages = {
    popular: { soldCount: -1, reviewCount: -1, _id: 1 },
    rating: { avgRating: -1, reviewCount: -1, _id: 1 },
    newest: { createdAt: -1, _id: 1 },
    name: { name: 1 },
    price_asc: { _hidden: 1, _sortPrice: 1, soldCount: -1, _id: 1 },
    price_desc: { _hidden: 1, _sortPrice: -1, soldCount: -1, _id: 1 },
  };
  const sortStage = sortStages[sort] || sortStages.popular;

  const [result] = await Product.aggregate([
    { $match: filter },
    {
      $addFields: {
        _hidden: { $cond: ['$priceVisible', 0, 1] },
        _sortPrice: { $cond: ['$priceVisible', '$price', null] },
      },
    },
    { $sort: sortStage },
    { $facet: { items: [{ $skip: (page - 1) * limit }, { $limit: limit }], total: [{ $count: 'n' }] } },
  ]);

  const total = result.total[0] ? result.total[0].n : 0;
  res.json({
    products: result.items.map(publicProduct),
    page,
    limit,
    total,
    pages: Math.max(1, Math.ceil(total / limit)),
  });
}));

router.get('/facets', asyncHandler(async (req, res) => {
  const base = { isActive: true };
  const animalMatch = req.query.animal ? { animals: { $in: csv(req.query.animal) } } : {};
  const categoryMatch = req.query.category ? { category: { $in: csv(req.query.category) } } : {};

  const [animals, categories, brands, priceRow] = await Promise.all([
    Product.aggregate([{ $match: { ...base, ...categoryMatch } }, { $unwind: '$animals' }, { $group: { _id: '$animals', count: { $sum: 1 } } }]),
    Product.aggregate([{ $match: { ...base, ...animalMatch } }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
    Product.aggregate([{ $match: { ...base, ...animalMatch, ...categoryMatch } }, { $group: { _id: '$brand', count: { $sum: 1 } } }, { $sort: { count: -1, _id: 1 } }]),
    Product.aggregate([{ $match: { ...base, priceVisible: true } }, { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } }]),
  ]);

  const shape = (rows) => rows.map((r) => ({ value: r._id, count: r.count })).sort((a, b) => b.count - a.count);
  res.json({
    animals: shape(animals),
    categories: shape(categories),
    brands: shape(brands),
    priceRange: priceRow[0] ? { min: priceRow[0].min, max: priceRow[0].max } : { min: 0, max: 10000 },
  });
}));

router.post('/by-ids', asyncHandler(async (req, res) => {
  const ids = (Array.isArray(req.body && req.body.ids) ? req.body.ids : []).filter((id) => mongoose.isValidObjectId(id)).slice(0, 60);
  const products = ids.length ? await Product.find({ _id: { $in: ids }, isActive: true }).lean() : [];
  const order = new Map(ids.map((id, i) => [String(id), i]));
  products.sort((a, b) => order.get(String(a._id)) - order.get(String(b._id)));
  res.json({ products: products.map(publicProduct) });
}));

router.get('/:idOrSlug', asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const query = mongoose.isValidObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug };
  const product = await Product.findOne({ ...query, isActive: true }).lean();
  if (!product) throw new HttpError(404, 'Product not found.');

  let related = await Product.find({ isActive: true, _id: { $ne: product._id }, category: product.category, animals: { $in: product.animals } })
    .sort({ soldCount: -1, avgRating: -1 }).limit(4).lean();
  if (related.length < 4) {
    const have = [product._id, ...related.map((r) => r._id)];
    const more = await Product.find({ isActive: true, _id: { $nin: have }, animals: { $in: product.animals } })
      .sort({ soldCount: -1, avgRating: -1 }).limit(4 - related.length).lean();
    related = related.concat(more);
  }

  res.json({
    product: publicProduct(product),
    related: related.map(publicProduct),
    ratingDistribution: await ratingDistribution(product._id),
  });
}));

module.exports = router;

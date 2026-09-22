const express = require('express');
const mongoose = require('mongoose');
const Product = require('../../models/Product');
const Category = require('../../models/Category');
const Review = require('../../models/Review');
const User = require('../../models/User');
const HttpError = require('../../utils/httpError');
const asyncHandler = require('../../utils/asyncHandler');
const { adminProduct } = require('../../utils/serialize');
const { slugify, escapeRegex, csv, toInt } = require('../../utils/text');

const router = express.Router();

const toList = (v) => (Array.isArray(v) ? v : String(v || '').split('\n')).map((s) => String(s).trim()).filter(Boolean);

async function uniqueSlug(base, excludeId) {
  let slug = slugify(base) || 'product';
  let n = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await Product.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    n += 1;
    slug = `${slugify(base)}-${n}`;
  }
  return slug;
}

async function cleanProduct(body, existing) {
  const data = {};
  const has = (k) => body[k] !== undefined;

  if (has('name')) data.name = String(body.name).trim();
  if (has('brand')) data.brand = String(body.brand).trim();
  if (has('animals')) data.animals = csv(Array.isArray(body.animals) ? body.animals.join(',') : body.animals);
  if (has('category')) data.category = String(body.category).trim();
  ['subCategory', 'description', 'ingredients', 'usage', 'weight', 'ageGroup', 'breedSize'].forEach((k) => {
    if (has(k)) data[k] = String(body[k] || '').trim();
  });
  if (has('benefits')) data.benefits = toList(body.benefits);
  if (has('images')) data.images = toList(body.images).slice(0, 8);
  if (has('price')) data.price = Number(body.price);
  if (has('discountPercent')) data.discountPercent = Number(body.discountPercent) || 0;
  if (has('stock')) data.stock = Math.max(0, parseInt(body.stock, 10) || 0);
  if (has('lowStockThreshold')) data.lowStockThreshold = Math.max(0, parseInt(body.lowStockThreshold, 10) || 0);
  ['priceVisible', 'isActive', 'featured'].forEach((k) => {
    if (has(k)) data[k] = body[k] === true || body[k] === 'true';
  });

  if (!existing || has('name')) {
    if (!data.name || data.name.length < 3) throw new HttpError(400, 'Product name must be at least 3 characters.');
  }
  if (!existing || has('brand')) {
    if (!data.brand) throw new HttpError(400, 'Please enter a brand.');
  }
  if (!existing || has('price')) {
    if (!(data.price >= 0) || Number.isNaN(data.price)) throw new HttpError(400, 'Please enter a valid price.');
  }
  if (data.discountPercent !== undefined && (data.discountPercent < 0 || data.discountPercent > 90)) throw new HttpError(400, 'Discount must be between 0 and 90 percent.');

  if (!existing || has('animals')) {
    const valid = (await Category.find({ kind: 'animal' }).select('slug').lean()).map((c) => c.slug);
    if (!data.animals || !data.animals.length) throw new HttpError(400, 'Choose at least one animal.');
    if (data.animals.some((a) => !valid.includes(a))) throw new HttpError(400, 'One of the selected animals does not exist.');
  }
  if (!existing || has('category')) {
    if (!(await Category.exists({ kind: 'type', slug: data.category }))) throw new HttpError(400, 'Please choose a valid category.');
  }
  return data;
}

router.get('/', asyncHandler(async (req, res) => {
  const q = req.query;
  const page = toInt(q.page, 1, { min: 1, max: 10000 });
  const limit = toInt(q.limit, 10, { min: 1, max: 100 });
  const and = [];
  if (q.q) {
    const rx = new RegExp(escapeRegex(String(q.q).trim().slice(0, 80)), 'i');
    and.push({ $or: [{ name: rx }, { brand: rx }, { subCategory: rx }] });
  }
  if (q.animal) and.push({ animals: { $in: csv(q.animal) } });
  if (q.category) and.push({ category: { $in: csv(q.category) } });
  if (q.brand) and.push({ brand: { $in: csv(q.brand) } });
  if (q.priceVisible === 'true' || q.priceVisible === 'false') and.push({ priceVisible: q.priceVisible === 'true' });
  if (q.active === 'true' || q.active === 'false') and.push({ isActive: q.active === 'true' });
  if (q.stock === 'out') and.push({ stock: 0 });
  if (q.stock === 'low') and.push({ stock: { $gt: 0 }, $expr: { $lte: ['$stock', '$lowStockThreshold'] } });
  if (q.stock === 'in') and.push({ stock: { $gt: 0 }, $expr: { $gt: ['$stock', '$lowStockThreshold'] } });
  const filter = and.length ? { $and: and } : {};

  const sort = { newest: { createdAt: -1 }, name: { name: 1 }, stock_asc: { stock: 1, name: 1 }, price_desc: { price: -1 }, price_asc: { price: 1 }, rating: { avgRating: -1 } }[q.sort] || { createdAt: -1 };

  const [products, total, brands] = await Promise.all([
    Product.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    Product.countDocuments(filter),
    Product.distinct('brand'),
  ]);

  const result = { products: products.map(adminProduct), total, page, pages: Math.max(1, Math.ceil(total / limit)), brands: brands.sort() };
  if (q.includeCounts === 'true') {
    const [all, out, low, hiddenPrices] = await Promise.all([
      Product.countDocuments({}),
      Product.countDocuments({ stock: 0 }),
      Product.countDocuments({ stock: { $gt: 0 }, $expr: { $lte: ['$stock', '$lowStockThreshold'] } }),
      Product.countDocuments({ priceVisible: false }),
    ]);
    result.counts = { all, out, low, inStock: all - out - low, hiddenPrices };
  }
  res.json(result);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, 'Product not found.');
  const product = await Product.findById(req.params.id).lean();
  if (!product) throw new HttpError(404, 'Product not found.');
  res.json({ product: adminProduct(product) });
}));

router.post('/', asyncHandler(async (req, res) => {
  const data = await cleanProduct(req.body || {}, null);
  data.slug = await uniqueSlug(data.name);
  const product = await Product.create(data);
  res.status(201).json({ product: adminProduct(product) });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, 'Product not found.');
  const existing = await Product.findById(req.params.id);
  if (!existing) throw new HttpError(404, 'Product not found.');
  const data = await cleanProduct(req.body || {}, existing);
  Object.assign(existing, data);
  await existing.save();
  res.json({ product: adminProduct(existing) });
}));

// Show / hide / unhide the price. When hidden, the public API stops sending it altogether.
router.patch('/:id/price-visibility', asyncHandler(async (req, res) => {
  if (typeof req.body.priceVisible !== 'boolean') throw new HttpError(400, 'priceVisible must be true or false.');
  const product = await Product.findByIdAndUpdate(req.params.id, { $set: { priceVisible: req.body.priceVisible } }, { new: true });
  if (!product) throw new HttpError(404, 'Product not found.');
  res.json({ product: adminProduct(product) });
}));

router.patch('/:id/active', asyncHandler(async (req, res) => {
  if (typeof req.body.isActive !== 'boolean') throw new HttpError(400, 'isActive must be true or false.');
  const product = await Product.findByIdAndUpdate(req.params.id, { $set: { isActive: req.body.isActive } }, { new: true });
  if (!product) throw new HttpError(404, 'Product not found.');
  res.json({ product: adminProduct(product) });
}));

router.patch('/:id/stock', asyncHandler(async (req, res) => {
  const set = {};
  if (req.body.stock !== undefined) {
    const stock = parseInt(req.body.stock, 10);
    if (Number.isNaN(stock) || stock < 0) throw new HttpError(400, 'Stock must be 0 or more.');
    set.stock = stock;
  }
  if (req.body.lowStockThreshold !== undefined) {
    const t = parseInt(req.body.lowStockThreshold, 10);
    if (Number.isNaN(t) || t < 0) throw new HttpError(400, 'Low-stock alert level must be 0 or more.');
    set.lowStockThreshold = t;
  }
  const product = await Product.findByIdAndUpdate(req.params.id, { $set: set }, { new: true });
  if (!product) throw new HttpError(404, 'Product not found.');
  res.json({ product: adminProduct(product) });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, 'Product not found.');
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new HttpError(404, 'Product not found.');
  await Promise.all([
    Review.deleteMany({ product: product._id }),
    User.updateMany({}, { $pull: { wishlist: product._id } }),
  ]);
  res.json({ message: 'Product deleted.' });
}));

module.exports = router;

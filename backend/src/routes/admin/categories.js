const express = require('express');
const mongoose = require('mongoose');
const Category = require('../../models/Category');
const Product = require('../../models/Product');
const HttpError = require('../../utils/httpError');
const asyncHandler = require('../../utils/asyncHandler');
const { slugify } = require('../../utils/text');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const [categories, byAnimal, byType] = await Promise.all([
    Category.find().sort({ kind: 1, sortOrder: 1, name: 1 }).lean(),
    Product.aggregate([{ $unwind: '$animals' }, { $group: { _id: '$animals', count: { $sum: 1 } } }]),
    Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
  ]);
  const a = new Map(byAnimal.map((r) => [r._id, r.count]));
  const t = new Map(byType.map((r) => [r._id, r.count]));
  res.json({
    categories: categories.map((c) => ({ ...c, productCount: (c.kind === 'animal' ? a : t).get(c.slug) || 0 })),
  });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { name, kind, icon, description, sortOrder, isActive } = req.body || {};
  if (!['animal', 'type'].includes(kind)) throw new HttpError(400, 'Choose whether this is an animal or a product category.');
  if (!name || String(name).trim().length < 2) throw new HttpError(400, 'Please enter a name.');
  const slug = slugify(req.body.slug || name);
  if (await Category.exists({ kind, slug })) throw new HttpError(409, 'A category with this name already exists.');
  const category = await Category.create({ name: String(name).trim(), slug, kind, icon: icon || 'paw', description: description || '', sortOrder: Number(sortOrder) || 0, isActive: isActive !== false });
  res.status(201).json({ category });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, 'Category not found.');
  const category = await Category.findById(req.params.id);
  if (!category) throw new HttpError(404, 'Category not found.');
  const { name, icon, description, sortOrder, isActive } = req.body || {};
  if (name !== undefined) {
    if (String(name).trim().length < 2) throw new HttpError(400, 'Please enter a name.');
    category.name = String(name).trim();
  }
  if (icon !== undefined) category.icon = icon;
  if (description !== undefined) category.description = String(description).slice(0, 240);
  if (sortOrder !== undefined) category.sortOrder = Number(sortOrder) || 0;
  if (isActive !== undefined) category.isActive = !!isActive;
  await category.save(); // the slug never changes, so existing products keep working
  res.json({ category });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, 'Category not found.');
  const category = await Category.findById(req.params.id);
  if (!category) throw new HttpError(404, 'Category not found.');
  const inUse = await Product.countDocuments(category.kind === 'animal' ? { animals: category.slug } : { category: category.slug });
  if (inUse > 0) throw new HttpError(409, `${inUse} product${inUse === 1 ? ' still uses' : 's still use'} this category. Move or delete them first, or switch the category off instead.`);
  await category.deleteOne();
  res.json({ message: 'Category deleted.' });
}));

module.exports = router;

const express = require('express');
const Category = require('../models/Category');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.kind === 'animal' || req.query.kind === 'type') filter.kind = req.query.kind;
  const categories = await Category.find(filter).sort({ kind: 1, sortOrder: 1, name: 1 }).lean();
  res.json({ categories });
}));

module.exports = router;

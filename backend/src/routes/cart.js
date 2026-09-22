const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const Setting = require('../models/Setting');
const { priceCart } = require('../services/cartService');

const router = express.Router();

router.post('/quote', asyncHandler(async (req, res) => {
  const settings = await Setting.get();
  const { couponDoc, ...quote } = await priceCart(req.body && req.body.items, req.body && req.body.coupon, settings);
  res.json(quote);
}));

module.exports = router;

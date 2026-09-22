const express = require('express');
const mongoose = require('mongoose');
const Coupon = require('../../models/Coupon');
const HttpError = require('../../utils/httpError');
const asyncHandler = require('../../utils/asyncHandler');

const router = express.Router();

function clean(body = {}) {
  const code = String(body.code || '').trim().toUpperCase().replace(/\s+/g, '');
  if (!/^[A-Z0-9_-]{3,20}$/.test(code)) throw new HttpError(400, 'Code must be 3-20 letters or numbers (no spaces).');
  if (!['flat', 'percent'].includes(body.type)) throw new HttpError(400, 'Choose flat amount or percentage.');
  const value = Number(body.value);
  if (!(value > 0)) throw new HttpError(400, 'Enter a discount value greater than zero.');
  if (body.type === 'percent' && value > 90) throw new HttpError(400, 'Percentage cannot be above 90.');
  return {
    code,
    description: String(body.description || '').slice(0, 160),
    type: body.type,
    value,
    maxDiscount: Math.max(0, Number(body.maxDiscount) || 0),
    minOrder: Math.max(0, Number(body.minOrder) || 0),
    maxUses: Math.max(0, parseInt(body.maxUses, 10) || 0),
    expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    isActive: body.isActive !== false,
  };
}

router.get('/', asyncHandler(async (req, res) => {
  res.json({ coupons: await Coupon.find().sort({ createdAt: -1 }).lean() });
}));

router.post('/', asyncHandler(async (req, res) => {
  const data = clean(req.body);
  if (await Coupon.exists({ code: data.code })) throw new HttpError(409, 'A coupon with this code already exists.');
  res.status(201).json({ coupon: await Coupon.create(data) });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, 'Coupon not found.');
  const data = clean(req.body);
  if (await Coupon.exists({ code: data.code, _id: { $ne: req.params.id } })) throw new HttpError(409, 'A coupon with this code already exists.');
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, { $set: data }, { new: true });
  if (!coupon) throw new HttpError(404, 'Coupon not found.');
  res.json({ coupon });
}));

router.patch('/:id/active', asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, { $set: { isActive: !!req.body.isActive } }, { new: true });
  if (!coupon) throw new HttpError(404, 'Coupon not found.');
  res.json({ coupon });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw new HttpError(404, 'Coupon not found.');
  res.json({ message: 'Coupon deleted.' });
}));

module.exports = router;

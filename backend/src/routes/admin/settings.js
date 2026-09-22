const express = require('express');
const Setting = require('../../models/Setting');
const HttpError = require('../../utils/httpError');
const asyncHandler = require('../../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  res.json({ settings: await Setting.get() });
}));

router.put('/', asyncHandler(async (req, res) => {
  const b = req.body || {};
  const s = await Setting.get();
  const str = (v, max = 300) => String(v ?? '').trim().slice(0, max);

  if (b.storeName !== undefined) {
    if (!str(b.storeName)) throw new HttpError(400, 'Store name cannot be empty.');
    s.storeName = str(b.storeName, 60);
  }
  if (b.tagline !== undefined) s.tagline = str(b.tagline, 120);
  if (b.contactEmail !== undefined) {
    if (b.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.contactEmail)) throw new HttpError(400, 'Enter a valid contact email.');
    s.contactEmail = str(b.contactEmail, 120);
  }
  if (b.contactPhone !== undefined) s.contactPhone = str(b.contactPhone, 40);
  if (b.whatsapp !== undefined) s.whatsapp = str(b.whatsapp, 40);
  if (b.address !== undefined) s.address = str(b.address, 200);
  if (b.shippingFee !== undefined) {
    const n = Number(b.shippingFee);
    if (!(n >= 0)) throw new HttpError(400, 'Shipping fee must be 0 or more.');
    s.shippingFee = n;
  }
  if (b.freeShippingThreshold !== undefined) {
    const n = Number(b.freeShippingThreshold);
    if (!(n >= 0)) throw new HttpError(400, 'Free-shipping threshold must be 0 or more.');
    s.freeShippingThreshold = n;
  }
  if (b.onlinePaymentInstructions !== undefined) s.onlinePaymentInstructions = str(b.onlinePaymentInstructions, 600);
  if (b.heroImage !== undefined) s.heroImage = str(b.heroImage, 300);
  if (b.aiEnabled !== undefined) s.aiEnabled = !!b.aiEnabled;
  if (b.social && typeof b.social === 'object') {
    ['facebook', 'instagram', 'twitter', 'youtube'].forEach((k) => {
      if (b.social[k] !== undefined) {
        const url = str(b.social[k], 200);
        if (url && !/^https?:\/\//i.test(url)) throw new HttpError(400, `${k} link must start with http:// or https://`);
        s.social[k] = url;
      }
    });
  }
  await s.save();
  res.json({ settings: s });
}));

module.exports = router;

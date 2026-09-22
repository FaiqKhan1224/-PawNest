const express = require('express');
const Setting = require('../models/Setting');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/public', asyncHandler(async (req, res) => {
  const s = await Setting.get();
  res.json({
    settings: {
      storeName: s.storeName,
      tagline: s.tagline,
      contactEmail: s.contactEmail,
      contactPhone: s.contactPhone,
      whatsapp: s.whatsapp,
      address: s.address,
      shippingFee: s.shippingFee,
      freeShippingThreshold: s.freeShippingThreshold,
      heroImage: s.heroImage,
      social: s.social,
      aiEnabled: s.aiEnabled,
    },
  });
}));

module.exports = router;

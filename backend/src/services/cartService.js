const mongoose = require('mongoose');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { publicProduct } = require('../utils/serialize');
const { evaluateCoupon, computeTotals } = require('../utils/pricing');

/**
 * Prices a cart from the database. The browser only ever sends product ids and
 * quantities - every price, discount and total is calculated here.
 */
async function priceCart(rawItems, couponCode, settings) {
  const merged = new Map();
  (Array.isArray(rawItems) ? rawItems : []).slice(0, 60).forEach((item) => {
    const id = String((item && item.productId) || '');
    if (!mongoose.isValidObjectId(id)) return;
    const qty = Math.max(1, Math.min(99, parseInt(item.quantity, 10) || 1));
    merged.set(id, Math.min(99, (merged.get(id) || 0) + qty));
  });

  const ids = [...merged.keys()];
  const products = ids.length ? await Product.find({ _id: { $in: ids } }).lean() : [];
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const lines = ids.map((id) => {
    const quantity = merged.get(id);
    const p = byId.get(id);
    if (!p || !p.isActive) {
      return { productId: id, quantity, product: null, unitPrice: 0, lineTotal: 0, maxQuantity: 0, issue: 'This product is no longer available.' };
    }
    let issue = null;
    if (!p.priceVisible) issue = 'Price unavailable - contact the store to order this item.';
    else if (p.stock <= 0) issue = 'Out of stock.';
    else if (quantity > p.stock) issue = `Only ${p.stock} left in stock.`;
    return {
      productId: id,
      quantity,
      product: publicProduct(p),
      unitPrice: issue ? 0 : p.price,
      lineTotal: issue ? 0 : p.price * quantity,
      maxQuantity: p.priceVisible ? p.stock : 0,
      issue,
    };
  });

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);

  let coupon = null;
  let couponInfo = null;
  const code = String(couponCode || '').trim().toUpperCase();
  if (code) {
    const doc = await Coupon.findOne({ code });
    const check = evaluateCoupon(doc, subtotal);
    couponInfo = { code, valid: check.valid, message: check.message };
    if (check.valid) coupon = doc;
  }

  const totals = computeTotals(subtotal, coupon, settings);
  return {
    lines,
    ...totals,
    coupon: couponInfo,
    couponDoc: coupon,
    hasIssues: lines.some((l) => l.issue),
    freeShippingThreshold: settings.freeShippingThreshold,
  };
}

module.exports = { priceCart };

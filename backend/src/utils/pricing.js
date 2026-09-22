// Pure pricing helpers - used by the cart quote, checkout and the seed script.

function evaluateCoupon(coupon, subtotal, now = new Date()) {
  if (!coupon) return { valid: false, message: 'Coupon code not found.' };
  if (!coupon.isActive) return { valid: false, message: 'This coupon is no longer active.' };
  if (coupon.expiresAt && new Date(coupon.expiresAt) < now) return { valid: false, message: 'This coupon has expired.' };
  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) return { valid: false, message: 'This coupon has reached its usage limit.' };
  if (subtotal < (coupon.minOrder || 0)) {
    return { valid: false, message: `Add items worth Rs. ${(coupon.minOrder - subtotal).toLocaleString('en-US')} more to use this coupon.` };
  }
  return { valid: true, message: 'Coupon applied.' };
}

function calcDiscount(coupon, subtotal) {
  if (!coupon) return 0;
  let discount = coupon.type === 'percent' ? Math.floor((subtotal * coupon.value) / 100) : coupon.value;
  if (coupon.type === 'percent' && coupon.maxDiscount > 0) discount = Math.min(discount, coupon.maxDiscount);
  return Math.max(0, Math.min(discount, subtotal));
}

function calcShipping(subtotal, settings) {
  if (subtotal <= 0) return 0;
  if (settings.freeShippingThreshold > 0 && subtotal >= settings.freeShippingThreshold) return 0;
  return settings.shippingFee || 0;
}

function computeTotals(subtotal, coupon, settings) {
  const discount = calcDiscount(coupon, subtotal);
  const shipping = calcShipping(subtotal, settings);
  return { subtotal, discount, shipping, total: Math.max(0, subtotal - discount + shipping) };
}

module.exports = { evaluateCoupon, calcDiscount, calcShipping, computeTotals };

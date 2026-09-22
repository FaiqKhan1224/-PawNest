const { roundTo50 } = require('./text');

const round1 = (n) => Math.round((Number(n) || 0) * 10) / 10;

function stockStatus(p) {
  const stock = Number(p.stock) || 0;
  if (stock <= 0) return 'out_of_stock';
  const threshold = p.lowStockThreshold === undefined || p.lowStockThreshold === null ? 10 : p.lowStockThreshold;
  if (stock <= threshold) return 'low_stock';
  return 'in_stock';
}

function comparePriceOf(p) {
  const d = Number(p.discountPercent) || 0;
  if (d <= 0 || d >= 100) return null;
  return roundTo50(p.price / (1 - d / 100));
}

/**
 * What customers are allowed to see. When the admin hides a price the number is
 * removed here on the server - it never reaches the browser, the API or PawAI.
 */
function publicProduct(doc) {
  if (!doc) return null;
  const p = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const visible = p.priceVisible !== false;
  const status = stockStatus(p);
  return {
    _id: String(p._id),
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    animals: p.animals || [],
    category: p.category,
    subCategory: p.subCategory || '',
    description: p.description || '',
    ingredients: p.ingredients || '',
    benefits: p.benefits || [],
    usage: p.usage || '',
    images: p.images || [],
    weight: p.weight || '',
    ageGroup: p.ageGroup || '',
    breedSize: p.breedSize || '',
    featured: !!p.featured,
    rating: round1(p.avgRating),
    reviewCount: p.reviewCount || 0,
    stock: p.stock || 0,
    stockStatus: status,
    inStock: status !== 'out_of_stock',
    priceVisible: visible,
    priceHidden: !visible,
    price: visible ? p.price : null,
    comparePrice: visible ? comparePriceOf(p) : null,
    discountPercent: visible ? Number(p.discountPercent) || 0 : 0,
  };
}

/** Full record for the admin panel (includes hidden prices and internal flags). */
function adminProduct(doc) {
  const p = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    ...p,
    _id: String(p._id),
    rating: round1(p.avgRating),
    comparePrice: comparePriceOf(p),
    stockStatus: stockStatus(p),
  };
}

module.exports = { publicProduct, adminProduct, stockStatus, comparePriceOf, round1 };

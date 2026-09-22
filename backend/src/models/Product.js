const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, trim: true },
    brand: { type: String, required: true, trim: true, index: true },
    animals: { type: [String], index: true, validate: [(v) => v.length > 0, 'Choose at least one animal'] },
    category: { type: String, required: true, index: true },
    subCategory: { type: String, default: '', trim: true },
    description: { type: String, default: '' },
    ingredients: { type: String, default: '' },
    benefits: { type: [String], default: [] },
    usage: { type: String, default: '' },

    price: { type: Number, required: true, min: 0 },
    discountPercent: { type: Number, default: 0, min: 0, max: 90 },
    priceVisible: { type: Boolean, default: true, index: true },

    stock: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 10, min: 0 },

    images: { type: [String], default: [] },
    weight: { type: String, default: '' },
    ageGroup: { type: String, default: '' },
    breedSize: { type: String, default: '' },

    isActive: { type: Boolean, default: true, index: true },
    featured: { type: Boolean, default: false },

    avgRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);

const mongoose = require('mongoose');

// kind "animal" = Dogs, Cats, Birds ...   kind "type" = Food, Treats, Grooming ...
const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    slug: { type: String, required: true, trim: true, lowercase: true },
    kind: { type: String, enum: ['animal', 'type'], required: true },
    icon: { type: String, default: 'paw' },
    description: { type: String, default: '', maxlength: 240 },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

categorySchema.index({ kind: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);

const mongoose = require('mongoose');

const aiUsageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    question: { type: String, required: true, maxlength: 800 },
    questionKey: { type: String, index: true },
    language: { type: String, default: 'en' },
    mode: { type: String, enum: ['openai', 'basic'], default: 'basic' },
    model: { type: String, default: '' },
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    productsReturned: { type: Number, default: 0 },
    durationMs: { type: Number, default: 0 },
    error: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AIUsage', aiUsageSchema);

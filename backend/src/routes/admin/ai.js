const express = require('express');
const env = require('../../config/env');
const AIUsage = require('../../models/AIUsage');
const Setting = require('../../models/Setting');
const asyncHandler = require('../../utils/asyncHandler');

const router = express.Router();

router.get('/overview', asyncHandler(async (req, res) => {
  const settings = await Setting.get();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [totalQuestions, todayQuestions, tokensAll, tokensToday, modes, languages, popular, recent, lastError] = await Promise.all([
    AIUsage.countDocuments({}),
    AIUsage.countDocuments({ createdAt: { $gte: startOfDay } }),
    AIUsage.aggregate([{ $group: { _id: null, t: { $sum: { $add: ['$promptTokens', '$completionTokens'] } } } }]),
    AIUsage.aggregate([{ $match: { createdAt: { $gte: startOfDay } } }, { $group: { _id: null, t: { $sum: { $add: ['$promptTokens', '$completionTokens'] } } } }]),
    AIUsage.aggregate([{ $group: { _id: '$mode', count: { $sum: 1 } } }]),
    AIUsage.aggregate([{ $group: { _id: '$language', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    AIUsage.aggregate([
      { $match: { questionKey: { $ne: '' } } },
      { $group: { _id: '$questionKey', question: { $first: '$question' }, count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } }, { $limit: 8 },
    ]),
    AIUsage.find().sort({ createdAt: -1 }).limit(12).populate('user', 'name').lean(),
    AIUsage.findOne({ error: { $ne: '' } }).sort({ createdAt: -1 }).lean(),
  ]);

  const keyConfigured = !!env.openaiKey;
  let status = 'online';
  if (!settings.aiEnabled) status = 'offline';
  else if (!keyConfigured) status = 'basic';

  res.json({
    status,
    aiEnabled: settings.aiEnabled,
    provider: keyConfigured ? 'OpenAI' : 'Built-in (no API key)',
    keyConfigured,
    model: keyConfigured ? env.openaiModel : '-',
    usage: {
      todayQuestions,
      totalQuestions,
      tokensToday: tokensToday[0] ? tokensToday[0].t : 0,
      tokensTotal: tokensAll[0] ? tokensAll[0].t : 0,
    },
    modes: modes.map((m) => ({ mode: m._id, count: m.count })),
    languages: languages.map((l) => ({ language: l._id, count: l.count })),
    popularQuestions: popular.map((p) => ({ question: p.question, count: p.count })),
    recent: recent.map((r) => ({
      _id: r._id, question: r.question, language: r.language, mode: r.mode, products: r.productsReturned,
      user: r.user ? r.user.name : 'Guest', createdAt: r.createdAt, durationMs: r.durationMs, error: r.error,
    })),
    lastError: lastError ? { message: lastError.error, at: lastError.createdAt } : null,
  });
}));

router.patch('/enabled', asyncHandler(async (req, res) => {
  const settings = await Setting.get();
  settings.aiEnabled = !!req.body.aiEnabled;
  await settings.save();
  res.json({ aiEnabled: settings.aiEnabled });
}));

module.exports = router;

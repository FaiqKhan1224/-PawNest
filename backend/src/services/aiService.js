const env = require('../config/env');
const Product = require('../models/Product');
const AIUsage = require('../models/AIUsage');
const { publicProduct } = require('../utils/serialize');
const { extractIntent, scoreProduct, detectLanguage, buildBasicReply, replyLang, FOLLOW_UPS } = require('../utils/aiText');

let brandCache = { at: 0, list: [] };
async function knownBrands() {
  if (Date.now() - brandCache.at > 60_000) {
    brandCache = { at: Date.now(), list: await Product.distinct('brand', { isActive: true }) };
  }
  return brandCache.list;
}

const formatRs = (n) => `Rs. ${Number(n).toLocaleString('en-US')}`;

/**
 * Retrieves REAL products from MongoDB for the customer's intent.
 * Only customer-visible data is returned (hidden prices stay hidden).
 */
async function retrieveProducts(intent, message, { product } = {}) {
  const base = { isActive: true };
  const words = String(message).toLowerCase().match(/[a-z]{4,}/g) || [];

  const run = async (opts) => {
    const filter = { ...base };
    if (opts.animals && intent.animals.length) filter.animals = { $in: intent.animals };
    if (opts.categories && intent.categories.length) filter.category = { $in: intent.categories };
    if (opts.brands && intent.brands.length) filter.brand = { $in: intent.brands };
    if (opts.price && (intent.maxPrice || intent.minPrice)) {
      filter.priceVisible = true;
      filter.price = {};
      if (intent.maxPrice) filter.price.$lte = intent.maxPrice;
      if (intent.minPrice) filter.price.$gte = intent.minPrice;
    }
    return Product.find(filter).limit(60).lean();
  };

  let candidates = await run({ animals: true, categories: true, brands: true, price: true });
  let overBudget = false;
  if (candidates.length < 2) candidates = await run({ animals: true, categories: true, brands: false, price: true });
  if (candidates.length < 2) candidates = await run({ animals: true, categories: false, brands: false, price: true });
  if (candidates.length === 0 && (intent.maxPrice || intent.minPrice)) {
    candidates = await run({ animals: true, categories: true, brands: false, price: false });
    // Without a price filter only show items whose price the store has chosen to display, cheapest first.
    candidates = candidates.filter((p) => p.priceVisible).sort((a, b) => a.price - b.price);
    overBudget = candidates.length > 0;
  }

  const ranked = overBudget
    ? candidates
    : candidates
        .map((p) => ({ p, score: scoreProduct(p, intent, words) }))
        .sort((a, b) => b.score - a.score)
        .map((x) => x.p);

  let top = ranked.slice(0, 6);
  if (product) {
    const others = top.filter((p) => String(p._id) !== String(product._id)).slice(0, 4);
    top = [product, ...others];
  }
  return { products: top, overBudget };
}

function describeProduct(p) {
  const pub = publicProduct(p);
  return {
    id: pub._id,
    name: pub.name,
    brand: pub.brand,
    animals: pub.animals,
    category: pub.category,
    weight: pub.weight,
    ageGroup: pub.ageGroup,
    rating: pub.rating,
    reviews: pub.reviewCount,
    inStock: pub.inStock,
    price: pub.priceHidden ? null : formatRs(pub.price),
    description: pub.description.slice(0, 160),
  };
}

const SYSTEM_PROMPT = `You are PawAI, the friendly pet-care shopping assistant of PawNest, a pet store in Pakistan. Prices are in Pakistani rupees (Rs.).
You help with pet food and nutrition, grooming, training, accessories, breeds and product recommendations for dogs, cats, birds, rabbits, fish and small pets.

LANGUAGE: Reply in the language and script the customer used - English, Urdu script, Roman Urdu, or a natural mix. If they mix languages, mix the same way.

RULES
1. Recommend ONLY products from the PRODUCT LIST in the context and reference them by their exact "id" in productIds. Never invent products, brands, sizes or prices.
2. Mention a price only when the product's "price" is present, copied exactly. If "price" is null, say the price is not listed and the customer can contact the store.
3. You are not a vet. For symptoms, injuries or emergencies advise seeing a veterinarian. Do not diagnose or give medication doses.
4. Be warm and practical. Keep replies short: 2-6 sentences, optionally a short list. If the pet type is unclear, ask one short question.
5. If the question is unrelated to pets or shopping, politely steer back to pet care.

OUTPUT: respond with ONE JSON object only:
{"reply": string, "productIds": string[] (at most 4 ids from the list, [] if none fit), "followUps": string[] (at most 3 short suggestions in the customer's language)}`;

function buildContext({ pet, focusProduct, list, intent, overBudget }) {
  const lines = [];
  if (pet) {
    lines.push(`PET PROFILE: ${JSON.stringify({ name: pet.name, animal: pet.animal, breed: pet.breed, ageYears: pet.ageYears, weightKg: pet.weightKg, gender: pet.gender, diet: pet.diet })}`);
  }
  if (focusProduct) lines.push(`PRODUCT THE CUSTOMER IS VIEWING: ${JSON.stringify(describeProduct(focusProduct))}`);
  if (intent.maxPrice) lines.push(`CUSTOMER BUDGET: up to ${formatRs(intent.maxPrice)}${overBudget ? ' (no product fits this budget - the list below shows the closest options; say so honestly)' : ''}`);
  if (intent.minPrice) lines.push(`CUSTOMER MINIMUM: ${formatRs(intent.minPrice)}`);
  lines.push(`PRODUCT LIST (real products from the PawNest database):\n${list.length ? list.map((p) => JSON.stringify(describeProduct(p))).join('\n') : '(no matching products found)'}`);
  return lines.join('\n');
}

function parseModelJson(text) {
  const cleaned = String(text || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch (e) { /* fall through */ }
    }
    return null;
  }
}

async function callOpenAI(messages) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.openaiKey}` },
    body: JSON.stringify({
      model: env.openaiModel,
      messages,
      max_completion_tokens: 700,
      response_format: { type: 'json_object' },
    }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!response.ok) {
    let detail = '';
    try { detail = (await response.json()).error?.message || ''; } catch (e) { /* ignore */ }
    throw new Error(`OpenAI ${response.status}${detail ? `: ${detail}` : ''}`);
  }
  return response.json();
}

async function chat({ message, history = [], pet = null, focusProduct = null, user = null }) {
  const started = Date.now();
  const language = detectLanguage(message);
  const intent = extractIntent(message, { brands: await knownBrands(), pet });
  const { products: retrieved, overBudget } = await retrieveProducts(intent, message, { product: focusProduct });

  let reply = '';
  let productIds = [];
  let followUps = [];
  let mode = 'basic';
  let usage = {};
  let error = '';

  if (env.openaiKey) {
    try {
      const safeHistory = history
        .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.content.slice(0, 700) }));
      const messages = [
        { role: 'system', content: `${SYSTEM_PROMPT}\n\n${buildContext({ pet, focusProduct, list: retrieved, intent, overBudget })}` },
        ...safeHistory,
        { role: 'user', content: message },
      ];
      const data = await callOpenAI(messages);
      const parsed = parseModelJson(data.choices?.[0]?.message?.content);
      if (parsed && typeof parsed.reply === 'string' && parsed.reply.trim()) {
        reply = parsed.reply.trim();
        productIds = Array.isArray(parsed.productIds) ? parsed.productIds.map(String) : [];
        followUps = Array.isArray(parsed.followUps) ? parsed.followUps.filter((s) => typeof s === 'string').slice(0, 3) : [];
        mode = 'openai';
        usage = data.usage || {};
      } else {
        error = 'Model returned an unreadable answer';
      }
    } catch (err) {
      error = err.message || 'OpenAI request failed';
      console.warn('[pawai] OpenAI unavailable, using basic mode:', error);
    }
  }

  let cards;
  if (mode === 'openai') {
    const allowed = new Map(retrieved.map((p) => [String(p._id), p]));
    cards = productIds.filter((id) => allowed.has(id)).slice(0, 4).map((id) => allowed.get(id));
    if (!cards.length && intent.wantsProducts && !overBudget) cards = retrieved.slice(0, 3);
  } else {
    const wants = intent.wantsProducts || ['nutrition', 'grooming', 'accessories'].includes(intent.topic);
    cards = wants ? retrieved.slice(0, 3) : [];
    reply = buildBasicReply({ language, intent, hasProducts: cards.length > 0, overBudget });
    followUps = FOLLOW_UPS[replyLang(language)];
  }

  const durationMs = Date.now() - started;
  AIUsage.create({
    user: user ? user._id : null,
    question: message.slice(0, 800),
    questionKey: message.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').trim().slice(0, 120),
    language,
    mode,
    model: mode === 'openai' ? env.openaiModel : '',
    promptTokens: usage.prompt_tokens || 0,
    completionTokens: usage.completion_tokens || 0,
    productsReturned: cards.length,
    durationMs,
    error,
  }).catch((err) => console.warn('[pawai] could not log usage:', err.message));

  return {
    reply,
    products: cards.map(publicProduct),
    followUps,
    language,
    mode,
  };
}

module.exports = { chat, retrieveProducts };

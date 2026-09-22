// Pure text helpers for PawAI: language detection, intent extraction (English / Urdu / Roman Urdu / mixed)
// and the offline "basic mode" replies. No database access here so it can be unit tested.

const ANIMALS = {
  dogs: ['dog', 'dogs', 'puppy', 'puppies', 'pup', 'kutta', 'kutte', 'kuta', 'kuttay', 'kutay', 'کتا', 'کتے', 'کتّا', 'کتوں', 'labrador', 'retriever', 'german shepherd', 'husky', 'pug', 'pomeranian', 'beagle', 'bulldog', 'rottweiler', 'doberman', 'shih tzu', 'poodle', 'spitz', 'gaddi'],
  cats: ['cat', 'cats', 'kitten', 'kittens', 'billi', 'bili', 'billy', 'billiyan', 'بلی', 'بلیاں', 'بلے', 'persian', 'siamese', 'maine coon', 'ragdoll', 'british shorthair', 'bengal', 'tabby'],
  birds: ['bird', 'birds', 'parrot', 'parrots', 'tota', 'tote', 'طوطا', 'طوطے', 'parinda', 'parindey', 'پرندہ', 'پرندے', 'budgie', 'budgies', 'cockatiel', 'finch', 'lovebird', 'love bird', 'macaw', 'canary', 'african grey', 'chirya', 'چڑیا'],
  rabbits: ['rabbit', 'rabbits', 'bunny', 'bunnies', 'khargosh', 'خرگوش'],
  fish: ['fish', 'fishes', 'goldfish', 'betta', 'aquarium', 'machli', 'machhli', 'مچھلی', 'guppy', 'koi'],
  'small-pets': ['hamster', 'hamsters', 'guinea pig', 'guinea pigs', 'gerbil', 'chinchilla', 'ferret', 'small pet', 'small pets'],
};

const CATEGORIES = {
  food: ['food', 'feed', 'diet', 'nutrition', 'khana', 'khaana', 'کھانا', 'خوراک', 'kibble', 'dry food', 'wet food', 'dana', 'دانہ', 'meal', 'pellet', 'pellets', 'flakes', 'seed', 'seeds', 'hay', 'feeding', 'gravy', 'pouch'],
  treats: ['treat', 'treats', 'snack', 'snacks', 'biscuit', 'biscuits', 'jerky', 'dentastix'],
  grooming: ['shampoo', 'groom', 'grooming', 'brush', 'bath', 'bathing', 'nahlana', 'nahane', 'flea', 'fleas', 'tick', 'ticks', 'shedding', 'conditioner', 'شیمپو'],
  accessories: ['collar', 'leash', 'lead', 'bowl', 'cage', 'bed', 'harness', 'litter', 'carrier', 'scratching', 'accessory', 'accessories', 'water bottle', 'perch', 'conditioner'],
  toys: ['toy', 'toys', 'ball', 'khilona', 'khilone', 'khilaune', 'rope', 'wand', 'kong', 'wheel', 'swing'],
};

const TOPICS = {
  nutrition: ['food', 'feed', 'feeding', 'diet', 'nutrition', 'protein', 'calorie', 'calories', 'khana', 'khilana', 'kitna', 'portion', 'kibble', 'allergy', 'sensitive', 'weight', 'obese', 'mota', 'کھانا', 'خوراک'],
  grooming: ['shampoo', 'groom', 'grooming', 'brush', 'bath', 'bathing', 'nahlana', 'nahane', 'fur', 'flea', 'fleas', 'tick', 'coat', 'shedding', 'nails', 'شیمپو', 'نہلانا'],
  training: ['train', 'training', 'sit', 'obedience', 'potty', 'toilet', 'housebreak', 'behavior', 'behaviour', 'bark', 'barking', 'biting', 'sikhana', 'sikhao', 'tarbiyat', 'تربیت', 'سکھانا'],
  health: ['sick', 'vomit', 'vomiting', 'diarrhea', 'diarrhoea', 'vet', 'doctor', 'injury', 'fever', 'cough', 'limp', 'bimar', 'bimari', 'ulti', 'dast', 'بیمار', 'الٹی', 'ڈاکٹر', 'worm', 'deworm', 'vaccine', 'vaccination', 'tika', 'ٹیکہ'],
  accessories: ['collar', 'leash', 'bowl', 'cage', 'bed', 'harness', 'litter', 'carrier', 'accessory', 'accessories', 'toy', 'toys', 'scratching'],
  breed: ['breed', 'breeds', 'adopt', 'adoption', 'which dog', 'which cat', 'nasal', 'temperament'],
};

const ROMAN_UR_WORDS = new Set([
  'kya', 'kaise', 'kese', 'kaisay', 'kaun', 'konsa', 'konsi', 'kaunsa', 'mera', 'meri', 'mere', 'apna', 'apni', 'hai', 'hain', 'ho', 'nahi', 'nahin', 'acha', 'achi', 'accha', 'achha', 'chahiye', 'chahye', 'batao', 'bataye', 'bataen', 'btao', 'karo', 'kare', 'karna', 'liye', 'lye', 'ke', 'ka', 'ki', 'ko', 'se', 'par', 'pe', 'bohat', 'bahut', 'zyada', 'ziada', 'kam', 'thora', 'thoda', 'sasta', 'mehnga', 'qeemat', 'kitna', 'kitni', 'kutta', 'kutte', 'billi', 'tota', 'khana', 'khilana', 'pasand', 'bimar', 'dawai', 'tarika', 'sikhana', 'nahlana', 'aur', 'ya', 'mein', 'main', 'andar', 'tak', 'wala', 'wali', 'chahta', 'chahti', 'dena', 'dain', 'den', 'kaisa', 'kaisi', 'rakhna', 'khargosh', 'machli', 'parinda',
]);
const ENGLISH_WORDS = new Set(['the', 'is', 'are', 'what', 'for', 'my', 'best', 'how', 'can', 'do', 'and', 'of', 'to', 'which', 'good', 'under', 'food', 'with', 'i', 'you', 'a', 'an', 'in', 'on', 'need', 'want', 'please', 'show', 'me', 'have', 'should', 'when', 'why', 'your']);

const URDU_SCRIPT = /[\u0600-\u06FF]/g;

function detectLanguage(text = '') {
  const urduChars = (text.match(URDU_SCRIPT) || []).length;
  const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
  if (urduChars > 0) return latinChars > urduChars * 0.4 ? 'mixed' : 'ur';
  const tokens = text.toLowerCase().match(/[a-z']+/g) || [];
  let roman = 0;
  let english = 0;
  tokens.forEach((t) => {
    if (ROMAN_UR_WORDS.has(t)) roman += 1;
    if (ENGLISH_WORDS.has(t)) english += 1;
  });
  if (roman >= 2 && english >= 3) return 'mixed';
  if (roman >= 2 || (roman >= 1 && english === 0 && tokens.length <= 4)) return 'roman-ur';
  if (roman >= 1 && english >= 1) return 'mixed';
  return 'en';
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function hasWord(text, word) {
  if (/[\u0600-\u06FF]/.test(word)) return text.includes(word);
  return new RegExp(`(^|[^a-z0-9])${escapeRe(word)}([^a-z0-9]|$)`, 'i').test(text);
}

function matchGroups(text, groups) {
  return Object.entries(groups)
    .filter(([, words]) => words.some((w) => hasWord(text, w)))
    .map(([key]) => key);
}

function parseBudget(text) {
  const t = text.toLowerCase().replace(/,/g, '');
  const numMatches = [...t.matchAll(/(\d+(?:\.\d+)?)\s*(k|hazar|hazaar|ہزار)?/g)];
  let value = null;
  for (const m of numMatches) {
    let n = parseFloat(m[1]);
    if (m[2]) n *= 1000;
    if (n >= 100 && n <= 200000) { value = n; break; }
  }
  if (value === null) return {};
  const minWords = /(above|over|more than|at least|minimum|min\b|zyada|ziada|se upar|se zyada|سے اوپر|سے زیادہ)/i;
  if (minWords.test(t)) return { minPrice: value };
  return { maxPrice: value };
}

function extractIntent(message = '', { brands = [], pet = null } = {}) {
  const text = String(message).toLowerCase();
  let animals = matchGroups(text, ANIMALS);
  const categories = matchGroups(text, CATEGORIES);
  const topics = matchGroups(text, TOPICS);
  const brandHits = brands.filter((b) => {
    const plain = b.toLowerCase();
    return text.includes(plain) || text.includes(plain.replace(/[-'’\s]/g, ''));
  });
  const budget = parseBudget(text);

  let usedPet = false;
  if (!animals.length && pet && pet.animal) {
    animals = [pet.animal];
    usedPet = true;
  }

  const ageHints = [];
  if (/(puppy|puppies|kitten|kittens|junior|baby|bachcha|bacha)/i.test(text) || (pet && pet.ageYears && pet.ageYears < 1)) ageHints.push('puppy-kitten');
  if (/(adult|grown)/i.test(text)) ageHints.push('adult');

  const askWords = /(recommend|suggest|best|show|buy|price|qeemat|under|below|budget|need|chahiye|chahye|batao|dikhao|dikha|which|konsa|konsi|kaunsa|options|sasta|cheap|good|acha|achi|بتاؤ|چاہیے|دکھاؤ)/i;
  const wantsProducts =
    categories.length > 0 ||
    brandHits.length > 0 ||
    (askWords.test(text) && (animals.length > 0 || Object.keys(budget).length > 0)) ||
    /(recommend|suggest|show me|dikhao|batao)/i.test(text);

  const topic = topics.find((t) => t !== 'accessories') || topics[0] || (categories.includes('food') ? 'nutrition' : 'general');

  return { animals, usedPet, categories, brands: brandHits, topics, topic, wantsProducts, ageHints, ...budget };
}

function scoreProduct(p, intent, wordsInText) {
  let score = (p.avgRating || 0) * 2 + Math.log10((p.reviewCount || 0) + 1);
  if (p.stock > 0) score += 2;
  if (intent.categories.includes(p.category)) score += 3;
  if (intent.brands.includes(p.brand)) score += 5;
  const name = `${p.name} ${p.subCategory || ''} ${p.ageGroup || ''} ${p.breedSize || ''}`.toLowerCase();
  if (intent.ageHints.includes('puppy-kitten') && /(puppy|kitten|junior|baby)/.test(name)) score += 3;
  if (intent.ageHints.includes('adult') && /adult/.test(name)) score += 2;
  wordsInText.forEach((w) => { if (w.length > 3 && name.includes(w)) score += 1.5; });
  return score;
}

// ---------------------------------------------------------------------------
// Basic (offline) replies. Used when no OPENAI_API_KEY is set or the API fails.
// ---------------------------------------------------------------------------
const TIPS = {
  nutrition: {
    dogs: {
      en: 'Most adult dogs do well on two measured meals a day. Pick a formula that matches their age and size (puppy, adult, large breed) and switch foods gradually over 7-10 days to avoid stomach upsets.',
      'roman-ur': 'Zyada tar bade kutton ko din mein 2 dafa napa tula khana dena behtar hota hai. Khana unki umar aur jism (puppy, adult, large breed) ke hisab se chunein aur naya khana 7-10 din mein aahista aahista badlein.',
      ur: 'زیادہ تر بالغ کتوں کو دن میں دو بار ناپ تول کر کھانا دینا بہتر ہے۔ خوراک ان کی عمر اور جسامت کے مطابق چنیں اور نیا کھانا 7 سے 10 دن میں آہستہ آہستہ تبدیل کریں۔',
    },
    cats: {
      en: 'Cats are obligate carnivores, so look for a high-protein formula. Mix dry food with some wet food for extra moisture, keep fresh water available, and adjust portions to your cat\'s weight and activity.',
      'roman-ur': 'Billiyon ko zyada protein wala khana chahiye hota hai. Dry food ke sath thora wet food dein taake paani ki kami na ho, taza paani hamesha rakhein aur miqdaar billi ke wazan ke hisab se rakhein.',
      ur: 'بلیوں کو زیادہ پروٹین والی خوراک درکار ہوتی ہے۔ خشک کھانے کے ساتھ تھوڑا گیلا کھانا بھی دیں، تازہ پانی ہر وقت رکھیں اور مقدار بلی کے وزن کے مطابق رکھیں۔',
    },
    birds: {
      en: 'A good seed or pellet mix should be the base of a bird\'s diet, with fresh vegetables and fruit a few times a week. Avoid avocado, chocolate and caffeine, and change water daily.',
      'roman-ur': 'Parindon ki khurak ka bunyadi hissa achha seed ya pellet mix hona chahiye, sath haftay mein kai dafa taza sabziyan aur phal dein. Avocado, chocolate aur caffeine se door rakhein aur paani roz badlein.',
      ur: 'پرندوں کی خوراک کی بنیاد اچھا بیج یا پیلٹ مکس ہونا چاہیے، ساتھ ہفتے میں کئی بار تازہ سبزیاں اور پھل دیں۔ ایووکاڈو، چاکلیٹ اور کیفین سے دور رکھیں اور پانی روزانہ بدلیں۔',
    },
    rabbits: {
      en: 'Rabbits need unlimited fresh hay (like timothy) as most of their diet, plus a small portion of pellets and leafy greens. Sudden diet changes can upset their gut.',
      'roman-ur': 'Khargoshon ko zyada tar khurak mein hamesha taza hay (jaise timothy) chahiye, sath thori si pellets aur patton wali sabziyan. Achanak khana badalne se un ka pait kharab ho sakta hai.',
      ur: 'خرگوشوں کی زیادہ تر خوراک ہر وقت دستیاب تازہ گھاس (جیسے ٹمتھی ہے) ہونی چاہیے، ساتھ تھوڑی پیلٹس اور پتوں والی سبزیاں۔ اچانک خوراک بدلنے سے ان کا پیٹ خراب ہو سکتا ہے۔',
    },
    fish: {
      en: 'Feed small amounts once or twice a day - only what your fish finish in about two minutes. Overfeeding fouls the water quickly, so use a food matched to your species (tropical flakes, goldfish pellets).',
      'roman-ur': 'Machliyon ko din mein 1-2 dafa thora sa khana dein - jitna woh 2 minute mein kha lein. Zyada khana paani kharab kar deta hai, is liye apni machli ki qism ke mutabiq khana (tropical flakes, goldfish pellets) chunein.',
      ur: 'مچھلیوں کو دن میں ایک یا دو بار تھوڑا کھانا دیں، بس اتنا جتنا وہ دو منٹ میں کھا لیں۔ زیادہ کھانا پانی خراب کر دیتا ہے، اس لیے اپنی مچھلی کی قسم کے مطابق خوراک چنیں۔',
    },
    'small-pets': {
      en: 'Hamsters and guinea pigs need a species-specific mix. Guinea pigs also need vitamin C and unlimited hay; hamsters like a varied seed mix with the odd fresh veg.',
      'roman-ur': 'Hamster aur guinea pig ko apni qism ka khaas mix chahiye. Guinea pig ko vitamin C aur hamesha hay chahiye, jabke hamster ko mukhtalif beejon ka mix aur kabhi kabhi taza sabzi pasand hai.',
      ur: 'ہیمسٹر اور گنی پگ کو اپنی نسل کے مطابق خاص مکس درکار ہوتا ہے۔ گنی پگ کو وٹامن سی اور ہر وقت گھاس چاہیے، جبکہ ہیمسٹر کو مختلف بیجوں کا مکس اور کبھی کبھی تازہ سبزی پسند ہے۔',
    },
    default: {
      en: 'Choose a complete food made for your pet\'s species, age and size, feed measured portions, keep fresh water available and change foods gradually.',
      'roman-ur': 'Apne pet ki qism, umar aur jism ke mutabiq mukammal khana chunein, napi hui miqdaar mein dein, taza paani rakhein aur khana aahista aahista badlein.',
      ur: 'اپنے پالتو جانور کی نسل، عمر اور جسامت کے مطابق مکمل خوراک چنیں، ناپ کر دیں، تازہ پانی رکھیں اور خوراک آہستہ آہستہ بدلیں۔',
    },
  },
  grooming: {
    en: 'Brush regularly to reduce shedding, bathe only when needed with a pet-safe shampoo (never human shampoo), and check ears, nails and coat for fleas or ticks every week.',
    'roman-ur': 'Baal jhadne ke liye brush regularly karein, sirf zaroorat par pet-safe shampoo se nehlayein (insani shampoo hargiz nahi), aur har hafte kaan, nakhun aur baalon mein pissu ya ticks check karein.',
    ur: 'جھڑتے بالوں کو کم کرنے کے لیے باقاعدگی سے برش کریں، ضرورت پر ہی پالتو جانوروں کے شیمپو سے نہلائیں (انسانی شیمپو ہرگز نہیں) اور ہر ہفتے کان، ناخن اور بالوں میں پسو یا ٹکس دیکھیں۔',
  },
  training: {
    en: 'Keep sessions short (5-10 minutes), reward the behaviour you want right away with a small treat or praise, be consistent, and never punish - it slows learning.',
    'roman-ur': 'Training sessions chhote rakhein (5-10 minute), jo achha kaam ho us par foran chhota treat ya tareef dein, hamesha ek jaisa tareeqa rakhein aur saza na dein - is se seekhna slow hota hai.',
    ur: 'تربیتی سیشن مختصر رکھیں (5 سے 10 منٹ)، اچھے رویے پر فوراً چھوٹا ٹریٹ یا شاباش دیں، ہمیشہ ایک جیسا طریقہ رکھیں اور سزا نہ دیں کیونکہ اس سے سیکھنا سست ہو جاتا ہے۔',
  },
  health: {
    en: 'I can\'t diagnose health problems. If your pet is vomiting, has diarrhoea, is limping, not eating, or seems in pain, please see a veterinarian soon - and straight away if it is an emergency.',
    'roman-ur': 'Main sehat ke masail ki tashkhees nahi kar sakta. Agar aap ka pet ulti, dast, langrahat, khana chhorna ya dard ki alamat dikha raha hai to barah-e-karam jald kisi veterinarian ko dikhayein - emergency ho to foran.',
    ur: 'میں صحت کے مسائل کی تشخیص نہیں کر سکتا۔ اگر آپ کا پالتو جانور الٹی، دست، لنگڑاہٹ، کھانا چھوڑنے یا درد کی علامات ظاہر کر رہا ہے تو براہِ کرم جلد کسی ویٹرنری ڈاکٹر کو دکھائیں، ایمرجنسی میں فوراً۔',
  },
  accessories: {
    en: 'Pick a collar or harness that fits with two fingers of space, choose bowls that are easy to clean (stainless steel is a good choice), and give every pet a comfortable resting spot and a few toys.',
    'roman-ur': 'Aisa collar ya harness chunein jis mein do ungliyon ki jagah bache, saaf karne mein aasan bowls (stainless steel behtar hai) lein, aur har pet ko aaram ki jagah aur kuch khilone dein.',
    ur: 'ایسا کالر یا ہارنس چنیں جس میں دو انگلیوں کی جگہ رہے، آسانی سے صاف ہونے والے پیالے (سٹین لیس سٹیل بہتر ہے) لیں اور ہر پالتو جانور کو آرام کی جگہ اور کچھ کھلونے دیں۔',
  },
  breed: {
    en: 'The right breed depends on your space, time and activity level. Tell me your home size and how active you are, and I can point you to what suits and what to stock up on.',
    'roman-ur': 'Sahi nasal aap ki jagah, waqt aur activity level par depend karti hai. Mujhe apne ghar ka size aur apni activity batayein, phir main bata sakta hoon kya munasib hai aur kya lena chahiye.',
    ur: 'صحیح نسل کا انحصار آپ کی جگہ، وقت اور سرگرمی پر ہے۔ مجھے اپنے گھر کا سائز اور اپنی سرگرمی بتائیں، پھر میں بتا سکتا ہوں کہ کیا مناسب ہے اور کیا خریدنا چاہیے۔',
  },
  general: {
    en: 'Happy to help! Tell me what pet you have (dog, cat, bird, rabbit, fish or small pet) and what you need - food, grooming, accessories or care tips - and I\'ll suggest options from our store.',
    'roman-ur': 'Zaroor madad karunga! Mujhe batayein aap ka pet kaun sa hai (dog, cat, bird, rabbit, fish ya small pet) aur aap ko kya chahiye - khana, grooming, accessories ya care tips - main hamare store se options suggest karunga.',
    ur: 'ضرور مدد کروں گا! مجھے بتائیں آپ کا پالتو جانور کون سا ہے (کتا، بلی، پرندہ، خرگوش، مچھلی یا چھوٹا پالتو) اور آپ کو کیا چاہیے، کھانا، گروومنگ، ایکسیسریز یا دیکھ بھال کے مشورے۔ میں ہمارے اسٹور سے آپشنز تجویز کروں گا۔',
  },
};

const LINES = {
  withProducts: {
    en: 'Here are some options from our store:',
    'roman-ur': 'Ye hamare store ke kuch options hain:',
    ur: 'یہ ہمارے اسٹور کے کچھ آپشنز ہیں:',
  },
  noMatch: {
    en: 'I couldn\'t find a matching product for that just now. Try a different budget or pet type, or browse the Shop page.',
    'roman-ur': 'Mujhe is ke liye abhi koi matching product nahi mila. Doosra budget ya pet type try karein, ya Shop page dekhein.',
    ur: 'مجھے ابھی اس کے لیے کوئی مطابقت رکھنے والی پروڈکٹ نہیں ملی۔ کوئی اور بجٹ یا پالتو جانور کی قسم آزمائیں یا شاپ پیج دیکھیں۔',
  },
  overBudget: {
    en: 'Nothing in that budget right now - these are the closest options:',
    'roman-ur': 'Is budget mein abhi kuch nahi mila - ye sab se qareeb options hain:',
    ur: 'اس بجٹ میں ابھی کچھ نہیں ملا، یہ سب سے قریب آپشنز ہیں:',
  },
  priceNote: {
    en: 'Prices shown on the cards are current store prices.',
    'roman-ur': 'Cards par dikhai gayi qeematen store ki mojooda qeematen hain.',
    ur: 'کارڈز پر دکھائی گئی قیمتیں اسٹور کی موجودہ قیمتیں ہیں۔',
  },
};

const FOLLOW_UPS = {
  en: ['Show me food under 3000', 'What accessories do I need?', 'Ask for care tips'],
  'roman-ur': ['3000 se kam ka khana dikhao', 'Mujhe kaun se accessories chahiye?', 'Care tips batao'],
  ur: ['3000 سے کم کا کھانا دکھاؤ', 'مجھے کون سی ایکسیسریز چاہئیں؟', 'دیکھ بھال کے مشورے بتاؤ'],
};

function replyLang(lang) {
  if (lang === 'ur') return 'ur';
  if (lang === 'roman-ur' || lang === 'mixed') return 'roman-ur';
  return 'en';
}

function buildBasicReply({ language, intent, hasProducts, overBudget }) {
  const l = replyLang(language);
  let tip;
  if (intent.topic === 'nutrition') {
    tip = (TIPS.nutrition[intent.animals[0]] || TIPS.nutrition.default)[l];
  } else {
    tip = (TIPS[intent.topic] || TIPS.general)[l];
  }
  const productTopic = intent.wantsProducts || ['nutrition', 'grooming', 'accessories'].includes(intent.topic);
  if (!productTopic) return tip;
  if (hasProducts && overBudget) return `${LINES.overBudget[l]}`;
  if (hasProducts) return `${tip} ${LINES.withProducts[l]}`;
  return `${tip} ${LINES.noMatch[l]}`;
}

module.exports = {
  ANIMALS, CATEGORIES, TOPICS,
  detectLanguage, extractIntent, scoreProduct, buildBasicReply, replyLang,
  FOLLOW_UPS, LINES,
};

// Deterministic (seeded) sample-review generator. Pure - no database access.
// Every product gets its own rating spread, names, dates and wording.

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const FIRST = ['Ali', 'Sara', 'Ahmed', 'Ayesha', 'Hamza', 'Fatima', 'Usman', 'Zainab', 'Bilal', 'Hina', 'Omar', 'Maryam', 'Hassan', 'Noor', 'Faisal', 'Sana', 'Imran', 'Areeba', 'Talha', 'Mahnoor', 'Kamran', 'Rabia', 'Danish', 'Iqra', 'Saad', 'Laiba', 'Waqas', 'Amna', 'Junaid', 'Komal', 'Shahid', 'Nimra', 'Adeel', 'Sidra', 'Farhan', 'Mehwish', 'Rizwan', 'Anum', 'Asad', 'Hira', 'Sarah', 'Zeeshan', 'Bushra', 'Taimoor', 'Aleena', 'Haris', 'Sundas', 'Owais'];
const LAST = ['Khan', 'Malik', 'Raza', 'Ahmed', 'Sheikh', 'Butt', 'Chaudhry', 'Qureshi', 'Siddiqui', 'Hussain', 'Iqbal', 'Javed', 'Mirza', 'Ansari', 'Baig', 'Rehman', 'Farooq', 'Nawaz', 'Aslam', 'Bhatti', 'Abbasi', 'Zafar', 'Saleem', 'Rana'];

const OPEN = {
  5: ['Absolutely love this!', 'Excellent quality.', 'Very happy with this purchase.', 'Worth every rupee.', 'Five stars from us.', 'Exactly what I was looking for.', 'Best pet purchase this month.', 'Highly recommended!', 'Great product and quick delivery.', "Couldn't be happier.", 'Brilliant product.'],
  4: ['Really good product.', 'Pretty happy with this.', 'Solid choice.', 'Good quality overall.', 'Works well for us.', 'Nice product, does the job.', 'Happy with it so far.'],
  3: ["It's okay.", 'Decent but not perfect.', 'Average experience.', 'Mixed feelings.', 'Fine for the price.'],
  2: ['Not quite what I expected.', 'A bit disappointing.'],
  1: ["Didn't work out for us."],
};

const DETAIL = {
  dogFood: [
    '{Pet} finishes the bowl in minutes and has had no tummy issues since we switched.',
    'The kibble size is just right and the coat looks noticeably shinier after a few weeks.',
    'Stools are firmer and energy on our evening walks is great.',
    'We mixed it with the old food for a week and {pet} took to it quickly.',
    'The bag arrived sealed and fresh, and the smell is appetising without being strong.',
    '{Pet} is a fussy eater and still cleans the bowl every time.',
    'Much better value than the supermarket brand we used before.',
    'Our vet suggested this kind of formula and it has suited {pet} perfectly.',
    'No more itching or dull fur since we made the switch.',
    'The feeding guide on the bag made portions easy, and the bag lasts a good while.',
  ],
  catFood: [
    '{Pet} used to be picky but now runs to the bowl when the bag opens.',
    'The kibble is small and crunchy, easy for {pet} to eat.',
    'Litter box smell has improved and the fur is softer.',
    'We switched slowly over a week with no hairball or tummy trouble.',
    'Fresh packaging, and {pet} loves the flavour.',
    'Great for daily feeding - {pet} is active and looks healthy.',
    'I mix it with a little wet food and it disappears in seconds.',
    'Reasonable price for the quality; ordering again.',
    '{Pet} rejects most foods and this is one of the few that gets finished.',
    'The coat looks glossy and {pet} seems to digest it well.',
  ],
  birdFood: [
    'The mix is fresh with plenty of variety and {pet} picks through it happily.',
    'Very little dust and the seeds look clean and bright.',
    'Feathers look brighter and {pet} is more active since changing to this.',
    'Good quality seed with almost no empty husks.',
    '{Pet} goes for this before anything else in the dish.',
    'Packaging was sealed and the mix smelled fresh.',
    'Great value compared with the mixes from the local market.',
    'A nice balance of seeds and grains - nothing gets left behind.',
    'Chirping and energy levels have picked up since we started this.',
    'The bag reseals well and keeps the food fresh for weeks.',
  ],
  smallFood: [
    '{Pet} gets excited the moment I open the bag.',
    'Fresh smelling and no dust, which matters for such tiny lungs.',
    'Droppings look healthy and appetite is great.',
    'Nothing is left behind in the bowl - it all gets eaten.',
    'Good mix of textures that keeps {pet} busy foraging.',
    'The pellets are uniform so there is no picking out favourites.',
    'Arrived well packed and clearly within its date.',
    'Better quality than the local pet-shop food we bought before.',
  ],
  fishFood: [
    'The fish come to the surface as soon as I open the tub.',
    'Water stays clear even with regular feeding.',
    'Colours have improved noticeably over a few weeks.',
    "Flakes are the right size and don't cloud the tank.",
    'Even the shy fish come out to eat this.',
    'Little waste at the bottom of the tank, which is a big plus.',
    'The tub is sturdy and keeps the food dry.',
    'Good value for how long it lasts.',
  ],
  treats: [
    '{Pet} sits and waits the moment the pack rustles.',
    'Perfect size for training and {pet} never gets bored of them.',
    'No strong smell and no mess in my pocket.',
    'Ingredients are simple and {pet} has had no stomach upset.',
    'Great for bonding and rewarding good behaviour.',
    'Fresh, soft and easy to break into small pieces.',
    'Pack is resealable and the treats stayed fresh.',
    'An easy way to get {pet} to take medicine or do tricks.',
  ],
  grooming: [
    'It lathers nicely and rinses out easily, and the coat feels soft afterwards.',
    'The scent is pleasant and light, not overpowering.',
    'No irritation or dry skin after bath time.',
    '{Pet} smells fresh for days and the fur is easier to brush.',
    'A little goes a long way, so the bottle lasts.',
    'Gentle formula - perfect for {pet} who has sensitive skin.',
    'The pump bottle makes it easy to use.',
    'Leaves the coat shiny without any greasy residue.',
  ],
  accessory: [
    'Well made and sturdier than it looks in the photos.',
    'Fits perfectly and {pet} adjusted to it right away.',
    'The material feels durable and easy to clean.',
    'Looks great and has held up well after weeks of daily use.',
    'Good design, thought through for real daily use.',
    'Exactly as described and the size chart was accurate.',
    'Good quality for the price - better than similar items in local shops.',
    'Easy to set up and {pet} took to it quickly.',
  ],
  toy: [
    '{Pet} plays with it every day and it is still in one piece.',
    'Sturdy build and a great size - {pet} could not put it down.',
    'Keeps {pet} busy for ages, especially when I am at work.',
    'Great for burning off energy and the material seems safe.',
    'Bouncy, durable and easy to wash.',
    'A big hit - {pet} carries it around the house.',
    'Simple but effective, and good value.',
    'Held up against some serious chewing.',
  ],
};

const MID_DETAIL = [
  '{Pet} eats or uses it but is not overly excited.',
  'Quality is fine, just a little pricey compared with similar items.',
  'The packaging had a small dent but the product itself was fine.',
  'It took a while for {pet} to get used to it.',
  'Does what it says, though I expected slightly more.',
];
const BAD_DETAIL = [
  '{Pet} refused it after a couple of days.',
  'Not worth the price for us.',
  'Delivery was late and the packaging was damaged.',
  'Quality was lower than I hoped and it did not suit {pet}.',
];

const CLOSE_HIGH = ['Will definitely reorder.', 'Delivery was quick too.', 'Highly recommend to other pet parents.', 'Great service from PawNest.', 'Would buy again.', 'Thanks PawNest!', 'Packaging was neat and safe.', 'Already recommended it to a friend.'];
const CLOSE_MID = ['Would consider buying again.', 'Delivery was fine.', 'Might try a different size next time.'];

const TITLES = {
  5: ['Love it!', 'Excellent', 'Great quality', 'Highly recommended', 'Perfect for my pet', 'Worth it', 'Very happy', 'Fantastic product'],
  4: ['Good product', 'Happy with it', 'Solid choice', 'Works well'],
  3: ["It's okay", 'Average', 'Decent'],
  2: ['Disappointed'],
  1: ['Not for us'],
};

const ROMAN = {
  dogs: 'mere kutte', cats: 'meri billi', birds: 'mere tote', rabbits: 'meri khargosh', fish: 'meri machliyon', 'small-pets': 'mere chhote pet',
};
const ROMAN_LINES = [
  'Bohat acha product hai, {roman} ko pasand aya.',
  'Quality zabardast hai aur delivery bhi time par mil gayi.',
  'Paisa wasool! Packing bhi achi thi, dobara order karunga.',
  'Original lagta hai, {roman} ke liye bilkul theek raha.',
  'Highly recommended, {roman} ab isi ko pasand karti/karta hai.',
];

const PET_NOUNS = {
  dogs: ['my dog', 'our dog', 'my pooch', 'our furry boy'],
  cats: ['my cat', 'our cat', 'our fur baby', 'my tabby'],
  birds: ['my bird', 'our birds', 'my little parrots'],
  rabbits: ['my rabbit', 'our bunny'],
  fish: ['my fish', 'our aquarium fish'],
  'small-pets': ['my little one', 'our pet'],
};

function domainOf(p) {
  if (p.category === 'food') {
    const a = p.animals[0];
    if (a === 'dogs') return 'dogFood';
    if (a === 'cats') return 'catFood';
    if (a === 'birds') return 'birdFood';
    if (a === 'fish') return 'fishFood';
    return 'smallFood';
  }
  return { treats: 'treats', grooming: 'grooming', accessories: 'accessory', toys: 'toy' }[p.category] || 'accessory';
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

function makeRatings(rng, n, target) {
  const p5 = clamp((target - 3.4) / 1.65, 0.08, 0.97);
  const rest = 1 - p5;
  const probs = [rest * 0.05, rest * 0.08, rest * 0.22, rest * 0.65, p5];
  const ratings = [];
  for (let i = 0; i < n; i += 1) {
    let r = rng();
    let k = 0;
    while (k < 4 && r > probs[k]) { r -= probs[k]; k += 1; }
    ratings.push(k + 1);
  }
  const mean = () => ratings.reduce((a, b) => a + b, 0) / n;
  for (let iter = 0; iter < 600; iter += 1) {
    const err = mean() - target;
    if (Math.abs(err) <= 0.5 / n) break;
    const eligible = [];
    ratings.forEach((r, i) => {
      if (err > 0 && r >= 4) eligible.push(i);
      if (err < 0 && r <= 4) eligible.push(i);
    });
    if (!eligible.length) break;
    const idx = eligible[Math.floor(rng() * eligible.length)];
    const next = ratings[idx] + (err > 0 ? -1 : 1);
    if (Math.abs(mean() + (next - ratings[idx]) / n - target) < Math.abs(err)) ratings[idx] = next;
  }
  return ratings;
}

function pick(rng, list) { return list[Math.floor(rng() * list.length)]; }

/**
 * @param {object} product  catalogue entry ({ name, animals, category, rating, reviews })
 * @param {Date} now
 */
function generateReviews(product, now = new Date()) {
  const rng = mulberry32(hashString(product.name));
  const animal = product.animals[0];
  const domain = domainOf(product);
  const ratings = makeRatings(rng, product.reviews, product.rating);
  const usedText = new Set();
  const usedNames = new Set();
  const out = [];

  let nouns = PET_NOUNS[animal] || ['my pet'];
  if (/hamster/i.test(product.name)) nouns = ['my hamster', 'our hamster'];
  else if (/guinea/i.test(product.name)) nouns = ['my guinea pigs', 'our guinea pig'];
  else if (/budgie/i.test(product.name)) nouns = ['my budgies', 'our budgie'];
  else if (/cockatiel/i.test(product.name)) nouns = ['my cockatiel', 'our cockatiels'];
  else if (/parrot/i.test(product.name)) nouns = ['my parrot', 'our parrots'];

  ratings.forEach((rating) => {
    let comment = '';
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const noun = pick(rng, nouns);
      const fill = (s) => s.replace('{Pet}', cap(noun)).replace('{pet}', noun);
      let text;
      if (rating >= 4 && rng() < 0.12) {
        text = pick(rng, ROMAN_LINES).replace('{roman}', ROMAN[animal] || 'mere pet');
      } else if (rating >= 4) {
        text = `${pick(rng, OPEN[rating])} ${fill(pick(rng, DETAIL[domain]))}${rng() < 0.7 ? ` ${pick(rng, CLOSE_HIGH)}` : ''}`;
      } else if (rating === 3) {
        text = `${pick(rng, OPEN[3])} ${fill(pick(rng, MID_DETAIL))}${rng() < 0.6 ? ` ${pick(rng, CLOSE_MID)}` : ''}`;
      } else {
        text = `${pick(rng, OPEN[rating])} ${fill(pick(rng, BAD_DETAIL))}`;
      }
      if (!usedText.has(text) || attempt === 11) { comment = text; usedText.add(text); break; }
    }

    let name = '';
    for (let attempt = 0; attempt < 8; attempt += 1) {
      name = `${pick(rng, FIRST)} ${pick(rng, LAST)}`;
      if (!usedNames.has(name)) break;
    }
    usedNames.add(name);

    const daysAgo = 1 + Math.floor(rng() * 420);
    const createdAt = new Date(now.getTime() - daysAgo * 86400000 - Math.floor(rng() * 86400000));
    const doc = {
      name,
      rating,
      title: rng() < 0.55 ? pick(rng, TITLES[rating]) : '',
      comment,
      verifiedPurchase: rng() < 0.7,
      createdAt,
      updatedAt: createdAt,
      adminReply: { text: '', at: null },
    };
    if (rating <= 3 && rng() < 0.7) {
      doc.adminReply = {
        text: 'Thank you for the honest feedback. Please contact our support team with your order number and we will make it right.',
        at: new Date(createdAt.getTime() + 86400000),
      };
    }
    out.push(doc);
  });

  return out.sort((a, b) => a.createdAt - b.createdAt);
}

module.exports = { generateReviews, mulberry32, hashString, FIRST, LAST };

const bcrypt = require('bcryptjs');
const { getDB, BOOKS_COLLECTION_NAME, USERS_COLLECTION_NAME } = require('./connection');
const sampleBooks = require('./sampleBooks');

const DEFAULT_MIN_BOOKS = 20;
const DEFAULT_BCRYPT_ROUNDS = 12;

function toBoolean(value, fallback) {
  if (value === undefined) {
    return fallback;
  }

  if (typeof value === 'string') {
    return !['0', 'false', 'no', 'off'].includes(value.toLowerCase());
  }

  return Boolean(value);
}

async function ensureDefaultAdminUser() {
  const db = getDB();
  const usersCollection = db.collection(USERS_COLLECTION_NAME);

  const username = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
  const plainPassword = process.env.ADMIN_PASSWORD || 'admin12345';
  const adminRole = (process.env.ADMIN_ROLE || 'admin').trim().toLowerCase();
  const preHashedPassword = process.env.ADMIN_PASSWORD_HASH;

  const existingUser = await usersCollection.findOne({ username });
  if (existingUser) {
    return;
  }

  let passwordHash = '';
  if (preHashedPassword && preHashedPassword.trim()) {
    passwordHash = preHashedPassword.trim();
  } else {
    const rounds = Number.parseInt(process.env.BCRYPT_ROUNDS || `${DEFAULT_BCRYPT_ROUNDS}`, 10);
    const normalizedRounds = Number.isNaN(rounds) ? DEFAULT_BCRYPT_ROUNDS : rounds;
    passwordHash = await bcrypt.hash(plainPassword, normalizedRounds);
  }

  const now = new Date();
  await usersCollection.insertOne({
    username,
    passwordHash,
    role: adminRole,
    createdAt: now,
    updatedAt: now
  });

  console.log(`[bootstrap] Created default user: ${username}`);
}

function buildBookDocument(book) {
  const now = new Date();
  return {
    title: book.title,
    author: book.author,
    description: book.description,
    isbn: book.isbn,
    genre: book.genre,
    pages: book.pages,
    published_year: book.published_year,
    rating: book.rating,
    created_at: now,
    updated_at: now
  };
}

async function ensureMinimumBooks() {
  const shouldSeed = toBoolean(process.env.AUTO_SEED_BOOKS, true);
  if (!shouldSeed) {
    return;
  }

  const minCount = Number.parseInt(process.env.MIN_BOOKS_COUNT || `${DEFAULT_MIN_BOOKS}`, 10);
  const expectedCount = Number.isNaN(minCount) ? DEFAULT_MIN_BOOKS : minCount;

  const db = getDB();
  const booksCollection = db.collection(BOOKS_COLLECTION_NAME);

  const currentCount = await booksCollection.countDocuments();
  if (currentCount >= expectedCount) {
    return;
  }

  for (const sample of sampleBooks) {
    const query = { isbn: sample.isbn };
    const update = { $setOnInsert: buildBookDocument(sample) };
    await booksCollection.updateOne(query, update, { upsert: true });
  }

  const finalCount = await booksCollection.countDocuments();
  console.log(`[bootstrap] Books in collection: ${finalCount}`);
}

async function runBootstrap() {
  await ensureDefaultAdminUser();
  await ensureMinimumBooks();
}

module.exports = {
  runBootstrap,
  ensureDefaultAdminUser,
  ensureMinimumBooks
};

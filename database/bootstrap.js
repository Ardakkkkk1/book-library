const bcrypt = require('bcryptjs');
const { getDB, BOOKS_COLLECTION_NAME, USERS_COLLECTION_NAME } = require('./connection');
const sampleBooks = require('./sampleBooks');

const DEFAULT_MIN_BOOKS = 20;
const DEFAULT_BCRYPT_ROUNDS = 12;
const SYSTEM_OWNER_USERNAME = 'system';

function toBoolean(value, fallback) {
  if (value === undefined) {
    return fallback;
  }

  if (typeof value === 'string') {
    return !['0', 'false', 'no', 'off'].includes(value.toLowerCase());
  }

  return Boolean(value);
}

function resolveBcryptRounds() {
  const rounds = Number.parseInt(process.env.BCRYPT_ROUNDS || `${DEFAULT_BCRYPT_ROUNDS}`, 10);
  if (Number.isNaN(rounds) || rounds < 8 || rounds > 15) {
    return DEFAULT_BCRYPT_ROUNDS;
  }

  return rounds;
}

async function ensureDefaultAdminUser() {
  const db = getDB();
  const usersCollection = db.collection(USERS_COLLECTION_NAME);

  const username = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
  const plainPassword = typeof process.env.ADMIN_PASSWORD === 'string' ? process.env.ADMIN_PASSWORD : '';
  const preHashedPassword = typeof process.env.ADMIN_PASSWORD_HASH === 'string' ? process.env.ADMIN_PASSWORD_HASH.trim() : '';

  if (!username) {
    console.warn('[bootstrap] ADMIN_USERNAME is empty. Skipping admin bootstrap.');
    return null;
  }

  const existingUser = await usersCollection.findOne({ username }, { projection: { _id: 1, username: 1, role: 1 } });
  if (existingUser) {
    if (existingUser.role !== 'admin') {
      await usersCollection.updateOne(
        { _id: existingUser._id },
        { $set: { role: 'admin', updatedAt: new Date() } }
      );
    }

    return {
      _id: existingUser._id,
      username: existingUser.username,
      role: 'admin'
    };
  }

  let passwordHash = '';
  if (preHashedPassword) {
    passwordHash = preHashedPassword;
  } else if (plainPassword) {
    passwordHash = await bcrypt.hash(plainPassword, resolveBcryptRounds());
  } else {
    console.warn('[bootstrap] ADMIN_PASSWORD or ADMIN_PASSWORD_HASH is required to create the first admin user.');
    return null;
  }

  const now = new Date();
  const result = await usersCollection.insertOne({
    username,
    passwordHash,
    role: 'admin',
    createdAt: now,
    updatedAt: now
  });

  console.log(`[bootstrap] Created default admin user: ${username}`);

  return {
    _id: result.insertedId,
    username,
    role: 'admin'
  };
}

function buildBookDocument(book, ownerRef) {
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
    ownerId: ownerRef ? ownerRef._id : null,
    ownerUsername: ownerRef ? ownerRef.username : SYSTEM_OWNER_USERNAME,
    created_at: now,
    updated_at: now
  };
}

async function ensureBookOwnership(ownerRef) {
  const db = getDB();
  const booksCollection = db.collection(BOOKS_COLLECTION_NAME);

  const update = ownerRef
    ? {
      $set: {
        ownerId: ownerRef._id,
        ownerUsername: ownerRef.username,
        updated_at: new Date()
      }
    }
    : {
      $set: {
        ownerId: null,
        ownerUsername: SYSTEM_OWNER_USERNAME,
        updated_at: new Date()
      }
    };

  await booksCollection.updateMany(
    {
      $or: [
        { ownerId: { $exists: false } },
        { ownerId: null },
        { ownerUsername: { $exists: false } },
        { ownerUsername: '' }
      ]
    },
    update
  );
}

async function ensureMinimumBooks(ownerRef) {
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
    const update = { $setOnInsert: buildBookDocument(sample, ownerRef) };
    await booksCollection.updateOne(query, update, { upsert: true });
  }

  const finalCount = await booksCollection.countDocuments();
  console.log(`[bootstrap] Books in collection: ${finalCount}`);
}

async function runBootstrap() {
  const adminUser = await ensureDefaultAdminUser();
  await ensureBookOwnership(adminUser);
  await ensureMinimumBooks(adminUser);
}

module.exports = {
  runBootstrap,
  ensureDefaultAdminUser,
  ensureMinimumBooks
};

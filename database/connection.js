const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'book_library';
const BOOKS_COLLECTION_NAME = 'books';
const USERS_COLLECTION_NAME = 'users';
const REVIEWS_COLLECTION_NAME = 'reviews';

let db = null;
let client = null;

async function ensureCollection(dbInstance, name) {
  const existing = await dbInstance.listCollections({ name }).toArray();
  if (existing.length === 0) {
    await dbInstance.createCollection(name);
  }
}

async function ensureIndexes(dbInstance) {
  const books = dbInstance.collection(BOOKS_COLLECTION_NAME);
  await books.createIndex({ title: 1 });
  await books.createIndex({ author: 1 });
  await books.createIndex({ genre: 1 });
  await books.createIndex({ rating: -1 });
  await books.createIndex({ published_year: -1 });
  await books.createIndex({ ownerId: 1, created_at: -1 });
  await books.createIndex({ created_at: -1 });

  const users = dbInstance.collection(USERS_COLLECTION_NAME);
  await users.createIndex({ username: 1 }, { unique: true });
  await users.createIndex({ role: 1 });

  const reviews = dbInstance.collection(REVIEWS_COLLECTION_NAME);
  await reviews.createIndex({ bookId: 1, created_at: -1 });
  await reviews.createIndex({ ownerId: 1, created_at: -1 });
  await reviews.createIndex({ rating: -1 });
  await reviews.createIndex({ bookId: 1, ownerId: 1 }, { unique: true });
}

async function connectDB() {
  try {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    db = client.db(DB_NAME);

    await ensureCollection(db, BOOKS_COLLECTION_NAME);
    await ensureCollection(db, USERS_COLLECTION_NAME);
    await ensureCollection(db, REVIEWS_COLLECTION_NAME);
    await ensureIndexes(db);

    console.log('Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

function getDB() {
  if (!db) {
    throw new Error('Database not connected');
  }
  return db;
}

async function closeDB() {
  if (client) {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

function isValidObjectId(id) {
  try {
    return ObjectId.isValid(id);
  } catch {
    return false;
  }
}

function getObjectId(id) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

module.exports = {
  connectDB,
  getDB,
  closeDB,
  isValidObjectId,
  getObjectId,
  BOOKS_COLLECTION_NAME,
  USERS_COLLECTION_NAME,
  REVIEWS_COLLECTION_NAME,
  COLLECTION_NAME: BOOKS_COLLECTION_NAME
};

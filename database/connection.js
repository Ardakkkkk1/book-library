const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = 'book_library';
const COLLECTION_NAME = 'books';

let db = null;
let client = null;

async function connectDB() {
  try {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('✓ Connected to MongoDB');
    db = client.db(DB_NAME);
    
    // Create collection if it doesn't exist
    const collections = await db.listCollections().toArray();
    const collectionExists = collections.some(col => col.name === COLLECTION_NAME);
    
    if (!collectionExists) {
      await db.createCollection(COLLECTION_NAME);
      // Create indexes
      await db.collection(COLLECTION_NAME).createIndex({ title: 1 });
      await db.collection(COLLECTION_NAME).createIndex({ author: 1 });
      await db.collection(COLLECTION_NAME).createIndex({ genre: 1 });
      console.log(`✓ Created collection '${COLLECTION_NAME}' with indexes`);
    }
    
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
  COLLECTION_NAME
};

const {
  getDB,
  BOOKS_COLLECTION_NAME,
  REVIEWS_COLLECTION_NAME,
  isValidObjectId,
  getObjectId
} = require('../database/connection');
const { parsePagination, buildPaginationMeta } = require('../models/pagination');
const {
  validateBookPayload,
  buildBooksListQuery,
  buildBookInsertDocument,
  canManageBook,
  toBookResponse
} = require('../models/bookModel');

function getSessionUser(req) {
  return req.session && req.session.user ? req.session.user : null;
}

async function listBooks(req, res, next) {
  try {
    const sessionUser = getSessionUser(req);
    const { errors, filter, sort, projection } = buildBooksListQuery(req.query);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors[0]
      });
    }

    if (String(req.query.mine || '').toLowerCase() === 'true') {
      if (!sessionUser) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required for mine=true'
        });
      }
      filter.ownerId = getObjectId(sessionUser.id);
    }

    const pagination = parsePagination(req.query, { defaultLimit: 10, maxLimit: 100 });
    const db = getDB();
    const collection = db.collection(BOOKS_COLLECTION_NAME);

    const totalItems = await collection.countDocuments(filter);
    const cursor = collection.find(filter).sort(sort).skip(pagination.skip).limit(pagination.limit);
    if (projection) {
      cursor.project(projection);
    }
    const books = await cursor.toArray();

    return res.status(200).json({
      success: true,
      data: books.map((book) => toBookResponse(book, sessionUser)),
      meta: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        totalItems
      })
    });
  } catch (error) {
    return next(error);
  }
}

async function getBookById(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid book ID format'
      });
    }

    const sessionUser = getSessionUser(req);
    const db = getDB();
    const collection = db.collection(BOOKS_COLLECTION_NAME);
    const book = await collection.findOne({ _id: getObjectId(id) });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: toBookResponse(book, sessionUser)
    });
  } catch (error) {
    return next(error);
  }
}

async function createBook(req, res, next) {
  try {
    const { errors, data } = validateBookPayload(req.body, { partial: false });
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors[0]
      });
    }

    const sessionUser = getSessionUser(req);
    const db = getDB();
    const collection = db.collection(BOOKS_COLLECTION_NAME);
    const document = buildBookInsertDocument(data, sessionUser);
    const result = await collection.insertOne(document);
    const created = {
      ...document,
      _id: result.insertedId
    };

    return res.status(201).json({
      success: true,
      message: 'Book created successfully',
      data: toBookResponse(created, sessionUser)
    });
  } catch (error) {
    return next(error);
  }
}

async function updateBook(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid book ID format'
      });
    }

    const sessionUser = getSessionUser(req);
    const { errors, data } = validateBookPayload(req.body, { partial: true });
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors[0]
      });
    }

    const db = getDB();
    const collection = db.collection(BOOKS_COLLECTION_NAME);
    const objectId = getObjectId(id);
    const existingBook = await collection.findOne({ _id: objectId });

    if (!existingBook) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    if (!canManageBook(existingBook, sessionUser)) {
      return res.status(403).json({
        success: false,
        message: 'You can modify only your own books'
      });
    }

    data.updated_at = new Date();
    await collection.updateOne({ _id: objectId }, { $set: data });
    const updatedBook = await collection.findOne({ _id: objectId });

    return res.status(200).json({
      success: true,
      message: 'Book updated successfully',
      data: toBookResponse(updatedBook, sessionUser)
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteBook(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid book ID format'
      });
    }

    const sessionUser = getSessionUser(req);
    const db = getDB();
    const booksCollection = db.collection(BOOKS_COLLECTION_NAME);
    const reviewsCollection = db.collection(REVIEWS_COLLECTION_NAME);
    const objectId = getObjectId(id);

    const existingBook = await booksCollection.findOne({ _id: objectId });
    if (!existingBook) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    if (!canManageBook(existingBook, sessionUser)) {
      return res.status(403).json({
        success: false,
        message: 'You can delete only your own books'
      });
    }

    await booksCollection.deleteOne({ _id: objectId });
    const deletedReviews = await reviewsCollection.deleteMany({ bookId: objectId });

    return res.status(200).json({
      success: true,
      message: 'Book deleted successfully',
      data: {
        deletedReviewsCount: deletedReviews.deletedCount
      }
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook
};

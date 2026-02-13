const {
  getDB,
  BOOKS_COLLECTION_NAME,
  REVIEWS_COLLECTION_NAME,
  isValidObjectId,
  getObjectId
} = require('../database/connection');
const { parsePagination, buildPaginationMeta } = require('../models/pagination');
const {
  validateReviewPayload,
  buildReviewsListQuery,
  buildReviewInsertDocument,
  canManageReview,
  toReviewResponse
} = require('../models/reviewModel');

function getSessionUser(req) {
  return req.session && req.session.user ? req.session.user : null;
}

async function withBookTitles(db, reviews) {
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return [];
  }

  const bookIds = Array.from(
    new Set(
      reviews
        .map((review) => (review.bookId ? review.bookId.toString() : ''))
        .filter((id) => id.length > 0)
    )
  )
    .map((id) => getObjectId(id))
    .filter(Boolean);

  if (bookIds.length === 0) {
    return reviews;
  }

  const books = await db
    .collection(BOOKS_COLLECTION_NAME)
    .find({ _id: { $in: bookIds } }, { projection: { title: 1 } })
    .toArray();

  const titleByBookId = new Map(books.map((book) => [book._id.toString(), book.title]));
  return reviews.map((review) => ({
    ...review,
    bookTitle: review.bookId ? titleByBookId.get(review.bookId.toString()) || null : null
  }));
}

async function listReviews(req, res, next) {
  try {
    const sessionUser = getSessionUser(req);
    const { errors, filter, sort } = buildReviewsListQuery(req.query);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors[0]
      });
    }

    const pagination = parsePagination(req.query, { defaultLimit: 10, maxLimit: 100 });
    const db = getDB();
    const reviewsCollection = db.collection(REVIEWS_COLLECTION_NAME);

    const totalItems = await reviewsCollection.countDocuments(filter);
    const reviews = await reviewsCollection
      .find(filter)
      .sort(sort)
      .skip(pagination.skip)
      .limit(pagination.limit)
      .toArray();

    const enriched = await withBookTitles(db, reviews);
    return res.status(200).json({
      success: true,
      data: enriched.map((review) => toReviewResponse(review, sessionUser)),
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

async function getReviewById(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID format'
      });
    }

    const sessionUser = getSessionUser(req);
    const db = getDB();
    const reviewsCollection = db.collection(REVIEWS_COLLECTION_NAME);
    const review = await reviewsCollection.findOne({ _id: getObjectId(id) });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    const [enriched] = await withBookTitles(db, [review]);
    return res.status(200).json({
      success: true,
      data: toReviewResponse(enriched, sessionUser)
    });
  } catch (error) {
    return next(error);
  }
}

async function createReview(req, res, next) {
  try {
    const { errors, data } = validateReviewPayload(req.body, { partial: false });
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors[0]
      });
    }

    const sessionUser = getSessionUser(req);
    const db = getDB();
    const booksCollection = db.collection(BOOKS_COLLECTION_NAME);
    const reviewsCollection = db.collection(REVIEWS_COLLECTION_NAME);
    const book = await booksCollection.findOne(
      { _id: data.bookId },
      { projection: { _id: 1, title: 1 } }
    );

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    const document = buildReviewInsertDocument(data, sessionUser);

    try {
      const result = await reviewsCollection.insertOne(document);
      const created = {
        ...document,
        _id: result.insertedId,
        bookTitle: book.title
      };

      return res.status(201).json({
        success: true,
        message: 'Review created successfully',
        data: toReviewResponse(created, sessionUser)
      });
    } catch (dbError) {
      if (dbError && dbError.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'You already reviewed this book'
        });
      }
      throw dbError;
    }
  } catch (error) {
    return next(error);
  }
}

async function updateReview(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID format'
      });
    }

    const sessionUser = getSessionUser(req);
    const { errors, data } = validateReviewPayload(req.body, { partial: true });
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors[0]
      });
    }

    const db = getDB();
    const reviewsCollection = db.collection(REVIEWS_COLLECTION_NAME);
    const objectId = getObjectId(id);
    const existingReview = await reviewsCollection.findOne({ _id: objectId });

    if (!existingReview) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (!canManageReview(existingReview, sessionUser)) {
      return res.status(403).json({
        success: false,
        message: 'You can modify only your own reviews'
      });
    }

    const updateData = {
      ...data,
      updated_at: new Date()
    };
    delete updateData.bookId;

    await reviewsCollection.updateOne({ _id: objectId }, { $set: updateData });
    const updated = await reviewsCollection.findOne({ _id: objectId });
    const [enriched] = await withBookTitles(db, [updated]);

    return res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: toReviewResponse(enriched, sessionUser)
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteReview(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID format'
      });
    }

    const sessionUser = getSessionUser(req);
    const db = getDB();
    const reviewsCollection = db.collection(REVIEWS_COLLECTION_NAME);
    const objectId = getObjectId(id);
    const review = await reviewsCollection.findOne({ _id: objectId });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (!canManageReview(review, sessionUser)) {
      return res.status(403).json({
        success: false,
        message: 'You can delete only your own reviews'
      });
    }

    await reviewsCollection.deleteOne({ _id: objectId });
    return res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview
};

const express = require('express');
const router = express.Router();
const {
  getDB,
  isValidObjectId,
  getObjectId,
  BOOKS_COLLECTION_NAME
} = require('../database/connection');
const { requireAuth } = require('../middleware/auth');

const ALLOWED_WRITE_FIELDS = [
  'title',
  'author',
  'description',
  'isbn',
  'genre',
  'pages',
  'published_year',
  'rating'
];

const ALLOWED_SORT_FIELDS = new Set([
  '_id',
  'title',
  'author',
  'genre',
  'pages',
  'published_year',
  'rating',
  'created_at',
  'updated_at'
]);

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseIntegerField(value, fieldName, min, max, errors) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < min || parsed > max) {
    errors.push(`${fieldName} must be between ${min} and ${max}`);
    return null;
  }

  return parsed;
}

function parseFloatField(value, fieldName, min, max, errors) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed) || parsed < min || parsed > max) {
    errors.push(`${fieldName} must be between ${min} and ${max}`);
    return null;
  }

  return parsed;
}

function normalizeString(value, fieldName, { required = false, maxLength = 400 } = {}, errors) {
  if (value === undefined) {
    if (required) {
      errors.push(`${fieldName} is required`);
    }
    return undefined;
  }

  if (value === null) {
    if (required) {
      errors.push(`${fieldName} is required`);
      return undefined;
    }
    return '';
  }

  if (typeof value !== 'string') {
    errors.push(`${fieldName} must be a string`);
    return undefined;
  }

  const trimmed = value.trim();
  if (required && trimmed.length === 0) {
    errors.push(`${fieldName} cannot be empty`);
    return undefined;
  }

  if (trimmed.length > maxLength) {
    errors.push(`${fieldName} is too long (max ${maxLength} chars)`);
    return undefined;
  }

  return trimmed;
}

function validateBookPayload(payload, { partial = false } = {}) {
  const errors = [];
  const data = {};

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {
      errors: ['Request body must be a JSON object'],
      data
    };
  }

  const payloadKeys = Object.keys(payload);
  if (payloadKeys.length === 0) {
    return {
      errors: ['Request body cannot be empty'],
      data
    };
  }

  for (const key of payloadKeys) {
    if (!ALLOWED_WRITE_FIELDS.includes(key)) {
      errors.push(`Field '${key}' is not allowed`);
    }
  }

  const currentYear = new Date().getFullYear();

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'title')) {
    const title = normalizeString(payload.title, 'title', { required: !partial, maxLength: 200 }, errors);
    if (title !== undefined) {
      data.title = title;
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'author')) {
    const author = normalizeString(payload.author, 'author', { required: !partial, maxLength: 200 }, errors);
    if (author !== undefined) {
      data.author = author;
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'description')) {
    const description = normalizeString(payload.description, 'description', { maxLength: 1500 }, errors);
    if (description !== undefined) {
      data.description = description;
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'isbn')) {
    const isbn = normalizeString(payload.isbn, 'isbn', { maxLength: 40 }, errors);
    if (isbn !== undefined) {
      data.isbn = isbn;
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'genre')) {
    const genre = normalizeString(payload.genre, 'genre', { maxLength: 100 }, errors);
    if (genre !== undefined) {
      data.genre = genre;
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'pages')) {
    data.pages = parseIntegerField(payload.pages, 'pages', 1, 10000, errors);
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'published_year')) {
    data.published_year = parseIntegerField(payload.published_year, 'published_year', 1000, currentYear, errors);
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'rating')) {
    data.rating = parseFloatField(payload.rating, 'rating', 0, 10, errors);
  }

  if (!partial) {
    if (data.description === undefined) {
      data.description = '';
    }
    if (data.isbn === undefined) {
      data.isbn = '';
    }
    if (data.genre === undefined) {
      data.genre = '';
    }
    if (data.pages === undefined) {
      data.pages = null;
    }
    if (data.published_year === undefined) {
      data.published_year = null;
    }
    if (data.rating === undefined || data.rating === null) {
      data.rating = 0;
    }
  }

  if (partial) {
    const hasUpdatableField = ALLOWED_WRITE_FIELDS.some((field) => Object.prototype.hasOwnProperty.call(payload, field));
    if (!hasUpdatableField) {
      errors.push('No valid fields provided for update');
    }
  }

  return { errors, data };
}

// GET /api/books - Get all books (supports filtering, sorting, projection)
router.get('/', async (req, res, next) => {
  try {
    const db = getDB();
    const collection = db.collection(BOOKS_COLLECTION_NAME);

    const filter = {};

    if (req.query.author) {
      const safeValue = escapeRegex(String(req.query.author).trim());
      filter.author = { $regex: safeValue, $options: 'i' };
    }

    if (req.query.genre) {
      const safeValue = escapeRegex(String(req.query.genre).trim());
      filter.genre = { $regex: safeValue, $options: 'i' };
    }

    if (req.query.title) {
      const safeValue = escapeRegex(String(req.query.title).trim());
      filter.title = { $regex: safeValue, $options: 'i' };
    }

    if (req.query.minRating !== undefined) {
      const minRating = Number.parseFloat(req.query.minRating);
      if (Number.isNaN(minRating) || minRating < 0 || minRating > 10) {
        return res.status(400).json({
          success: false,
          message: 'minRating must be a number between 0 and 10'
        });
      }
      filter.rating = { $gte: minRating };
    }

    const sort = { created_at: -1 };
    if (req.query.sortBy) {
      const sortField = String(req.query.sortBy).trim();
      if (!ALLOWED_SORT_FIELDS.has(sortField)) {
        return res.status(400).json({
          success: false,
          message: `sortBy must be one of: ${Array.from(ALLOWED_SORT_FIELDS).join(', ')}`
        });
      }

      const sortOrder = String(req.query.sortOrder || 'asc').toLowerCase() === 'desc' ? -1 : 1;
      sort[sortField] = sortOrder;
    }

    let projection = undefined;
    if (req.query.fields) {
      const requestedFields = String(req.query.fields)
        .split(',')
        .map((field) => field.trim())
        .filter((field) => field.length > 0);

      const validFields = requestedFields.filter(
        (field) => field === '_id' || ALLOWED_WRITE_FIELDS.includes(field) || field === 'created_at' || field === 'updated_at'
      );

      if (validFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields requested'
        });
      }

      projection = {};
      for (const field of validFields) {
        projection[field] = 1;
      }
    }

    const cursor = collection.find(filter).sort(sort);
    if (projection) {
      cursor.project(projection);
    }

    const books = await cursor.toArray();

    return res.status(200).json({
      success: true,
      count: books.length,
      data: books
    });
  } catch (error) {
    return next(error);
  }
});

// GET /api/books/:id - Get one book by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid book ID format'
      });
    }

    const db = getDB();
    const collection = db.collection(BOOKS_COLLECTION_NAME);
    const objectId = getObjectId(id);

    const book = await collection.findOne({ _id: objectId });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: book
    });
  } catch (error) {
    return next(error);
  }
});

// POST /api/books - Create a new book (protected)
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { data, errors } = validateBookPayload(req.body, { partial: false });
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors[0]
      });
    }

    const db = getDB();
    const collection = db.collection(BOOKS_COLLECTION_NAME);

    const now = new Date();
    const newBook = {
      ...data,
      created_at: now,
      updated_at: now
    };

    const result = await collection.insertOne(newBook);

    return res.status(201).json({
      success: true,
      message: 'Book created successfully',
      data: {
        _id: result.insertedId,
        ...newBook
      }
    });
  } catch (error) {
    return next(error);
  }
});

// PUT /api/books/:id - Update a book (protected)
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid book ID format'
      });
    }

    const { data, errors } = validateBookPayload(req.body, { partial: true });
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors[0]
      });
    }

    data.updated_at = new Date();

    const db = getDB();
    const collection = db.collection(BOOKS_COLLECTION_NAME);
    const objectId = getObjectId(id);

    const result = await collection.findOneAndUpdate(
      { _id: objectId },
      { $set: data },
      { returnDocument: 'after' }
    );

    const updatedBook = result && result.value !== undefined ? result.value : result;
    if (!updatedBook) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Book updated successfully',
      data: updatedBook
    });
  } catch (error) {
    return next(error);
  }
});

// DELETE /api/books/:id - Delete a book (protected)
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid book ID format'
      });
    }

    const db = getDB();
    const collection = db.collection(BOOKS_COLLECTION_NAME);
    const objectId = getObjectId(id);

    const result = await collection.deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Book deleted successfully'
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

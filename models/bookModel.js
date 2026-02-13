const { isValidObjectId, getObjectId } = require('../database/connection');
const { hasAdminRole, isOwner } = require('./userModel');

const ALLOWED_BOOK_WRITE_FIELDS = [
  'title',
  'author',
  'description',
  'isbn',
  'genre',
  'pages',
  'published_year',
  'rating'
];

const ALLOWED_BOOK_SORT_FIELDS = new Set([
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

const ALLOWED_BOOK_RESPONSE_FIELDS = new Set([
  '_id',
  'title',
  'author',
  'description',
  'isbn',
  'genre',
  'pages',
  'published_year',
  'rating',
  'ownerId',
  'ownerUsername',
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

  const parsed = Number.parseInt(`${value}`, 10);
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

  const parsed = Number.parseFloat(`${value}`);
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
    if (!ALLOWED_BOOK_WRITE_FIELDS.includes(key)) {
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
    const hasUpdatableField = ALLOWED_BOOK_WRITE_FIELDS.some((field) => Object.prototype.hasOwnProperty.call(payload, field));
    if (!hasUpdatableField) {
      errors.push('No valid fields provided for update');
    }
  }

  return { errors, data };
}

function buildBooksListQuery(query) {
  const errors = [];
  const filter = {};

  if (query.author) {
    const safeValue = escapeRegex(String(query.author).trim());
    filter.author = { $regex: safeValue, $options: 'i' };
  }

  if (query.genre) {
    const safeValue = escapeRegex(String(query.genre).trim());
    filter.genre = { $regex: safeValue, $options: 'i' };
  }

  if (query.title) {
    const safeValue = escapeRegex(String(query.title).trim());
    filter.title = { $regex: safeValue, $options: 'i' };
  }

  if (query.ownerId !== undefined) {
    const ownerId = String(query.ownerId).trim();
    if (!isValidObjectId(ownerId)) {
      errors.push('ownerId must be a valid ObjectId');
    } else {
      filter.ownerId = getObjectId(ownerId);
    }
  }

  if (query.minRating !== undefined) {
    const minRating = Number.parseFloat(`${query.minRating}`);
    if (Number.isNaN(minRating) || minRating < 0 || minRating > 10) {
      errors.push('minRating must be a number between 0 and 10');
    } else {
      filter.rating = { $gte: minRating };
    }
  }

  const sort = { created_at: -1 };
  if (query.sortBy) {
    const sortField = String(query.sortBy).trim();
    if (!ALLOWED_BOOK_SORT_FIELDS.has(sortField)) {
      errors.push(`sortBy must be one of: ${Array.from(ALLOWED_BOOK_SORT_FIELDS).join(', ')}`);
    } else {
      const sortOrder = String(query.sortOrder || 'asc').toLowerCase() === 'desc' ? -1 : 1;
      sort[sortField] = sortOrder;
    }
  }

  let projection = undefined;
  if (query.fields) {
    const requestedFields = String(query.fields)
      .split(',')
      .map((field) => field.trim())
      .filter((field) => field.length > 0);

    const validFields = requestedFields.filter((field) => ALLOWED_BOOK_RESPONSE_FIELDS.has(field));

    if (validFields.length === 0) {
      errors.push('No valid fields requested');
    } else {
      projection = {};
      for (const field of validFields) {
        projection[field] = 1;
      }
    }
  }

  return {
    errors,
    filter,
    sort,
    projection
  };
}

function buildBookInsertDocument(data, sessionUser) {
  const now = new Date();
  return {
    ...data,
    ownerId: getObjectId(sessionUser.id),
    ownerUsername: sessionUser.username,
    created_at: now,
    updated_at: now
  };
}

function canManageBook(book, sessionUser) {
  return hasAdminRole(sessionUser) || isOwner(book.ownerId, sessionUser);
}

function toBookResponse(book, sessionUser) {
  const ownerId = book.ownerId ? book.ownerId.toString() : null;
  const owner = {
    id: ownerId,
    username: book.ownerUsername || 'unknown'
  };
  const canManage = canManageBook(book, sessionUser);

  return {
    _id: book._id ? book._id.toString() : '',
    title: book.title || '',
    author: book.author || '',
    description: book.description || '',
    isbn: book.isbn || '',
    genre: book.genre || '',
    pages: book.pages ?? null,
    published_year: book.published_year ?? null,
    rating: book.rating ?? 0,
    owner,
    created_at: book.created_at || null,
    updated_at: book.updated_at || null,
    permissions: {
      canEdit: canManage,
      canDelete: canManage,
      isOwner: isOwner(book.ownerId, sessionUser)
    }
  };
}

module.exports = {
  validateBookPayload,
  buildBooksListQuery,
  buildBookInsertDocument,
  canManageBook,
  toBookResponse
};

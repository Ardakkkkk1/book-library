const { isValidObjectId, getObjectId } = require('../database/connection');
const { hasAdminRole, isOwner } = require('./userModel');

const ALLOWED_REVIEW_WRITE_FIELDS = ['bookId', 'rating', 'comment'];
const ALLOWED_REVIEW_SORT_FIELDS = new Set(['_id', 'rating', 'created_at', 'updated_at']);

function normalizeString(value, fieldName, { required = false, maxLength = 1000 } = {}, errors) {
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

function parseRating(value, errors) {
  if (value === null || value === undefined || value === '') {
    errors.push('rating is required');
    return null;
  }

  const parsed = Number.parseFloat(`${value}`);
  if (Number.isNaN(parsed) || parsed < 1 || parsed > 5) {
    errors.push('rating must be a number between 1 and 5');
    return null;
  }

  return Math.round(parsed * 10) / 10;
}

function validateReviewPayload(payload, { partial = false } = {}) {
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
    if (!ALLOWED_REVIEW_WRITE_FIELDS.includes(key)) {
      errors.push(`Field '${key}' is not allowed`);
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'bookId')) {
    if (partial && Object.prototype.hasOwnProperty.call(payload, 'bookId')) {
      errors.push('bookId cannot be updated');
    }

    const bookId = payload.bookId === undefined ? undefined : String(payload.bookId).trim();
    if (!partial && !bookId) {
      errors.push('bookId is required');
    } else if (bookId && !isValidObjectId(bookId)) {
      errors.push('bookId must be a valid ObjectId');
    } else if (bookId) {
      data.bookId = getObjectId(bookId);
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'rating')) {
    const ratingErrors = [];
    const rating = parseRating(payload.rating, ratingErrors);
    if (ratingErrors.length > 0) {
      errors.push(...ratingErrors);
    } else {
      data.rating = rating;
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'comment')) {
    const comment = normalizeString(payload.comment, 'comment', { required: !partial, maxLength: 1000 }, errors);
    if (comment !== undefined) {
      data.comment = comment;
    }
  }

  if (partial) {
    const hasUpdatableField = ['rating', 'comment'].some((field) => Object.prototype.hasOwnProperty.call(payload, field));
    if (!hasUpdatableField) {
      errors.push('No valid fields provided for update');
    }
  }

  return { errors, data };
}

function buildReviewsListQuery(query) {
  const errors = [];
  const filter = {};

  if (query.bookId !== undefined) {
    const bookId = String(query.bookId).trim();
    if (!isValidObjectId(bookId)) {
      errors.push('bookId must be a valid ObjectId');
    } else {
      filter.bookId = getObjectId(bookId);
    }
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
    if (Number.isNaN(minRating) || minRating < 1 || minRating > 5) {
      errors.push('minRating must be a number between 1 and 5');
    } else {
      filter.rating = { $gte: minRating };
    }
  }

  const sort = { created_at: -1 };
  if (query.sortBy) {
    const sortBy = String(query.sortBy).trim();
    if (!ALLOWED_REVIEW_SORT_FIELDS.has(sortBy)) {
      errors.push(`sortBy must be one of: ${Array.from(ALLOWED_REVIEW_SORT_FIELDS).join(', ')}`);
    } else {
      const sortOrder = String(query.sortOrder || 'desc').toLowerCase() === 'asc' ? 1 : -1;
      sort[sortBy] = sortOrder;
    }
  }

  return {
    errors,
    filter,
    sort
  };
}

function buildReviewInsertDocument(data, sessionUser) {
  const now = new Date();
  return {
    ...data,
    ownerId: getObjectId(sessionUser.id),
    ownerUsername: sessionUser.username,
    created_at: now,
    updated_at: now
  };
}

function canManageReview(review, sessionUser) {
  return hasAdminRole(sessionUser) || isOwner(review.ownerId, sessionUser);
}

function toReviewResponse(review, sessionUser) {
  const ownerId = review.ownerId ? review.ownerId.toString() : null;
  const canManage = canManageReview(review, sessionUser);

  return {
    _id: review._id ? review._id.toString() : '',
    bookId: review.bookId ? review.bookId.toString() : '',
    bookTitle: review.bookTitle || null,
    rating: review.rating ?? null,
    comment: review.comment || '',
    owner: {
      id: ownerId,
      username: review.ownerUsername || 'unknown'
    },
    created_at: review.created_at || null,
    updated_at: review.updated_at || null,
    permissions: {
      canEdit: canManage,
      canDelete: canManage,
      isOwner: isOwner(review.ownerId, sessionUser)
    }
  };
}

module.exports = {
  validateReviewPayload,
  buildReviewsListQuery,
  buildReviewInsertDocument,
  canManageReview,
  toReviewResponse
};

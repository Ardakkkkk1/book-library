const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(`${value}`, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function parsePagination(query, options = {}) {
  const page = parsePositiveInteger(query.page, DEFAULT_PAGE);
  const requestedLimit = parsePositiveInteger(query.limit, options.defaultLimit || DEFAULT_LIMIT);
  const maxLimit = options.maxLimit || MAX_LIMIT;
  const limit = Math.min(requestedLimit, maxLimit);
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip
  };
}

function buildPaginationMeta({ page, limit, totalItems }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));

  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages
  };
}

module.exports = {
  parsePagination,
  buildPaginationMeta
};

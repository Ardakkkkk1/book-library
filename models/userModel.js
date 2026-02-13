const { USERS_COLLECTION_NAME } = require('../database/connection');

const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 40;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const VALID_ROLES = new Set(['user', 'admin']);
const USERNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;

function getUsersCollection(db) {
  return db.collection(USERS_COLLECTION_NAME);
}

function normalizeUsername(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().toLowerCase();
}

function normalizeRole(value, fallback = 'user') {
  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  return VALID_ROLES.has(normalized) ? normalized : fallback;
}

function validateRegistrationPayload(payload) {
  const errors = [];
  const data = {
    username: '',
    password: ''
  };

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {
      errors: ['Request body must be a JSON object'],
      data
    };
  }

  const username = normalizeUsername(payload.username);
  const password = typeof payload.password === 'string' ? payload.password : '';

  if (username.length < MIN_USERNAME_LENGTH || username.length > MAX_USERNAME_LENGTH) {
    errors.push(`Username must be between ${MIN_USERNAME_LENGTH} and ${MAX_USERNAME_LENGTH} characters`);
  }

  if (!USERNAME_PATTERN.test(username)) {
    errors.push('Username may contain only letters, numbers, dot, underscore, and hyphen');
  }

  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    errors.push(`Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters`);
  }

  data.username = username;
  data.password = password;

  return { errors, data };
}

function toPublicUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user._id ? user._id.toString() : '',
    username: user.username,
    role: normalizeRole(user.role),
    createdAt: user.createdAt || null,
    updatedAt: user.updatedAt || null
  };
}

function toSessionUser(user) {
  const publicUser = toPublicUser(user);
  if (!publicUser) {
    return null;
  }

  return {
    id: publicUser.id,
    username: publicUser.username,
    role: publicUser.role
  };
}

function hasAdminRole(user) {
  return Boolean(user && normalizeRole(user.role) === 'admin');
}

function isOwner(ownerId, user) {
  if (!ownerId || !user || !user.id) {
    return false;
  }

  return ownerId.toString() === user.id.toString();
}

module.exports = {
  getUsersCollection,
  normalizeUsername,
  normalizeRole,
  validateRegistrationPayload,
  toPublicUser,
  toSessionUser,
  hasAdminRole,
  isOwner,
  VALID_ROLES
};

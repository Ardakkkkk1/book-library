const bcrypt = require('bcryptjs');

const { getDB } = require('../database/connection');
const { SESSION_COOKIE_NAME } = require('../config/session');
const { parsePagination, buildPaginationMeta } = require('../models/pagination');
const {
  getUsersCollection,
  normalizeUsername,
  validateRegistrationPayload,
  toPublicUser,
  toSessionUser
} = require('../models/userModel');

const DEFAULT_BCRYPT_ROUNDS = 12;

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function resolveBcryptRounds() {
  const parsed = Number.parseInt(process.env.BCRYPT_ROUNDS || `${DEFAULT_BCRYPT_ROUNDS}`, 10);
  if (Number.isNaN(parsed) || parsed < 8 || parsed > 15) {
    return DEFAULT_BCRYPT_ROUNDS;
  }

  return parsed;
}

function invalidCredentialsResponse(res) {
  return res.status(401).json({
    success: false,
    message: 'Invalid credentials'
  });
}

function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

function destroySession(req) {
  return new Promise((resolve, reject) => {
    req.session.destroy((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

async function register(req, res, next) {
  try {
    const { errors, data } = validateRegistrationPayload(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors[0]
      });
    }

    const db = getDB();
    const usersCollection = getUsersCollection(db);

    const existingUser = await usersCollection.findOne({ username: data.username });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Username is already taken'
      });
    }

    const passwordHash = await bcrypt.hash(data.password, resolveBcryptRounds());
    const now = new Date();
    const userDocument = {
      username: data.username,
      passwordHash,
      role: 'user',
      createdAt: now,
      updatedAt: now
    };

    const result = await usersCollection.insertOne(userDocument);
    const createdUser = {
      ...userDocument,
      _id: result.insertedId
    };

    await regenerateSession(req);
    req.session.user = toSessionUser(createdUser);
    await saveSession(req);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: toPublicUser(createdUser)
      }
    });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const username = normalizeUsername(req.body?.username);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    const db = getDB();
    const usersCollection = getUsersCollection(db);
    const user = await usersCollection.findOne({ username });

    if (!user || !user.passwordHash) {
      return invalidCredentialsResponse(res);
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return invalidCredentialsResponse(res);
    }

    await regenerateSession(req);
    req.session.user = toSessionUser(user);
    await saveSession(req);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: toPublicUser(user)
      }
    });
  } catch (error) {
    return next(error);
  }
}

async function logout(req, res, next) {
  try {
    if (req.session) {
      await destroySession(req);
    }

    res.clearCookie(SESSION_COOKIE_NAME);
    return res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    return next(error);
  }
}

function me(req, res) {
  if (!req.session || !req.session.user) {
    return res.status(200).json({
      success: true,
      data: {
        authenticated: false,
        user: null
      }
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      authenticated: true,
      user: req.session.user
    }
  });
}

async function listUsers(req, res, next) {
  try {
    const db = getDB();
    const usersCollection = getUsersCollection(db);
    const pagination = parsePagination(req.query, { defaultLimit: 10, maxLimit: 100 });

    const filter = {};
    if (req.query.username) {
      const safeValue = escapeRegex(String(req.query.username).trim());
      filter.username = { $regex: safeValue, $options: 'i' };
    }

    const totalItems = await usersCollection.countDocuments(filter);
    const users = await usersCollection
      .find(filter, {
        projection: {
          username: 1,
          role: 1,
          createdAt: 1,
          updatedAt: 1
        }
      })
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .toArray();

    return res.status(200).json({
      success: true,
      data: users.map((user) => toPublicUser(user)),
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

module.exports = {
  register,
  login,
  logout,
  me,
  listUsers
};

const express = require('express');
const bcrypt = require('bcryptjs');
const { getDB, USERS_COLLECTION_NAME } = require('../database/connection');
const { SESSION_COOKIE_NAME } = require('../config/session');

const router = express.Router();

function normalizeUsername(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().toLowerCase();
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

router.post('/login', async (req, res, next) => {
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
    const usersCollection = db.collection(USERS_COLLECTION_NAME);
    const user = await usersCollection.findOne({ username });

    if (!user || !user.passwordHash) {
      return invalidCredentialsResponse(res);
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return invalidCredentialsResponse(res);
    }

    await regenerateSession(req);
    req.session.user = {
      id: user._id.toString(),
      username: user.username,
      role: user.role || 'user'
    };
    await saveSession(req);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: req.session.user
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/logout', async (req, res, next) => {
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
});

router.get('/me', (req, res) => {
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
});

module.exports = router;

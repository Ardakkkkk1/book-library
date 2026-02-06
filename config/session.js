const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'book_library_sid';
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-this-session-secret';
const SESSION_MAX_AGE_MS = Number.parseInt(process.env.SESSION_MAX_AGE_MS || `${ONE_DAY_MS}`, 10);

const sessionConfig = {
  name: SESSION_COOKIE_NAME,
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: Number.isNaN(SESSION_MAX_AGE_MS) ? ONE_DAY_MS : SESSION_MAX_AGE_MS
  }
};

module.exports = {
  SESSION_COOKIE_NAME,
  sessionConfig
};

require('dotenv').config({ quiet: true });

const express = require('express');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const { connectDB, closeDB } = require('./database/connection');
const { runBootstrap } = require('./database/bootstrap');
const { sessionConfig } = require('./config/session');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const booksRouter = require('./routes/books');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV === 'production') {
  // Required for secure cookies behind reverse proxies (e.g. Render).
  app.set('trust proxy', 1);
}

// Middleware
app.use(logger);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session(sessionConfig));
app.use(express.static(path.join(__dirname, 'public')));

// Web Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'books.html'));
});

app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/books', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'books.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'about.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'contact.html'));
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/books', booksRouter);

app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API route not found'
  });
});

// Global 404 handler for web routes
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

// Error handling middleware
app.use(errorHandler);

// Start server and connect to MongoDB
async function startServer() {
  try {
    await connectDB();
    await runBootstrap();

    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === 'change-this-session-secret') {
      console.warn('[security] SESSION_SECRET is not configured or uses default value.');
    }

    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
      console.log(`Books API: http://localhost:${PORT}/api/books`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await closeDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await closeDB();
  process.exit(0);
});

startServer();

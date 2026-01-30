const express = require('express');
const path = require('path');
const { connectDB, closeDB } = require('./database/connection');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const booksRouter = require('./routes/books');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(logger);
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/home', (req, res) => {
  res.redirect('/');
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
app.use('/api/books', booksRouter);

// Global 404 handler for routes
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

// Error handling middleware
app.use(errorHandler);

// Start server and connect to MongoDB
async function startServer() {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`\n Server is running at http://localhost:${PORT}`);
      console.log(` API Documentation: http://localhost:${PORT}/api/books\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\nShutting down gracefully...');
  await closeDB();
  process.exit(0);
});

startServer();

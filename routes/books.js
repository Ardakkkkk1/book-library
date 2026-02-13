const express = require('express');
const {
  listBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook
} = require('../controllers/booksController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', listBooks);
router.get('/:id', getBookById);
router.post('/', requireAuth, createBook);
router.put('/:id', requireAuth, updateBook);
router.delete('/:id', requireAuth, deleteBook);

module.exports = router;

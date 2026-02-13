const express = require('express');
const {
  listReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview
} = require('../controllers/reviewsController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', listReviews);
router.get('/:id', getReviewById);
router.post('/', requireAuth, createReview);
router.put('/:id', requireAuth, updateReview);
router.delete('/:id', requireAuth, deleteReview);

module.exports = router;

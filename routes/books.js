const express = require('express');
const router = express.Router();
const { getDB, isValidObjectId, getObjectId, COLLECTION_NAME } = require('../database/connection');

// GET /api/books - Get all books (with filtering, sorting, projection)
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection(COLLECTION_NAME);

    // Build filter
    const filter = {};
    
    if (req.query.author) {
      filter.author = { $regex: req.query.author, $options: 'i' };
    }
    
    if (req.query.genre) {
      filter.genre = { $regex: req.query.genre, $options: 'i' };
    }
    
    if (req.query.minRating) {
      filter.rating = { $gte: parseFloat(req.query.minRating) };
    }
    
    if (req.query.title) {
      filter.title = { $regex: req.query.title, $options: 'i' };
    }

    // Build sort
    const sort = {};
    if (req.query.sortBy) {
      const sortField = req.query.sortBy;
      const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
      sort[sortField] = sortOrder;
    } else {
      sort.created_at = -1;
    }

    // Build projection
    const projection = {};
    if (req.query.fields) {
      const fields = req.query.fields.split(',');
      fields.forEach(field => {
        projection[field.trim()] = 1;
      });
    }

    // Execute query
    const books = await collection
      .find(filter)
      .sort(sort)
      .project(projection.id ? projection : {})
      .toArray();

    res.status(200).json({
      success: true,
      count: books.length,
      data: books
    });
  } catch (error) {
    console.error('GET /api/books error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching books',
      error: error.message
    });
  }
});

// GET /api/books/:id - Get a single book by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid book ID format'
      });
    }

    const db = getDB();
    const collection = db.collection(COLLECTION_NAME);
    const objectId = getObjectId(id);

    const book = await collection.findOne({ _id: objectId });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    res.status(200).json({
      success: true,
      data: book
    });
  } catch (error) {
    console.error('GET /api/books/:id error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching book',
      error: error.message
    });
  }
});

// POST /api/books - Create a new book
router.post('/', async (req, res) => {
  try {
    const { title, author, description, isbn, genre, pages, published_year, rating } = req.body;

    // Validation
    if (!title || !author) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title and author'
      });
    }

    if (title.trim() === '' || author.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Title and author cannot be empty'
      });
    }

    if (rating && (isNaN(rating) || rating < 0 || rating > 10)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be a number between 0 and 10'
      });
    }

    if (pages && (isNaN(pages) || pages < 1)) {
      return res.status(400).json({
        success: false,
        message: 'Pages must be a positive number'
      });
    }

    if (published_year && (isNaN(published_year) || published_year < 1000 || published_year > new Date().getFullYear())) {
      return res.status(400).json({
        success: false,
        message: `Published year must be between 1000 and ${new Date().getFullYear()}`
      });
    }

    const db = getDB();
    const collection = db.collection(COLLECTION_NAME);

    const newBook = {
      title: title.trim(),
      author: author.trim(),
      description: description?.trim() || '',
      isbn: isbn?.trim() || '',
      genre: genre?.trim() || '',
      pages: pages ? parseInt(pages) : null,
      published_year: published_year ? parseInt(published_year) : null,
      rating: rating ? parseFloat(rating) : 0,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await collection.insertOne(newBook);

    res.status(201).json({
      success: true,
      message: 'Book created successfully',
      data: {
        _id: result.insertedId,
        ...newBook
      }
    });
  } catch (error) {
    console.error('POST /api/books error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating book',
      error: error.message
    });
  }
});

// PUT /api/books/:id - Update a book
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid book ID format'
      });
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No update data provided'
      });
    }

    // Validate fields if provided
    if (updateData.title !== undefined && updateData.title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Title cannot be empty'
      });
    }

    if (updateData.author !== undefined && updateData.author.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Author cannot be empty'
      });
    }

    if (updateData.rating !== undefined && (isNaN(updateData.rating) || updateData.rating < 0 || updateData.rating > 10)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be a number between 0 and 10'
      });
    }

    if (updateData.pages !== undefined && (isNaN(updateData.pages) || updateData.pages < 1)) {
      return res.status(400).json({
        success: false,
        message: 'Pages must be a positive number'
      });
    }

    const db = getDB();
    const collection = db.collection(COLLECTION_NAME);
    const objectId = getObjectId(id);

    const dataToUpdate = {};
    Object.keys(updateData).forEach(key => {
      if (typeof updateData[key] === 'string') {
        dataToUpdate[key] = updateData[key].trim();
      } else {
        dataToUpdate[key] = updateData[key];
      }
    });
    dataToUpdate.updated_at = new Date();

    const result = await collection.findOneAndUpdate(
      { _id: objectId },
      { $set: dataToUpdate },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Book updated successfully',
      data: result.value
    });
  } catch (error) {
    console.error('PUT /api/books/:id error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating book',
      error: error.message
    });
  }
});

// DELETE /api/books/:id - Delete a book
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid book ID format'
      });
    }

    const db = getDB();
    const collection = db.collection(COLLECTION_NAME);
    const objectId = getObjectId(id);

    const result = await collection.deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Book deleted successfully'
    });
  } catch (error) {
    console.error('DELETE /api/books/:id error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting book',
      error: error.message
    });
  }
});

module.exports = router;

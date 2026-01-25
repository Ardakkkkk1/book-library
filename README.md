# Book Library - Assignment 3 Part 1 & 2

A production-ready full-stack web application for managing a digital book collection with Node.js, Express, and MongoDB. Includes complete CRUD operations via web interface and REST API.

## 🌐 Live Deployment

**Coming Soon** - Deploy to Render, Railway, or Heroku (see [Deployment Guide](#deployment-guide) below)

## Team Members

| Name | Group | Role |
|------|-------|------|
| Ardak Avissauly | SE-2437 | Full-Stack Developer |
| Islam Imanbayev | SE-2437 | Frontend Developer |

## Project Overview

Book Library is a modern full-stack web application that allows users to:
- **Manage books** via intuitive web interface
- **Create, read, update, delete** books with full validation
- **Filter & sort** books by author, genre, rating, and more
- **View statistics** - total books, average rating, total pages
- **Responsive design** - works on desktop, tablet, and mobile
- **REST API** - all operations available via API endpoints
- **Production-ready** - environment variables, error handling, logging

## Technology Stack

### Backend
- **Runtime:** Node.js v14+
- **Framework:** Express.js
- **Database:** MongoDB (native driver)
- **Middleware:** Custom logger, JSON parser, error handler

### Frontend
- **HTML5, CSS3, JavaScript**
- **Responsive Grid Layout**
- **Fetch API** for async requests
- **Modal dialogs** for editing

### Deployment
- Environment variables (`.env`)
- Process.env.PORT support
- Production-ready error handling

## 📋 Assignment Requirements Met

### ✅ Assignment 3 Part 1 - Backend API
- [x] Node.js + Express with clear folder structure
- [x] Custom logger middleware (HTTP method + URL)
- [x] MongoDB native driver (no Mongoose)
- [x] Automatic collection creation on first insert
- [x] Full CRUD API implementation
- [x] Filtering, sorting, projection support
- [x] Proper validation and HTTP status codes
- [x] Comprehensive README with API docs

### ✅ Assignment 3 Part 2 - Frontend & Deployment
- [x] Production web interface with CRUD functionality
- [x] Data displayed in table format
- [x] Create form with validation
- [x] Update functionality via modal dialog
- [x] Delete with confirmation
- [x] Dynamic data loading from API
- [x] Statistics dashboard (total, average rating, pages)
- [x] Environment variables setup
- [x] GitHub repository with .gitignore
- [x] Deployment-ready application

### ✅ CRUD Implementation
- `GET /api/books` - Retrieve all records with filtering/sorting
- `GET /api/books/:id` - Retrieve single record
- `POST /api/books` - Create new record
- `PUT /api/books/:id` - Update existing record
- `DELETE /api/books/:id` - Delete record

### ✅ Advanced Features
- Query filtering (author, genre, title, rating)
- Result sorting (any field, asc/desc)
- Field projection
- Input validation and sanitization
- Proper HTTP status codes (200, 201, 400, 404, 500)

## 🚀 Deployment Guide

### Option 1: Deploy to Render (Recommended)

**Step 1: Prepare your repository**
```bash
# Make sure you have a GitHub repository
git init
git add .
git commit -m "Initial commit - Book Library App"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/book-library.git
git push -u origin main
```

**Step 2: Create Render account and deploy**
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New+" → "Web Service"
4. Connect your GitHub repository
5. Fill in the settings:
   - **Name:** book-library
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Instance Type:** Free

**Step 3: Add environment variables**
1. Go to "Environment" tab
2. Add these variables:
   ```
   PORT=3000
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/
   NODE_ENV=production
   ```
3. Click "Deploy"

**Step 4: Get your public URL**
Your app will be live at: `https://book-library-xxx.onrender.com`

---

### Option 2: Deploy to Railway.app

**Step 1: Install Railway CLI**
```bash
npm install -g @railway/cli
```

**Step 2: Login and deploy**
```bash
railway login
railway init
railway up
```

**Step 3: Set environment variables**
```bash
railway variables set PORT=3000
railway variables set MONGO_URI="mongodb+srv://username:password@cluster.mongodb.net/"
railway variables set NODE_ENV=production
```

**Step 4: View your app**
```bash
railway open
```

---

### Option 3: Deploy to Heroku

**Step 1: Install Heroku CLI**
```bash
npm install -g heroku
```

**Step 2: Login and create app**
```bash
heroku login
heroku create book-library-YOUR_NAME
```

**Step 3: Add MongoDB (from MongoDB Atlas)**
```bash
heroku config:set MONGO_URI="mongodb+srv://username:password@cluster.mongodb.net/"
heroku config:set NODE_ENV=production
```

**Step 4: Deploy**
```bash
git push heroku main
```

**Step 5: View your app**
```bash
heroku open
```

---

## 🔐 Environment Variables Setup

### Local Development (.env file)

Create `.env` file in root directory:
```env
PORT=3000
MONGO_URI=mongodb://localhost:27017
NODE_ENV=development
```

### Production (Hosting Platform)

Set these variables in your hosting platform's dashboard:

| Variable | Value | Example |
|----------|-------|---------|
| `PORT` | Server port | `3000` |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/` |
| `NODE_ENV` | Environment type | `production` |

**⚠️ Important:** Never push `.env` file to GitHub. It's already in `.gitignore`.

---

## 📦 Local Installation & Setup

### Prerequisites
- Node.js v14 or higher
- MongoDB (local or MongoDB Atlas account)
- npm or yarn

### Step 1: Clone repository
```bash
git clone https://github.com/YOUR_USERNAME/book-library.git
cd book-library
```

### Step 2: Install dependencies
```bash
npm install
```

### Step 3: Create .env file
```bash
cp .env.example .env
```

Edit `.env` with your MongoDB connection string

### Step 4: Start MongoDB
```bash
# If using local MongoDB
mongod

# If using MongoDB Atlas, skip this step
```

### Step 5: Start the server
```bash
# Development with auto-reload
npm run dev

# Or production mode
npm start
```

### Step 6: Open in browser
```
http://localhost:3000
```

---

## 🎯 Project Structure

```
book-library/
├── database/
│   └── connection.js              (MongoDB connection)
├── middleware/
│   ├── logger.js                  (HTTP logging)
│   └── errorHandler.js            (Error handling)
├── routes/
│   └── books.js                   (API endpoints)
├── views/
│   ├── books.html                 (📱 Main app - CRUD UI)
│   ├── index.html                 (Info page)
│   ├── about.html                 (About page)
│   ├── contact.html               (Contact form)
│   └── 404.html                   (Error page)
├── public/
│   └── style.css                  (Shared styles)
├── data/
│   └── messages.json              (Contact messages)
├── .env.example                   (Environment variables template)
├── .gitignore                     (Git ignore list)
├── server.js                      (Express app entry)
├── package.json                   (Dependencies)
└── README.md                      (This file)
```

---

## 🌟 Features

### Web Interface (http://localhost:3000)
- ✅ **Dashboard** - View total books, average rating, total pages
- ✅ **Add Books** - Form to create new books
- ✅ **View Books** - Table with all books
- ✅ **Edit Books** - Modal dialog to update book details
- ✅ **Delete Books** - Remove books with confirmation
- ✅ **Responsive** - Works on desktop, tablet, mobile
- ✅ **Real-time** - Data loads dynamically from API

### REST API (/api/books)
- ✅ GET /api/books - Get all books with filtering/sorting
- ✅ GET /api/books/:id - Get single book
- ✅ POST /api/books - Create new book
- ✅ PUT /api/books/:id - Update book
- ✅ DELETE /api/books/:id - Delete book

### Validation
- ✅ Required fields (title, author)
- ✅ Rating range (0-10)
- ✅ Pages (positive number)
- ✅ Published year (1000 to current year)
- ✅ Empty field checking
- ✅ Type validation

### Security
- ✅ Input sanitization
- ✅ MongoDB injection prevention
- ✅ Environment variables for secrets
- ✅ Error handling
- ✅ Logging

---

## 🗄️ MongoDB Setup

### Option 1: Local MongoDB

**Install MongoDB Community Edition:**

**Windows:**
```bash
# Download installer from https://www.mongodb.com/try/download/community
# Run installer and follow setup
# MongoDB starts automatically

# Verify installation
mongosh
```

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
mongosh
```

**Linux:**
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
mongosh
```

### Option 2: MongoDB Atlas (Cloud)

1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create free account
3. Create cluster (M0 free tier)
4. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/`
5. Add to `.env`:
   ```env
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/
   ```

---

## 📖 API Documentation

### Base URL
```
Local: http://localhost:3000/api/books
Production: https://your-app-url/api/books
```

### 1. Get All Books
**Request:**
```bash
GET /api/books
GET /api/books?author=Tolkien&sortBy=rating&sortOrder=desc
```

**Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "_id": "...",
      "title": "The Hobbit",
      "author": "J.R.R. Tolkien",
      "rating": 4.8,
      ...
    }
  ]
}
```

### 2. Get Single Book
**Request:**
```bash
GET /api/books/607f1f77bcf86cd799439011
```

**Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

### 3. Create Book
**Request:**
```bash
POST /api/books
Content-Type: application/json

{
  "title": "New Book",
  "author": "Author Name",
  "genre": "Fiction",
  "rating": 4.5
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Book created successfully",
  "data": { ... }
}
```

### 4. Update Book
**Request:**
```bash
PUT /api/books/607f1f77bcf86cd799439011
Content-Type: application/json

{
  "rating": 4.9
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Book updated successfully",
  "data": { ... }
}
```

### 5. Delete Book
**Request:**
```bash
DELETE /api/books/607f1f77bcf86cd799439011
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Book deleted successfully"
}
```

### Query Parameters

| Parameter | Example | Description |
|-----------|---------|-------------|
| `author` | `?author=Tolkien` | Filter by author |
| `genre` | `?genre=Fantasy` | Filter by genre |
| `title` | `?title=Hobbit` | Filter by title |
| `minRating` | `?minRating=4.5` | Minimum rating |
| `sortBy` | `?sortBy=rating` | Sort field |
| `sortOrder` | `?sortOrder=desc` | asc or desc |
| `fields` | `?fields=title,author` | Select fields |

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK (GET, PUT, DELETE) |
| 201 | Created (POST) |
| 400 | Bad Request |
| 404 | Not Found |
| 500 | Server Error |

---

## 🧪 Testing the Application

### Test via Web Interface
1. Open http://localhost:3000
2. Fill the form and click "Add Book"
3. View books in the table
4. Click "Edit" to modify a book
5. Click "Delete" to remove a book
6. Check statistics updating in real-time

### Test via API (curl)
```bash
# Get all books
curl http://localhost:3000/api/books

# Create book
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","author":"Author","rating":4.5}'

# Update book
curl -X PUT http://localhost:3000/api/books/ID \
  -H "Content-Type: application/json" \
  -d '{"rating":4.9}'

# Delete book
curl -X DELETE http://localhost:3000/api/books/ID
```

---

## 🐛 Troubleshooting

### Port 3000 already in use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 PID
```

### MongoDB connection error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Make sure MongoDB is running:
```bash
mongod
```

### .env file not working
- Make sure file is named exactly `.env` (not `.env.txt`)
- Restart server after changing .env
- Don't use quotes in values

### Environment variables not loading in production
- Double-check variable names match exactly
- Make sure there are no extra spaces
- Restart application after setting variables

---

## 📊 GitHub Repository Setup

### Initialize repository
```bash
cd book-library
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/book-library.git
git push -u origin main
```

### Regular commits
```bash
git add .
git commit -m "Describe your changes"
git push origin main
```

### .gitignore file
The repository includes `.gitignore` which excludes:
- `node_modules/`
- `.env` (secrets)
- `.vscode/`
- System files (`DS_Store`, `Thumbs.db`)

---

## 📝 Notes for Defense

### What to Demonstrate
1. ✅ Open deployed URL in browser
2. ✅ Add a book using the form
3. ✅ View book in the table
4. ✅ Edit the book's rating
5. ✅ Delete the book
6. ✅ Show statistics updating
7. ✅ Open browser DevTools and show API calls
8. ✅ Show MongoDB collection in MongoDB Compass

### What to Explain
- How frontend communicates with backend via API
- How MongoDB stores the data
- How environment variables work
- Difference between local and production
- How deployment works on Render/Railway/Heroku
- Why we use native MongoDB driver (not Mongoose)
- Error handling and validation

### Possible Questions
- "Why didn't you use React/Vue?"
  - Assignment allows plain HTML/CSS/JS. It's simpler and still production-ready.
- "How does the app scale?"
  - MongoDB can handle millions of documents. Rendering still needs pagination.
- "Is the data secure?"
  - Secrets in environment variables, input validation, injection prevention.
- "Why native MongoDB driver?"
  - Assignment requirement. More control, no abstraction overhead.

---

## ✅ Checklist for Submission

- [ ] Repository created on GitHub
- [ ] .env file in .gitignore
- [ ] .env.example file created
- [ ] Application deployed to public URL
- [ ] Web UI works at root URL (/)
- [ ] All CRUD operations work via web UI
- [ ] API endpoints still work
- [ ] MongoDB connection works in production
- [ ] Environment variables set correctly
- [ ] Meaningful commit history
- [ ] README updated with deployment info
- [ ] No errors in console/logs
- [ ] Responsive design works on mobile
- [ ] Statistics display correctly
- [ ] Data persists after refresh

---

## 📞 Support

For issues or questions:
1. Check the [Troubleshooting](#-troubleshooting) section
2. Review the [API Documentation](#-api-documentation)
3. Check server logs: `npm run dev`
4. Verify MongoDB is connected: Check console output
5. Test with curl if web interface not working

---

## 📄 License

MIT License - Feel free to use for educational purposes

---

**Last Updated:** January 25, 2026  
**Version:** 2.0 (With Assignment 3 Part 2)  
**Authors:** Ardak Avissauly, Islam Imanbayev  
**Group:** SE-2437
│   └── style.css            (Styling for all pages)
├── data/
│   └── messages.json        (Saved contact form messages)
├── server.js                (Main Express application)
├── package.json             (Dependencies and scripts)
└── README.md                (This file)
```

## Installation & Setup

### Prerequisites
- **Node.js** v14 or higher
- **MongoDB** running locally or access to MongoDB Atlas

### Step 1: Install Dependencies
```bash
cd book-library
npm install
```

This installs:
- `express` - Web framework
- `mongodb` - Native MongoDB driver

### Step 2: Configure MongoDB

#### Option A: Local MongoDB
Ensure MongoDB is running on `localhost:27017`:
```bash
# macOS/Linux
mongod

# Windows (if installed as service)
# MongoDB runs automatically
```

#### Option B: MongoDB Atlas (Cloud)
Set environment variable:
```bash
# Linux/macOS
export MONGO_URI="mongodb+srv://username:password@cluster.mongodb.net/"

# Windows PowerShell
$env:MONGO_URI="mongodb+srv://username:password@cluster.mongodb.net/"

# Windows Command Prompt
set MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/
```

### Step 3: Start the Server

**Production Mode:**
```bash
npm start
```
or
```bash
node server.js
```

**Development Mode (with auto-reload):**
```bash
npm run dev
```

### Step 4: Access the Application
Open your browser and navigate to:
```
http://localhost:3000
```

## Database Schema

### Books Collection

Each document in the `books` collection has the following structure:

```javascript
{
  _id: ObjectId("..."),              
  title: String,                    
  author: String,                    
  description: String,              
  isbn: String,                      
  genre: String,                     
  pages: Number,                     
  published_year: Number,            
  rating: Number,                    
  created_at: Date,                 
  updated_at: Date                   
}
```

### Indexes Created
- `title` - For searching by title
- `author` - For filtering by author
- `genre` - For filtering by genre

## API Reference

### Base URL
```
http://localhost:3000/api/books
```

### 1. Get All Books

**Request:**
```http
GET /api/books
```

**Query Parameters:**
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `author` | string | Filter by author (case-insensitive) | `?author=tolkien` |
| `genre` | string | Filter by genre | `?genre=fiction` |
| `title` | string | Filter by title | `?title=hobbit` |
| `minRating` | number | Minimum rating threshold | `?minRating=4.5` |
| `sortBy` | string | Field to sort by | `?sortBy=rating` |
| `sortOrder` | string | Sort direction (asc/desc) | `?sortOrder=desc` |
| `fields` | string | CSV of fields to include | `?fields=title,author,rating` |

**Response (200 OK):**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "The Hobbit",
      "author": "J.R.R. Tolkien",
      "description": "A fantasy adventure novel",
      "isbn": "978-0-547-92807-6",
      "genre": "Fantasy",
      "pages": 310,
      "published_year": 1937,
      "rating": 4.8,
      "created_at": "2025-01-18T10:00:00.000Z",
      "updated_at": "2025-01-18T10:00:00.000Z"
    }
  ]
}
```

**Example Queries:**
```
# Get all books
GET /api/books

# Get books by Tolkien
GET /api/books?author=tolkien

# Get Fantasy genre sorted by rating (descending)
GET /api/books?genre=fantasy&sortBy=rating&sortOrder=desc

# Get books with rating >= 4.5
GET /api/books?minRating=4.5

# Get only title and author fields
GET /api/books?fields=title,author
```

### 2. Get Book by ID

**Request:**
```http
GET /api/books/:id
```

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Valid MongoDB ObjectId |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "The Hobbit",
    "author": "J.R.R. Tolkien",
    "genre": "Fantasy",
    "pages": 310,
    "rating": 4.8,
    "created_at": "2025-01-18T10:00:00.000Z",
    "updated_at": "2025-01-18T10:00:00.000Z"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Invalid book ID format"
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Book not found"
}
```

### 3. Create Book

**Request:**
```http
POST /api/books
Content-Type: application/json

{
  "title": "The Hobbit",
  "author": "J.R.R. Tolkien",
  "description": "A fantasy adventure novel",
  "isbn": "978-0-547-92807-6",
  "genre": "Fantasy",
  "pages": 310,
  "published_year": 1937,
  "rating": 4.8
}
```

**Request Fields:**
| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `title` | string | Yes | Cannot be empty |
| `author` | string | Yes | Cannot be empty |
| `description` | string | No | - |
| `isbn` | string | No | - |
| `genre` | string | No | - |
| `pages` | number | No | Must be positive |
| `published_year` | number | No | Between 1000 and current year |
| `rating` | number | No | Between 0 and 10 |

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Book created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "The Hobbit",
    "author": "J.R.R. Tolkien",
    "description": "A fantasy adventure novel",
    "isbn": "978-0-547-92807-6",
    "genre": "Fantasy",
    "pages": 310,
    "published_year": 1937,
    "rating": 4.8,
    "created_at": "2025-01-18T10:00:00.000Z",
    "updated_at": "2025-01-18T10:00:00.000Z"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Missing required fields: title and author"
}
```

**Using curl:**
```bash
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Hobbit",
    "author": "J.R.R. Tolkien",
    "genre": "Fantasy",
    "pages": 310,
    "rating": 4.8
  }'
```

### 4. Update Book

**Request:**
```http
PUT /api/books/:id
Content-Type: application/json

{
  "rating": 4.9,
  "genre": "Fantasy Adventure"
}
```

**Features:**
- Partial updates (only changed fields)
- All fields except `_id` can be updated
- Automatic `updated_at` timestamp

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Book updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "The Hobbit",
    "author": "J.R.R. Tolkien",
    "rating": 4.9,
    "genre": "Fantasy Adventure",
    "updated_at": "2025-01-18T11:30:00.000Z"
  }
}
```

**Error Responses:**

400 Bad Request (no update data):
```json
{
  "success": false,
  "message": "No update data provided"
}
```

404 Not Found:
```json
{
  "success": false,
  "message": "Book not found"
}
```

**Using curl:**
```bash
curl -X PUT http://localhost:3000/api/books/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -d '{"rating": 4.9}'
```

### 5. Delete Book

**Request:**
```http
DELETE /api/books/:id
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Book deleted successfully"
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Book not found"
}
```

**Using curl:**
```bash
curl -X DELETE http://localhost:3000/api/books/507f1f77bcf86cd799439011
```

## HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| `200` | OK | Successful GET, PUT, DELETE |
| `201` | Created | Successful POST |
| `400` | Bad Request | Invalid ID format or missing fields |
| `404` | Not Found | Record doesn't exist |
| `500` | Server Error | Database or server error |

## Middleware

### 1. Logger Middleware
Logs all incoming HTTP requests with timestamp, method, and URL:
```
[2025-01-18T10:30:45.123Z] GET /api/books
[2025-01-18T10:30:46.456Z] POST /api/books
[2025-01-18T10:30:47.789Z] PUT /api/books/:id
```

### 2. JSON Parser
Automatically parses JSON request bodies (via `express.json()`)

### 3. Error Handler
Global error handling middleware that catches all errors and returns appropriate JSON responses

## API Testing Guide

### Using Postman
1. Create new request
2. Set method to GET, POST, PUT, or DELETE
3. Enter URL: `http://localhost:3000/api/books`
4. For POST/PUT: Set Body to `raw` JSON
5. Add header: `Content-Type: application/json`
6. Send request

### Using curl (Command Line)

**Get all books:**
```bash
curl http://localhost:3000/api/books
```

**Get book by ID:**
```bash
curl http://localhost:3000/api/books/507f1f77bcf86cd799439011
```

**Get books by author:**
```bash
curl "http://localhost:3000/api/books?author=Tolkien"
```

**Get books sorted by rating:**
```bash
curl "http://localhost:3000/api/books?sortBy=rating&sortOrder=desc"
```

**Create book:**
```bash
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Hobbit",
    "author": "J.R.R. Tolkien",
    "genre": "Fantasy",
    "pages": 310,
    "rating": 4.8
  }'
```

**Update book:**
```bash
curl -X PUT http://localhost:3000/api/books/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -d '{"rating": 4.9}'
```

**Delete book:**
```bash
curl -X DELETE http://localhost:3000/api/books/507f1f77bcf86cd799439011
```

### Web Interface Quick Links
Visit `http://localhost:3000` to see interactive API testing links on the home page

## File Descriptions

| File | Purpose |
|------|---------|
| `server.js` | Main Express application with route setup |
| `database/connection.js` | MongoDB connection and utility functions |
| `routes/books.js` | CRUD API endpoints for books |
| `middleware/logger.js` | HTTP request logging |
| `middleware/errorHandler.js` | Global error handling |
| `views/index.html` | Home page with API documentation |
| `views/404.html` | Error page |
| `public/style.css` | Styling for all pages |
| `package.json` | Project dependencies |

## Validation Rules

### Title & Author
- Required fields
- Cannot be empty or whitespace only
- Automatically trimmed

### Pages
- Must be a positive number
- Optional field

### Published Year
- Must be between 1000 and current year
- Optional field

### Rating
- Must be between 0 and 10
- Stored as float for precision
- Optional (defaults to 0)

### ISBN
- Alphanumeric, optional
- Not validated as real ISBN

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Description of the error",
  "error": "Detailed error information (development only)"
}
```

All errors are logged to server console for debugging

## Features Implemented

### Core CRUD Operations
- ✅ Create (POST) with validation
- ✅ Read (GET) all and by ID
- ✅ Update (PUT) with partial updates
- ✅ Delete (DELETE) with confirmation

### Advanced Querying
- ✅ Filtering by multiple fields
- ✅ Case-insensitive search
- ✅ Sorting by any field
- ✅ Ascending and descending order
- ✅ Field projection (select specific fields)
- ✅ Compound queries

### Data Management
- ✅ Automatic timestamps
- ✅ MongoDB indexing
- ✅ Input sanitization
- ✅ Type validation
- ✅ Range validation

### API Best Practices
- ✅ RESTful design
- ✅ Proper HTTP status codes
- ✅ Consistent JSON responses
- ✅ Error messages
- ✅ Request logging
- ✅ Global error handling

## Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Ensure MongoDB is running
```bash
# Check MongoDB status
mongosh

# Or start MongoDB service
mongod
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution:** Change port or kill process using port 3000
```bash
# Linux/macOS
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Invalid ObjectId Format
```
Invalid book ID format
```
**Solution:** Ensure the ID is a valid MongoDB ObjectId (24 hex characters)

## Performance Notes

- Indexes on `title`, `author`, and `genre` for faster queries
- MongoDB connection pooling for efficiency
- Middleware chains for clean code organization
- Error handling prevents server crashes

## Security Considerations

- Input validation and sanitization
- MongoDB injection prevention via driver
- CORS could be added for frontend security
- Rate limiting could be added for production

## Future Enhancements

- [ ] User authentication and authorization
- [ ] Review and rating system
- [ ] Advanced search with full-text search
- [ ] Pagination for large result sets
- [ ] CORS support for cross-origin requests
- [ ] API key authentication
- [ ] Request rate limiting
- [ ] Caching layer (Redis)
- [ ] GraphQL API alternative

## Testing Checklist

- [ ] All GET requests return correct data
- [ ] Filtering works with single and multiple parameters
- [ ] Sorting works ascending and descending
- [ ] POST creates book and returns 201
- [ ] POST validates all required fields
- [ ] PUT updates book fields correctly
- [ ] PUT returns 404 for non-existent book
- [ ] DELETE removes book from database
- [ ] DELETE returns 404 for non-existent book
- [ ] Invalid IDs return 400 Bad Request
- [ ] Validation works for all field types
- [ ] Logger middleware logs all requests
- [ ] Error responses are consistent

## Course Assignment Completion

This project fulfills all requirements for:
- **Assignment 3 - Part 1: Backend API with MongoDB (CRUD)**
- Demonstrates Node.js and Express proficiency
- Shows MongoDB implementation without Mongoose
- Full CRUD operations with validation
- Advanced querying capabilities
- Professional API design

## Authors

- **Ardak Avissauly** - Backend Development
- **Islam Imanbayev** - Frontend Development

**Group:** SE-2437  
**Date:** January 18, 2025





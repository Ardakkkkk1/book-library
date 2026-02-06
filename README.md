# Book Library (Assignment 4 Ready)

Full-stack web app for managing a realistic book catalog with session-based authentication and protected write operations.

Live URL: https://book-library-swle.onrender.com/

## Assignment 4 coverage

- Web UI CRUD for `books` (create, read, update, delete)
- Domain entity with realistic fields: `title`, `author`, `description`, `isbn`, `genre`, `pages`, `published_year`, `rating`
- Session-based login (`/api/auth/login`) and logout (`/api/auth/logout`)
- Session ID stored in cookie (HttpOnly, Secure in production, SameSite=Lax)
- Authentication middleware protects all write operations (`POST/PUT/DELETE /api/books`)
- Passwords stored as bcrypt hashes (`bcryptjs`)
- Generic login errors (`Invalid credentials`)
- Input validation + proper status codes + safe error handling
- Auto-bootstrap to keep at least 20 realistic book records

## Tech stack

- Node.js + Express
- MongoDB (native driver)
- Session auth with `express-session`
- Password hashing with `bcryptjs`
- HTML/CSS/JS frontend (no framework)

## Local setup

1. Install dependencies
```bash
npm install
```

2. Copy `.env.example` to `.env` and set real values.

3. Start in development mode
```bash
npm run dev
```

4. Open
- App UI: `http://localhost:3000/`
- Landing page: `http://localhost:3000/home`

## Default login

On first start, if user does not exist, the app creates one admin user from env:

- `ADMIN_USERNAME` (default: `admin`)
- `ADMIN_PASSWORD` (default: `admin12345`)

Password is hashed before storing to MongoDB.

## API

### Auth
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Books
- `GET /api/books`
- `GET /api/books/:id`
- `POST /api/books` (auth required)
- `PUT /api/books/:id` (auth required)
- `DELETE /api/books/:id` (auth required)

## Deployment notes (Render)

Set these environment variables in Render:

- `NODE_ENV=production`
- `MONGO_URI=<your MongoDB URI>`
- `SESSION_SECRET=<long random secret>`
- `ADMIN_USERNAME=<admin username>`
- `ADMIN_PASSWORD=<admin password>` or `ADMIN_PASSWORD_HASH=<bcrypt hash>`

In production, session cookie uses `Secure=true` and `HttpOnly=true`.

# Book Library (Final Project - Production Web Application)

Live URL: https://book-library-swle.onrender.com/

Production-ready web app for managing books and related reviews with session auth, role-based access control, owner-based authorization, and protected API endpoints.

## Final project coverage

- Same project from previous assignment, extended to final requirements
- Node.js + Express + MongoDB
- Modular structure: `routes/`, `controllers/`, `models/`, `middleware/`, `config/`, `database/`
- Two related collections in domain logic:
`books` + `reviews` (each review belongs to a book and user)
- Pagination/filtering for large datasets on books and reviews
- Session-based auth with bcrypt password hashing
- Roles: `user` and `admin`
- Owner-based authorization:
users can modify only their own books/reviews
- Admin extended permissions:
admin can manage all books/reviews and access admin users endpoint
- All write endpoints for domain data are protected
- Validation + safe error handling
- Secrets in environment variables (no hardcoded secrets)

## Data model

- `users`
`username`, `passwordHash`, `role`, timestamps
- `books`
realistic book fields + `ownerId`, `ownerUsername`, timestamps
- `reviews`
`bookId`, `ownerId`, `ownerUsername`, `rating`, `comment`, timestamps

Relations:

- `reviews.bookId -> books._id`
- `books.ownerId -> users._id`
- `reviews.ownerId -> users._id`

## API

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/auth/users` (admin only)

### Books

- `GET /api/books` (supports filters + `page/limit`)
- `GET /api/books/:id`
- `POST /api/books` (auth required)
- `PUT /api/books/:id` (owner/admin only)
- `DELETE /api/books/:id` (owner/admin only)

### Reviews

- `GET /api/reviews` (supports `bookId` + pagination)
- `GET /api/reviews/:id`
- `POST /api/reviews` (auth required)
- `PUT /api/reviews/:id` (owner/admin only)
- `DELETE /api/reviews/:id` (owner/admin only)

## Local setup

1. Install dependencies

```bash
npm install
```

2. Copy `.env.example` to `.env` and set values (especially `SESSION_SECRET`, `MONGO_URI`, admin credentials).

3. Start app

```bash
npm run dev
```

4. Open

- Main app: `http://localhost:3000/`
- Landing: `http://localhost:3000/home`

## Bootstrap behavior

- Creates admin user only if `ADMIN_USERNAME` and (`ADMIN_PASSWORD` or `ADMIN_PASSWORD_HASH`) are configured and user does not exist yet
- Seeds minimum books (`AUTO_SEED_BOOKS`, `MIN_BOOKS_COUNT`)
- Migrates old books to ensure ownership metadata exists

## Deployment notes (Render)

Required env vars:

- `NODE_ENV=production`
- `MONGO_URI=<mongo-uri>`
- `DB_NAME=book_library`
- `SESSION_SECRET=<long-random-secret>`
- `ADMIN_USERNAME=<admin-username>`
- `ADMIN_PASSWORD=<strong-password>` or `ADMIN_PASSWORD_HASH=<bcrypt-hash>`

Security notes:

- Session cookie: `HttpOnly`, `SameSite=Lax`, `Secure=true` in production
- In production, app fails fast if `SESSION_SECRET` is missing

## Defense demo checklist

1. Open deployed URL and login/register through web UI.
2. Show CRUD for books from UI.
3. Show reviews CRUD linked to books (related collection demo).
4. Show owner-based restrictions with regular user.
5. Show admin capabilities (`admin` can manage all + access users panel).
6. Explain why write endpoints are protected and how validation/error handling works.

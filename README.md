# Book Library

Full-stack web app for managing a book collection with Node.js, Express, and MongoDB.

Live URL: https://book-library-swle.onrender.com/

## Features
- CRUD via web UI at `/`
- REST API at `/api/books`
- Filtering, sorting, and field selection

## Tech
- Node.js + Express
- MongoDB (native driver)
- HTML/CSS/JS (no frontend framework)

## Setup (local)
1) Install dependencies:
```
npm install
```
2) Create `.env`:
```
PORT=3000
MONGO_URI=YOUR_MONGO_URI
```
3) Run:
```
npm run dev
```
Open http://localhost:3000

## Scripts
- `npm start` - production
- `npm run dev` - development (nodemon)

## API
- `GET /api/books`
- `GET /api/books/:id`
- `POST /api/books`
- `PUT /api/books/:id`
- `DELETE /api/books/:id`

## Environment
- `PORT` and `MONGO_URI` are required in production.
- `.env` is local only and should not be committed.

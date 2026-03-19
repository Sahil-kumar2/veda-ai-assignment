# AI Assessment Creator

A full-stack app to create AI-generated assignments with async processing, real-time status updates, and exam-paper style output/PDF.

## Overview

This project lets users:
- Create assignments with multiple question types
- Define per-type distribution (`count`, `marksPerQuestion`)
- Upload reference files for generation context
- Track generation status (`pending`, `processing`, `completed`, `failed`)
- View structured question paper output
- Download the question paper as PDF
- Regenerate an assignment

## Tech Stack

- Frontend: React, Vite, React Router, Tailwind CSS, jsPDF, socket.io-client
- Backend: Node.js, Express, TypeScript, Mongoose, Zod, Multer
- Queue/Cache: BullMQ, Redis (local or Upstash)
- AI: Groq API
- Database: MongoDB (local or Atlas)

## Architecture

```text
[Frontend: React + Vite]
      |
      | HTTP (JSON + multipart/form-data)
      v
[Express API] ----> [MongoDB]
      |
      | enqueue
      v
[BullMQ Queue on Redis] --> [Worker] --> [Groq API]
          |                      |
          |                      v
          +--------> [Socket.IO assignment room updates]
```

## Key Features Implemented

- Assignment creation with:
  - question type selection
  - strict distribution validation
  - optional reference file upload (`referenceFiles[]`)
- Groq-based generation with strict JSON schema validation
- Layered parser fallback for malformed model output
- Real-time updates via Socket.IO room subscription (`assignment:{id}`)
- Regenerate flow (`POST /assignments/:id/regenerate`)
- Exam-paper style UI + PDF output
- MongoDB Atlas-ready DB connection config (pooling/timeouts/env-driven)

## API Endpoints

Base URL: `/api/v1`

- `POST /assignments`
- `GET /assignments/:id`
- `POST /assignments/:id/regenerate`

Health:
- `GET /health`

## WebSocket Events

Client -> Server:
- `subscribe` `{ assignmentId }`

Server -> Client:
- `assignment:update` `{ assignmentId, status, result?, error? }`

## Environment Variables

### Backend (`backend/.env`)

- `NODE_ENV`
- `PORT`
- `MONGO_URI`
- `MONGO_DB_NAME`
- `MONGO_MAX_POOL_SIZE`
- `MONGO_MIN_POOL_SIZE`
- `MONGO_SERVER_SELECTION_TIMEOUT_MS`
- `MONGO_SOCKET_TIMEOUT_MS`
- `REDIS_URL` (or `REDIS_HOST` + `REDIS_PORT`)
- `REDIS_USERNAME`
- `REDIS_PASSWORD`
- `CORS_ORIGIN`
- `GROQ_API_KEY`
- `GROQ_MODEL`
- `GROQ_BASE_URL`

### Frontend (`frontend/.env`)

- `VITE_API_BASE_URL`
- `VITE_SOCKET_URL`

Use these templates:
- `.env.example`
- `backend/.env.example`
- `frontend/.env.example`

## Local Setup

1. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

2. Configure env files

- Copy `backend/.env.example` -> `backend/.env`
- Copy `frontend/.env.example` -> `frontend/.env`

3. Run apps

```bash
cd backend && npm run dev
cd ../frontend && npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## MongoDB Atlas Setup

1. Create Atlas cluster and DB user
2. Allow backend IP in Atlas Network Access
3. Set `MONGO_URI` to your Atlas SRV URI
4. Set `MONGO_DB_NAME` (example: `veda_ai`)
5. Restart backend and verify connection logs

## Notes and Trade-offs

- Reference file extraction is currently lightweight (text-first extraction).
- OCR/deep document parsing can be added for richer file understanding.
- Frontend bundle is currently large; route-level code splitting can further optimize load time.

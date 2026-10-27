## 🚀 Live Demo

[Open AI Mystery Room](https://ai-mystery-room-iyci.onrender.com)

# AI Mystery Room

AI Mystery Room turns a short fictional scenario into a private, evidence-driven investigation. The client is a React/Vite app; the Express API validates and stores Gemini-generated cases in MongoDB. The solution stays server-side until an accusation has been filed.

## Requirements

- Node.js 20 or newer and npm
- MongoDB running locally or a MongoDB Atlas URI
- A Google Gemini API key for case generation

## Setup

1. Copy `.env.example` to `.env` at the repository root or to `server/.env`, then set `MONGODB_URI`, `GEMINI_API_KEY`, and a long random `SESSION_SECRET`.
2. Install dependencies from the repository root: `npm install`.
3. Start both apps: `npm run dev`.
4. Open `http://localhost:5173`. The API listens on `http://localhost:5000`.

Run individually with `npm run dev:server` and `npm run dev:client`. `npm run build` builds the frontend. `npm start` starts the API. Configure `CLIENT_ORIGIN` to the frontend origin in deployment. To use another API URL in the client build, set `VITE_API_URL` to the base `/api/v1` URL.

## Environment

See `.env.example` for all settings. `GEMINI_API_KEY` and MongoDB credentials are server-side only. `GEMINI_MODEL` selects the model; generation is bounded by `AI_GENERATION_TIMEOUT_MS`, `AI_MAX_RETRIES`, and `AI_MAX_OUTPUT_TOKENS`. For public deployment, set HTTPS at the host, restrict CORS, rotate credentials, and use a persistent MongoDB deployment.

## Features

- Fictional, AI-generated case creation with category and difficulty choices.
- Strict output schema checks, cross-reference validation, and bounded retries.
- Anonymous browser sessions and session-owned case records.
- Evidence records, suspects, confidence-labeled timeline, bookmarks, notes, and progressive stored hints.
- One accusation per case; server-side evaluation and gated solution reveal.
- Structured chat evidence and a textual CCTV fallback. No fake video or generated images are claimed.
- Responsive noir interface with mobile layouts and reduced-motion support.

The canonical requirements are in [docs/SPEC.md](docs/SPEC.md). API routes and data privacy are summarized in [docs/API.md](docs/API.md); local development and deployment notes are in [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) and the [production deployment walkthrough](docs/DEPLOYMENT.md).

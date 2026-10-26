# Development

## Local development

Install Node.js 20+, start MongoDB, copy `.env.example` to the repository root as `.env` or into `server/.env`, fill in Gemini credentials, then run `npm install` and `npm run dev`. Server-local `.env` takes precedence. Vite is served on port 5173 and Express on port 5000. The API health route is `/api/v1/health`.

Use `npm run build` for the frontend production bundle, `npm test` for the project tests, and `npm run lint` for static checks. `npm start` starts the API after MongoDB is available.

If Atlas startup fails with `querySrv ECONNREFUSED`, the active DNS resolver may be refusing SRV lookups. Try `DNS_SERVERS=8.8.8.8,1.1.1.1` in the active `.env` file and restart the server. If it still fails, check that the network allows DNS on port 53, then use Atlas's standard `mongodb://` connection string as described in [MongoDB's connection troubleshooting guide](https://www.mongodb.com/docs/atlas/troubleshoot-connection/).

If the error is `bad auth` / `Authentication failed`, reset or verify the database user's password in Atlas **Database Access**, then update `MONGODB_URI`. This is the database user, not your Atlas website login. URL-encode reserved characters in the password before placing it in the URI.

If generation reports a Gemini access error, restart the server after changing `GEMINI_API_KEY`. For HTTP 403, check the key's project status, API restrictions, and billing eligibility in Google AI Studio; for HTTP 402, resolve the project's billing or prepay balance. See Google's [Gemini API troubleshooting guide](https://ai.google.dev/gemini-api/docs/troubleshooting).

## Deployment

Follow [the production deployment walkthrough](DEPLOYMENT.md). The included `render.yaml` deploys the built client and API together as one Render web service; MongoDB Atlas stores persistent data. For a separate static frontend, set `VITE_API_URL` at build time to the API base URL ending in `/api/v1`, and set the API's `CLIENT_ORIGIN` to the exact frontend origin.

Media provider support is deliberately absent from this MVP. Chat records render from structured data and CCTV evidence presents text/transcript content only.

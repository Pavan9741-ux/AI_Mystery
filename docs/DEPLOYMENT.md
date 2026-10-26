# Production deployment walkthrough

This setup uses Render for the web app and API, and MongoDB Atlas for the database. The Render service serves the React app and `/api/v1` from the same HTTPS address, so no frontend CORS setting or build-time API URL is needed.

## 1. Prepare the repository

1. Commit the project to a GitHub repository. Confirm `.env` is not tracked; only `.env.example` belongs in source control. Never put API keys or database credentials in the repository.
2. Push the branch you want to deploy. Render builds the repository root using the included `render.yaml` and `.node-version`.

## 2. Create the MongoDB Atlas database

1. Create an Atlas project and a cluster, then create a database user with a strong password.
2. Add network access for the Render web service. In Render, open the service's **Connect** settings and use the outbound IP addresses shown there in the Atlas IP access list. Avoid `0.0.0.0/0` for a production database; it allows connections from any IP and increases exposure.
3. In Atlas, choose **Connect → Drivers**, select Node.js, and copy the connection string. Replace the password placeholder with the database user's password and include the database name, for example `ai_mystery_room`, before any query options. URL-encode special characters in the password.

## 3. Create the Render service

1. In Render, choose **New → Blueprint**, connect the GitHub repository, and deploy the `render.yaml` blueprint.
2. When prompted for `MONGODB_URI` and `GEMINI_API_KEY`, enter the Atlas connection string and a Google Gemini API key. Render generates `SESSION_SECRET` for this service. Keep all three values private and store them only in Render's environment settings.
3. The blueprint sets `NODE_ENV=production`, the current project model settings, and `/api/v1/health` as the health check. It builds with `npm ci && npm run build` and starts with `npm start`.
4. Wait for the deploy to finish. Open the Render URL; verify that the mystery room loads, then visit `<your-render-url>/api/v1/health`. It should return `{"status":"ok","database":"connected"}`.

## 4. Verify a complete investigation

Create a mystery in the deployed UI, inspect evidence, and submit an accusation. This checks the Gemini key, database connection, session handling, and API routes together. If generation fails, inspect Render's service logs for the upstream Gemini error and confirm the key has model access and quota. If health is unavailable, check `MONGODB_URI`, the Atlas database user's credentials, and the Atlas IP access list.

## 5. Set a custom domain (optional)

Add the domain in the Render service settings, then configure the DNS records Render provides. Render manages HTTPS certificates for connected domains. Since the app and API share one origin, no `CLIENT_ORIGIN` or `VITE_API_URL` changes are needed.

## Ongoing operations

- Render's free web services can spin down while idle, so the first request after inactivity may take longer. Choose an always-on plan if that delay does not fit your use.
- Back up the Atlas database and monitor storage, Gemini usage, and Render logs.
- Rotate the Gemini key and database password through Render's environment settings if either is exposed. Keep `SESSION_SECRET` stable between deploys so existing signed sessions remain valid.
- Do not set `DNS_SERVERS` unless the hosting provider requires custom resolvers; by default the app uses the host's DNS configuration.

## Separate frontend hosting

If you later host `client/dist` separately, set `VITE_API_URL` at frontend build time to the API origin plus `/api/v1` (for example `https://api.example.com/api/v1`) and set the API's `CLIENT_ORIGIN` to the exact frontend origin. Restrict that value to the site origin; do not use `*` for a credentialed or private deployment.

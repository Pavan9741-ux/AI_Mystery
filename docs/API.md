# API overview

All routes use `/api/v1` and JSON. Except for health and session creation, requests need the opaque `X-Session-Id` returned by `POST /sessions`. A session can access only cases it created.

| Method | Route | Purpose |
|---|---|---|
| GET | `/health` | API liveness |
| POST | `/sessions` | Create a random anonymous session credential |
| POST | `/cases` | Validate input, generate, validate, and persist a case |
| GET | `/cases` | List the session’s ready cases |
| GET | `/cases/:caseId` | Retrieve public case and progress |
| GET | `/cases/:caseId/suspects` | List public suspect profiles |
| GET | `/cases/:caseId/evidence?type=CHAT` | List evidence metadata |
| GET | `/cases/:caseId/evidence/:evidenceId` | Read full public evidence |
| PATCH | `/cases/:caseId/progress` | Save reviewed/bookmarked IDs, shortlist, and notes |
| POST | `/cases/:caseId/hints` | Retrieve a stored hint level |
| POST | `/cases/:caseId/accusations` | Submit the single final accusation |
| GET | `/cases/:caseId/solution` | Reveal solution after an accusation |

Errors use `{ "error": { "code", "message", "details" } }`. The canonical solution is stored in a Mongoose field excluded by default and is only selected by server-side hint, accusation, and gated reveal operations. Public case responses omit evidence contents until the evidence detail route is used.

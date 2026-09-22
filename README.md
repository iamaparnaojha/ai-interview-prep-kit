# AI Interview Prep Kit

A research-backed interview preparation workspace built for the Trao full-stack assessment. It keeps the model responsible for interpretation and generation, while application code owns URL safety, validation, coverage, scheduling, persistence, and edit preservation.

## Stack

- Next.js App Router, TypeScript, Tailwind CSS (`apps/web`)
- Node.js, Express, TypeScript (`apps/api`)
- MongoDB Atlas-compatible persistence configuration
- Google Gemini (`gemini-2.5-flash`) through a backend-only adapter
- Zod and Vitest for contracts and deterministic tests

The assessment target is intentionally separate from the existing `NextHire` project.

## Configuration

Copy `.env.example` to `.env` and fill in your own values. Never commit `.env`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | For model generation | Google Gemini API key; leave empty to use the deterministic local fallback during development |
| `GEMINI_MODEL` | No | Gemini model name, default `gemini-2.5-flash` |
| `MONGODB_URI` | Deployment | MongoDB Atlas connection string |
| `MONGODB_DB` | No | Database name, default `ai_interview_prep` |
| `SESSION_SECRET` | Production | Reserved for production session signing |
| `FRONTEND_URL` | No | Allowed frontend origin |
| `NEXT_PUBLIC_API_URL` | Frontend deployment | Browser-visible API base URL; use `http://localhost:4000` locally and the Render HTTPS URL in Vercel |
| `COOKIE_SECURE` | Production | Set `true` when served over HTTPS |
| `COOKIE_SAMESITE` | Production | Use `none` for Vercel-to-Render cross-site cookies; keep `lax` locally |

## Local setup

```bash
npm install
npm run build --workspace @prep/kit-core
npm run dev
```

The web app runs on `http://localhost:3000`; the API runs on `http://localhost:4000`.

## Batch evaluator

The evaluator uses the same `generateKit` pipeline as the API route:

```bash
npm run evaluate -- --input <cases.json> --output <kits.json>
```

It processes every case, continues after failures, preserves the exact Appendix B output shape, and validates every successful kit against the Appendix A contract.

## Pipeline

1. Validate the JD, URL, and day range.
2. Extract requirements from the pasted JD without fetching a job board.
3. Fetch the company homepage, read robots.txt, discover same-origin useful links, and follow relative URLs.
4. Clean page text and retain actual source URLs. Unavailable pages are recorded and skipped.
5. Generate questions with Gemini when configured; otherwise use a deterministic fallback so local tests and batch runs remain inspectable.
6. Run deterministic requirement coverage. A second pass creates questions for uncovered must-have requirements.
7. Generate connected flashcards.
8. Allocate exactly the requested number of days in deterministic code. Higher-priority and harder questions sort earlier.
9. Validate referential integrity before returning or saving.

Fetched text is marked as untrusted data in the model prompt and is never treated as instructions. The crawler limits response size, content type, timeout, same-origin traversal, and robots permissions.

## State and regeneration

Generated questions and flashcards carry `state: generated`. Manual edits become `edited`; explicitly protected items become `pinned`. Section regeneration filters out edited and pinned items before replacing generated content, so unrelated work remains intact. Schedule regeneration only changes schedule data.

## Practice and Weak Spots

Practice progress is stored per user and flashcard with confidence values from 1 to 5. The next session sorts lowest-confidence and never-attempted cards first. The planned Weak Spots report is derived from this persisted history after the mandatory editor and practice flows are complete.

## Tests

```bash
npm test
```

Tests cover exact schedule lengths for 1, 2, 5, and 60 days, must-have coverage behavior, invalid references, and schema validation.

## Deployment

Deploy `apps/web` to Vercel with `NEXT_PUBLIC_API_URL` pointing at the Render API. Deploy `apps/api` to Render with the root build command `npm install && npm run build --workspace @prep/kit-core && npm run build --workspace @prep/api` and start command `npm run start --workspace @prep/api`. The API workspace emits its runtime entry at `apps/api/dist/server.js`. Configure MongoDB Atlas and all production environment variables in the hosting dashboards only.

The API uses MongoDB Atlas when `MONGODB_URI` is configured and an in-process fallback only for local development without a database. Users can register, reopen and delete kits, edit and reorder questions, add or delete questions and flashcards, pin manual content, regenerate a brief or category, practice cards, record confidence, and inspect weak spots. Kit updates use an optimistic version check to avoid overwriting a newer edit.

The current deployment is prepared but not published from this workspace. Vercel and Render still require the repository connection and production environment values to be configured in their dashboards. The crawler records retrieved pages and continues when a source is unavailable; it does not fabricate public interview experiences when no evidence is found.

# CodeArena X

**AI Placement Intelligence System** — a monorepo for coding practice, AI-assisted coaching, mock technical interviews, and Pro upgrades (Razorpay).  
Stack: **React (Vite)** + **Express** + **MongoDB** + **GROQ** + **Judge0** + **Socket.IO**.

## Overview

CodeArena X helps students prepare for technical interviews: practice problems with an in-browser editor, get AI guidance (within fair-use limits), run code against a Judge0 host, and complete structured mock interview sessions. Optional **Razorpay** checkout enables a **Pro** plan for higher AI quotas.

## Features

| Area | What you get |
|------|----------------|
| **Problem bank** | Curated problems, run on samples, submit for full test evaluation (Judge0). |
| **AI coaching** | Hints, explanations, and mentor-style help powered by GROQ (when configured). |
| **Mock interview** | Session flow with GROQ-generated feedback. |
| **Payments** | Razorpay test/live keys for `create-order` → Checkout → HMAC `verify` before upgrading plan. |

## Tech stack

- **Client:** React 19, Vite 6, Tailwind, Monaco Editor, Recharts, Framer Motion  
- **Server:** Node 20+, Express, Mongoose, JWT, Passport (Google OAuth optional), Zod, Helmet, rate limits  
- **Data:** MongoDB (Atlas or self-hosted)  
- **Infra (optional):** `docker-compose.yml` for local Mongo; production typically uses Atlas  

## Security

- **Do not commit** real credentials. The repo includes **`.env.example`** only (placeholders).  
- Copy the example to **`server/.env`** and fill in your values.  
- If any secret was ever shared or committed, **rotate** keys (Atlas, GROQ, Google OAuth, Razorpay, Judge0) before using the project publicly.  

## Prerequisites

- **Node.js 20+**
- **MongoDB** (e.g. Atlas; local Docker optional)
- **Judge0**-compatible host for run/submit
- **GROQ** API key for AI features
- **Razorpay** keys (optional, for Pro checkout)

## Quick start

```powershell
# Clone
git clone https://github.com/<your-username>/codearena-x.git
cd codearena-x

# Environment — copy example; never commit the real .env
copy .env.example server\.env
# Edit server\.env: MONGODB_URI, JWT_SECRET (≥16 chars), optional GROQ, Judge0, Razorpay, CLIENT_URL

# Server
cd server
npm install
npm run dev
```

**Second terminal — client**

```powershell
cd client
npm install
npm run dev
```

- **App:** http://localhost:5173 (Vite proxies API/WebSocket to the server)  
- **API health:** http://localhost:5000/api/health — reports MongoDB, GROQ, Judge0, and Razorpay configuration  

## Seed problem bank

With MongoDB reachable and `MONGODB_URI` set in `server/.env`:

```powershell
cd server
npm run seed:problems
```

Optional: `SEED_CLEAR_PROBLEMS=true` (destructive — clears `problems` first).

## Environment variables (summary)

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | Connection string (SRV or standard) |
| `MONGODB_DB_NAME` | Database name (default `codearena_x`) |
| `JWT_SECRET` | **≥ 16 characters** |
| `CLIENT_URL` | Must match the Vite origin, e.g. `http://localhost:5173` |
| `GROQ_API_KEY` | AI features |
| `JUDGE0_API_URL` / `JUDGE0_API_KEY` / `JUDGE0_RAPIDAPI_HOST` | Code execution |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Pro checkout (test keys: `rzp_test_…`) |
| `PAYMENT_ALLOW_SIMULATED_UPGRADE` | `true` **only in dev** for legacy simulated upgrade (default: off) |

Full list and defaults are documented in `server/src/config/env.js` and in **`.env.example`**.

## Payments (Razorpay)

- Flow: `POST /api/payment/create-order` → Razorpay Checkout → `POST /api/payment/verify` (HMAC).  
- Test card (test mode): `4111 1111 1111 1111`, future expiry, CVV `123`.  

## API surface (short)

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/health` | DB + feature flags |
| POST | `/api/auth/register`, `/api/auth/login` | Rate-limited |
| … | `/api/problems`, `/api/ai/*`, `/api/interview/*`, `/api/payment/*` | See server routes |

`GET /api/debug/*` is **not** enabled in production by default.

Language → Judge0 `language_id`: `server/src/config/languages.js`

## CI

GitHub Actions (`.github/workflows/ci.yml`) installs dependencies and runs the **client** production build. Add server tests or lint as you grow the suite.

## Docker

`docker-compose.yml` can start a local **Mongo** instance. The app is usually pointed at **Atlas** in production.

## Docs

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) if present.

## Screenshots (optional)

Add images under `docs/screenshots/` and update the links below.

| Screen | Suggested file |
|--------|----------------|
| Dashboard / home | `docs/screenshots/dashboard.png` |
| Problem solve + editor | `docs/screenshots/problem-solve.png` |
| Mock interview | `docs/screenshots/mock-interview.png` |
| Pro / billing | `docs/screenshots/billing.png` |

```text
# Example markdown after you add files:
# ![Dashboard](docs/screenshots/dashboard.png)
```

## License

Private or add a `LICENSE` file for your org.

# CodeArena X — System Architecture

## Overview

Monorepo with a **Vite + React** client and a **Node.js + Express** API. **MongoDB** is the primary datastore. **GROQ** powers all LLM features behind a single `ai.service` layer. **Judge0** executes user code. **Socket.IO** provides real-time contests and leaderboards.

```
┌─────────────┐     HTTPS/WS      ┌──────────────┐     ┌──────────┐
│   React     │◄────────────────►│   Express     │◄───►│ MongoDB  │
│  (Vite)     │                  │  REST+Socket  │     │(Mongoose)│
└─────────────┘                  └───────┬──────┘     └──────────┘
                                        │
                         ┌──────────────┼──────────────┐
                         ▼              ▼              ▼
                    ┌─────────┐  ┌──────────┐  ┌─────────────┐
                    │  GROQ   │  │ Judge0  │  │ Google OAuth│
                    │  API    │  │  API     │  │  (passport) │
                    └─────────┘  └──────────┘  └─────────────┘
```

## Backend (MVC + Services)

| Layer | Responsibility |
|--------|-----------------|
| **routes** | HTTP path registration, no business logic |
| **controllers** | Parse request, validate, call services, send response |
| **services** | Business rules, AI calls, aggregations, external APIs |
| **models** | Mongoose schemas, indexes, virtuals |
| **middleware** | JWT, roles, error handler, rate limits |
| **config** | Env validation, DB connection, CORS, Socket.IO |
| **utils** | Pure helpers (JWT, scoring math, date ranges) |
| **prompts** | Structured GROQ prompt templates (JSON-only contract) |

**Rule:** All GROQ usage flows through `services/ai.service.js` (structured prompts, JSON parse/repair, error handling, token awareness).

## Frontend

| Area | Purpose |
|------|---------|
| **pages** | Route-level views |
| **components/layout** | Shell, nav, theme |
| **components/features/** | Auth, problem, editor, contest, admin, payments |
| **hooks** | Data fetching, WebSocket, theme |
| **services** | API client, typed helpers |
| **context** | Auth user, theme (light/dark) |

## Data Flow Highlights

- **Submissions:** Client → `POST /api/submissions` → Judge0 → persist runtime/memory/status → update Skill DNA aggregates (async or inline job pattern in later step).
- **AI review:** Client → `POST /api/ai/code-review` → `ai.service` with problem + code → **structured JSON** response.
- **Contests:** HTTP to join/start; **Socket.IO** room per contest for timer sync + leaderboard pushes.

## Security & Config

- Secrets only via `.env` (see `.env.example`).
- JWT access (short-lived) + optional refresh pattern in later iteration.
- Admin routes protected by `role: admin` middleware.

## Docker

- `docker-compose` orchestrates API + MongoDB; client optional as dev or static build behind nginx in production.

## Module Map (MVP → Full)

1. Auth + users + roles  
2. Problems + submissions + Judge0  
3. AI (review, coach, roadmaps) via GROQ  
4. Skill DNA + hireability (derived metrics + GROQ summaries)  
5. Mock interview + placement simulation  
6. Contests + Socket.IO  
7. Payments (simulation UI + webhook stubs)  
8. Admin + analytics  

Next implementation step after approval: **backend setup** (Express app, config, health route, DB connect).

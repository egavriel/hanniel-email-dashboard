# Hanniel Email Dashboard

A self-hosted email alias management dashboard for the `hanniel.co` domain, built on the Cloudflare developer platform. It provides a clean interface for creating, tracking, and managing email routing rules via the Cloudflare Email Routing API — with alias metadata stored in Cloudflare D1 and the entire app deployed as a Cloudflare Worker.

> **Context:** This is a personal productivity tool built to solve a real problem — managing dozens of per-service email aliases without losing track of where they were used or why they were created. It is not a generic product, but the architecture decisions reflect how I approach real-world systems work.

---

## What It Does

Most services receive a unique alias (e.g., `netflix@hanniel.co`, `github@hanniel.co`). Cloudflare Email Routing forwards all of these to a single private inbox. This dashboard is the control plane for that setup:

- **View all aliases** — live-synced from the Cloudflare Email Routing API, enriched with local metadata
- **Create aliases** — single or bulk (up to 50 at once), with input validation
- **Annotate aliases** — tag each one with a service name, category, and notes for future reference
- **Toggle rules** — enable or disable routing rules without deleting them
- **Delete aliases** — removes the Cloudflare routing rule and local metadata atomically
- **Export Gmail filters** — generates importable XML that auto-labels incoming mail by alias
- **Sending guide** — step-by-step setup for sending from aliases via Brevo SMTP + Gmail's "Send mail as"
- **DNS health check** — surfaces the Cloudflare email routing DNS status for the domain

---

## Architecture

```
Browser → Cloudflare Worker (Next.js via OpenNext)
              ├── Next.js App Router (RSC + API Routes)
              ├── Cloudflare Email Routing API  ← alias CRUD
              └── Cloudflare D1 (SQLite)        ← alias metadata
```

**Why Cloudflare Workers instead of Vercel?**

The Cloudflare Email Routing API requires a Cloudflare API token. Running the app as a Cloudflare Worker means secrets never leave Cloudflare's infrastructure, and the Worker can bind directly to a D1 database without any external database connection overhead. The app runs at the edge globally with zero cold starts on the free plan.

**Why D1 alongside the Email Routing API?**

The Email Routing API stores routing rules but nothing else — there's no concept of "why does this alias exist" or "which service uses it." D1 acts as a lightweight metadata store, keyed on Cloudflare's rule IDs, that adds the context layer the API doesn't provide.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Runtime | Cloudflare Workers (via [OpenNext](https://opennext.js.org/cloudflare)) |
| Database | Cloudflare D1 (SQLite at the edge) |
| Email Routing | Cloudflare Email Routing API (`cloudflare` SDK) |
| Auth | Password-based login, HMAC-signed session cookies (Web Crypto API) |
| Deployment | Wrangler CLI → Cloudflare Workers |

---

## Security Model

Authentication is intentionally simple — this is a single-user personal tool, not a multi-tenant product.

- **Login:** A single dashboard password is validated against `DASHBOARD_PASSWORD` from Workers secrets
- **Sessions:** On successful login, a cryptographically random 32-byte token is generated and signed with HMAC-SHA256 using `SESSION_SECRET`. The signed token is stored in an `httpOnly`, `secure`, `SameSite=Strict` cookie
- **Route protection:** Edge middleware checks for a valid session cookie on all non-public routes
- **Secrets:** All sensitive values (`CLOUDFLARE_API_TOKEN`, `SESSION_SECRET`, `DASHBOARD_PASSWORD`, etc.) are stored as Cloudflare Workers secrets — never in code or committed config files

**Known limitations (acceptable for a personal tool):**
- The middleware checks cookie presence only; HMAC re-verification on every request is not implemented at the middleware layer
- There is no rate limiting on the login endpoint
- `SESSION_SECRET` has a fallback value (`"fallback-dev-secret"`) for local development — this must be overridden in production via Workers secrets

---

## Database Schema

```sql
CREATE TABLE alias_metadata (
  cf_rule_id  TEXT PRIMARY KEY,   -- Cloudflare routing rule ID (foreign key to CF API)
  alias       TEXT NOT NULL UNIQUE,
  service     TEXT,               -- e.g. "Netflix", "GitHub"
  category    TEXT,               -- one of: social, shopping, finance, newsletters, gaming, work, personal, other
  notes       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
```

The `cf_rule_id` field links metadata rows to live Cloudflare routing rules. When a rule is deleted via the dashboard, both the CF rule and the D1 row are removed atomically (sequential calls — no distributed transaction).

---

## Environment Variables

All secrets are stored as Cloudflare Workers secrets (not in `.env` files). The following must be set via `wrangler secret put`:

| Variable | Description |
|---|---|
| `CLOUDFLARE_API_TOKEN` | CF token with Email Routing read/write and Zone read permissions |
| `CLOUDFLARE_ZONE_ID` | Zone ID for `hanniel.co` |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |
| `DESTINATION_EMAIL` | The private inbox all aliases forward to |
| `SESSION_SECRET` | Random secret for HMAC-signing session tokens (min. 32 bytes of entropy) |
| `DASHBOARD_PASSWORD` | Single password for dashboard access |

---

## Local Development

```bash
# Install dependencies
npm install

# Set up local secrets (Wrangler injects these in dev)
cp .dev.vars.example .dev.vars   # fill in your values

# Seed the local D1 database
npx wrangler d1 execute hanniel-email-meta --local --file=scripts/seed-d1.sql

# Start local dev server (runs via Wrangler to emulate Workers environment)
npx wrangler dev
```

> Note: `npm run dev` uses the standard Next.js dev server and will not have access to `getCloudflareContext()` — use `wrangler dev` for local development to get proper D1 and secrets bindings.

---

## Deployment

```bash
# Build the Next.js app and package it for Cloudflare Workers
npm run build

# Deploy to Cloudflare Workers
npx wrangler deploy

# Seed the production D1 database (first deploy only)
npx wrangler d1 execute hanniel-email-meta --file=scripts/seed-d1.sql
```

The app is deployed to a custom domain (`admin.hanniel.co`) configured as a Cloudflare Worker route in `wrangler.jsonc`.

---

## Self-Hosting

This project is domain-specific (`hanniel.co` is hardcoded in `src/lib/cloudflare.ts`), but adapting it to another domain takes two steps:

1. Change `DOMAIN` in `src/lib/cloudflare.ts`
2. Update the `routes` and D1 `database_name` in `wrangler.jsonc`

Everything else — auth, routing, metadata storage — is generic.

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── aliases/          # CRUD for email routing rules + metadata
│   │   │   ├── route.ts      # GET (list), POST (create)
│   │   │   ├── [id]/route.ts # PUT (update), DELETE
│   │   │   └── bulk/route.ts # POST (bulk create, max 50)
│   │   ├── auth/route.ts     # POST (login), DELETE (logout)
│   │   └── dns/route.ts      # GET (DNS health check)
│   ├── aliases/
│   │   ├── new/              # Single alias creation form
│   │   └── bulk/             # Bulk alias creation form
│   ├── gmail-filters/        # Gmail filter XML export
│   ├── sending-guide/        # SMTP setup instructions
│   └── login/                # Auth page
├── components/               # UI components (shadcn/ui + custom)
├── lib/
│   ├── auth.ts               # Session management, HMAC signing
│   ├── cloudflare.ts         # CF API client factory, env accessors
│   ├── d1.ts                 # D1 query helpers
│   ├── gmail-filters.ts      # Gmail filter XML generator
│   └── types.ts              # Shared TypeScript types
└── middleware.ts             # Edge auth middleware
```

---

## Credential Audit

No credentials, tokens, or secrets are committed to this repository at any point in its git history. All sensitive values are:

- Loaded at runtime from Cloudflare Workers secrets via `getCloudflareContext()`
- Listed in `.gitignore` (`.env*`, `.dev.vars`, `.wrangler/`)
- Never referenced by value in source code

The `wrangler.jsonc` contains a D1 database ID (`database_id`), which is a project reference used by the Wrangler CLI — it is not an authentication credential and cannot be used to access data without a valid API token.

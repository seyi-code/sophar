# Sophar

**Specialized Knowledge Assistant Platform** — production-ready multi-agent RAG system with real token streaming, generative UI, multi-tenant isolation, and vertical product strategy.

First vertical: **Enterprise Knowledge**. Second: **Legal / Compliance**.

## Features

- **Real token-level streaming** via Vercel AI SDK `streamText` + SSE (`/api/chat/stream`)
- **Multi-agent orchestration**: Researcher → Critic → Synthesizer tool-loop
- **RAG / knowledge layer**: chunking, embeddings, pgvector retrieval, multi-tenant isolation
- **Generative UI**: Chart, Table, Sources, Callout components rendered from JSON trees
- **E2B code interpreter** (with local stub fallback)
- **Better Auth**: email/password + Google / GitHub social
- **Drizzle ORM** + Postgres for chats, messages, documents, orgs
- **Golden-set eval harness**: faithfulness / completeness / citation scoring
- **Vertical configuration**: domain prompts, tools, sample corpus (enterprise + legal)
- **Polished onboarding** with real org creation API

## Quick Start

```bash
# 1. Clone
git clone https://github.com/seyi-code/sophar.git
cd sophar

# 2. Install
npm install

# 3. Environment
cp .env.local.example .env.local
# Fill DATABASE_URL, OPENAI_API_KEY (or compatible), BETTER_AUTH_SECRET, etc.

# 4. Database
npx drizzle-kit push
# optional seed
npx tsx scripts/seed-enterprise.ts
npx tsx scripts/seed-legal.ts

# 5. Dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

See `.env.local.example` for the full list. Critical ones:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Postgres connection string (Neon recommended) |
| `OPENAI_API_KEY` | Embeddings + chat (or Azure / compatible) |
| `BETTER_AUTH_SECRET` | Random 32+ char secret |
| `BETTER_AUTH_URL` | App URL (e.g. http://localhost:3000) |
| `TAVILY_API_KEY` / `SERPER_API_KEY` | Optional web search |
| `E2B_API_KEY` | Optional code interpreter |

## Architecture

```
app/
  api/chat/stream/     # SSE multi-agent stream + persistence
  api/knowledge/       # ingest / list / delete documents
  api/organizations/   # org create + list
  api/eval/            # golden-set runner
  api/auth/[...all]/  # Better Auth handler
lib/
  agents/orchestrator.ts   # Researcher-Critic-Synthesizer
  tools/registry.ts        # knowledge_search, web_search, code_interpreter
  knowledge/store.ts       # chunk + embed + retrieve
  verticals/               # enterprise.ts, legal.ts domain configs
  eval/                    # golden-set + harness
  db/schema.ts             # full multi-tenant schema
components/
  generative/              # Chart, Table, Sources, Callout
  chat/                    # MessageList, ChatInput, AgentSteps
  knowledge/KnowledgePanel
  onboarding/Onboarding
```

## Verticals

- **Enterprise**: internal policy, process, and knowledge Q&A with citation-heavy answers.
- **Legal**: contract / regulation / compliance focused prompts and sample corpus.

Switch via organization `vertical` field or onboarding selection.

## Eval

```bash
npx tsx scripts/run-eval.ts
# or POST /api/eval
```

Scores faithfulness, completeness, and citation quality against the golden set.

## Deploy (Vercel)

1. Connect the GitHub repo to Vercel.
2. Set environment variables in the Vercel dashboard.
3. Add a Neon (or other) Postgres database and set `DATABASE_URL`.
4. Deploy. Run `drizzle-kit push` against the production DB once.

`vercel.json` is included for sensible defaults.

## Monetization Notes

- Per-seat / per-org SaaS for Enterprise Knowledge
- Usage-based (tokens + retrieval volume)
- Vertical expansion (Legal, later Healthcare / Finance) as higher-ARPU tiers
- Self-serve free tier with limited documents + paid knowledge packs

## License

MIT

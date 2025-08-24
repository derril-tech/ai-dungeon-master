# Architecture Overview — AI Dungeon Master

## Topology
- **Frontend**: Next.js 14 (Vercel), TS, shadcn/Tailwind, TanStack Query + Zustand, WebSocket/SSE, HTML5 Canvas for maps.
- **API Gateway**: NestJS (REST, RBAC, OpenAPI, rate limits, idempotency).
- **Auth**: Auth.js + JWT; SAML/OIDC, SCIM for orgs.
- **Orchestrator**: FastAPI + CrewAI FSM (created→staging→exploring→encounter→combat→downtime→paused→completed).
- **Workers**:
  - `rules-engine` — dice expressions, DCs, checks.
  - `combat-runtime` — initiative, turn log, effects.
  - `map-service` — fog, tokens, layers, exports.
  - `npc-brain` — persona dialogue + memory.
  - `loot-gen` — loot tables, rarity, shops.
  - `exporter` — journals, encounter cards, VTT bundles.
- **Infra**: NATS (event bus), Celery (Redis), Postgres + pgvector, S3/R2 storage, Upstash Redis cache, WebSocket gateway, OTel + Prometheus/Grafana + Sentry.

## Data Model
- **Tenancy**: orgs, users, memberships.
- **Campaigns/Sessions**: campaigns (ruleset, tone, difficulty, seed), sessions (status, settings, logs).
- **Characters/NPCs**: character sheets, npc personas (with embeddings).
- **Rules/Mechanics**: rules_refs (RAG embeddings).
- **Maps/Tokens**: maps (grid, fog, lighting, layers), tokens (position, stats, vision).
- **Encounters/Combat**: encounters, initiative, turn_log, rolls, rulings.
- **Loot/Economy**: loot items, shops.
- **Journals/Exports**: journals (embedding for recall), exports (ZIP bundles).
- **Audit/Costs**: audit_log, costs.

## API Surface
- **Auth**: login, refresh, me, orgs.
- **Campaigns/Sessions**: CRUD campaigns, start/pause/resume/end sessions, transcript retrieval.
- **Characters/NPCs**: create sheets, spawn NPCs, add memory.
- **Maps/Tokens**: create maps, fog ops, token CRUD/move, export PNG+JSON.
- **Rules/Combat**: roll, start encounter, initiative, turn progression, action resolution.
- **Loot/Exports**: loot generation, export session artifacts.

## Orchestration Logic
- **Agents**: Dungeon Master, NPC Actors, Rules Lawyer, Combat Resolver, Worldbuilder, Mapwright, Lootmaster, Safety Moderator, Session Scribe.
- **Turn Loop**: Exploration → narration + skill checks → NPC reaction → map update → log. Combat → initiative → declare → roll → apply → log → next.
- **Safety**: all outputs gated by Safety Moderator.

## Realtime
- Channels: session:{id}:narration, session:{id}:rules, session:{id}:combat, session:{id}:map, session:{id}:chat.
- SSE fallback for restricted networks.

## Security
- RBAC: GM/Player/Spectator; DM Console privileged.
- RLS per org/campaign/session.
- Content filters + safety lines/veils enforced.
- Audit log for overrides, exports, session ends.

## Deployment
- FE: Vercel.
- APIs/Workers: Render/Fly/GKE.
- DB: Neon/Cloud SQL Postgres + pgvector.
- Cache: Upstash Redis.
- Storage: S3/R2.
- Event Bus: NATS.
- CI/CD: GitHub Actions.
- Terraform modules for infra.

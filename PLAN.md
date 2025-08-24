# Project Plan — AI Dungeon Master

## Current Goal
Build an MVP slice: user creates a campaign (choose ruleset + tone) → launches a session → AI Dungeon Master narrates exploration → players roll skill checks → NPCs respond with memory → combat initiated with initiative tracker → export Journal + Encounter Cards + Map bundle.

Runs locally via docker-compose (Postgres+pgvector, Redis, NATS, MinIO). Frontend on Vercel; APIs/workers on Render.

## 80/20 Build Strategy
- 80% [Cursor]: repo scaffold, REST/OpenAPI surfaces, DB migrations, FE routes/components, CI/CD infra, exports.
- 20% [Claude]: agent prompts (Dungeon Master, NPC Actor, Combat Resolver, Safety Moderator, Scribe), rules embeddings, pacing heuristics, narrative tone sliders.

## Next 3 Tasks
1. [Claude] Iterate DM/NPC prompts, safety heuristics, pacing logic, loot flavor.
2. [Cursor] Performance optimization and load testing validation.
3. [Cursor] Production deployment and monitoring setup.

## Phase Plan
- **P0 Repo/Infra** — scaffolds, envs, CI.
- **P1 Contracts** — DB schema + API endpoints + orchestrator FSM.
- **P2 Exploration** — Narration + skill checks + NPC memory.
- **P3 Combat** — Initiative, rolls, turn log, conditions.
- **P4 Maps/Tokens** — Map canvas, fog-of-war, token CRUD.
- **P5 Loot/Exports** — Loot generator, session journal, encounter cards, VTT bundles.
- **P6 Hardening/Deploy** — moderation, observability, CI/CD, infra.

## Definition of Done (MVP)
- Campaign → Session → Exploration → Combat → Export.
- Narration first partial < 2.0s P95.
- Dice roll resolved < 800ms P95 (server authoritative).
- Export bundle (journal + maps + encounter cards) generated successfully.

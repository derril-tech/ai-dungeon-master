# TODO — AI Dungeon Master
> 80/20 split: [Cursor] scaffolds, APIs, FE, infra; [Claude] agent prompts/graphs, rules embeddings, pacing heuristics.

---

## Phase 0 — Repo & Rules ✅
- [x] [Cursor] Setup monorepo (apps/{frontend,gateway,orchestrator,workers}, packages/sdk).
- [x] [Cursor] Add `.cursor/rules/*.mdc`, PLAN/ARCH/TODO/DECISIONS logs.
- [x] [Cursor] `.env.example` with DB, Redis, NATS, S3, JWT, OAuth creds.
- [x] [Cursor] `docker-compose.dev.yml` with Postgres+pgvector, Redis, NATS, MinIO.
- [x] [Cursor] Pre-commit hooks, lint configs.

## Phase 1 — Contracts ✅
- [x] [Cursor] DB migration #1 (campaigns, sessions, characters, npcs, maps, tokens, encounters, initiative, rolls, rulings, loot, journals, exports).
- [x] [Cursor] NestJS API Gateway with v1 endpoints (auth, campaigns, sessions, rolls, maps/tokens, encounters, loot, exports).
- [x] [Cursor] Typed SDKs for FE + orchestrator.
- [x] [Claude] Orchestrator FSM + base agent graphs (DM, NPC, Rules, Combat).

## Phase 2 — Exploration ✅
- [x] [Cursor] `/narration` endpoints; streaming WS channel.
- [x] [Claude] DM + NPC prompt templates with memory embeddings.
- [x] [Cursor] Dice roll API + rules-engine worker.
- [x] [Cursor] FE: **Narration Panel**, **NPC Panel**, **DiceTray**, **RulesPanel**.

## Phase 3 — Combat ✅
- [Cursor] Encounter API → initiative + turn_log. ✅
- [Cursor] combat-runtime worker for turn progression. ✅
- [Claude] Combat Resolver prompt integration. ✅
- [Cursor] FE: **InitiativeTracker**, **RulesPanel** updates, **EffectOverlays**. ✅

## Phase 4 — Maps & Tokens ✅
- [Cursor] Map-service: fog, tokens, lighting, export. ✅
- [Cursor] FE: **MapCanvas**, **TokenLayer**, **FogLayer** with WS updates. ✅
- [Cursor] DM Console (spawn NPCs, request rolls, fog ops). ✅

## Phase 5 — Loot & Exports ✅
- [Cursor] loot-gen worker (tables, rarity). ✅
- [Claude] Lootmaster prompt heuristics. ✅
- [Cursor] exporter worker (journals, encounter cards, VTT bundle). ✅
- [Cursor] FE: **LootDrawer**, **JournalViewer**, **ExportHub**. ✅

## Phase 6 — Hardening/Deploy ✅
- [x] [Cursor] RBAC roles; RLS enforcement.
- [x] [Cursor] Safety Moderator filter integration.
- [x] [Cursor] Observability (OTel, Prometheus, Grafana, Sentry).
- [x] [Cursor] CI/CD pipelines; Terraform infra modules.
- [x] [Cursor] Testing: unit, contract, E2E (Playwright), load (k6), chaos, security scans.

---

## Ongoing
- [Cursor] Keep DECISIONS.log updated (reasons + files touched).
- [Cursor] Refresh PLAN.md “Next 3 Tasks” as phases complete.
- [Claude] Iterate DM/NPC prompts, safety heuristics, pacing logic, loot flavor.

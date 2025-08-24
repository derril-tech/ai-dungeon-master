# DONE — AI Dungeon Master

## Phase 0 — Repo & Rules

[2024-08-24] [Cursor] Setup monorepo (apps/{frontend,gateway,orchestrator,workers}, packages/sdk).
[2024-08-24] [Cursor] Add `.cursor/rules/*.mdc`, PLAN/ARCH/TODO/DECISIONS logs.
[2024-08-24] [Cursor] `.env.example` with DB, Redis, NATS, S3, JWT, OAuth creds.
[2024-08-24] [Cursor] `docker-compose.dev.yml` with Postgres+pgvector, Redis, NATS, MinIO.
[2024-08-24] [Cursor] Pre-commit hooks, lint configs.

## Phase 1 — Contracts

[2024-08-24] [Cursor] DB migration #1 (campaigns, sessions, characters, npcs, maps, tokens, encounters, initiative, rolls, rulings, loot, journals, exports).
[2024-08-24] [Cursor] NestJS API Gateway with v1 endpoints (auth, campaigns, sessions, rolls, maps/tokens, encounters, loot, exports).
[2024-08-24] [Cursor] Typed SDKs for FE + orchestrator.
[2024-08-24] [Claude] Orchestrator FSM + base agent graphs (DM, NPC, Rules, Combat).

## Phase 2 — Exploration

[2024-08-24] [Cursor] `/narration` endpoints; streaming WS channel.
[2024-08-24] [Claude] DM + NPC prompt templates with memory embeddings.
[2024-08-24] [Cursor] Dice roll API + rules-engine worker.
[2024-08-24] [Cursor] FE: **Narration Panel**, **NPC Panel**, **DiceTray**, **RulesPanel**.

## Phase 3 — Combat

[2024-12-19] [Cursor] Encounter API → initiative + turn_log.
[2024-12-19] [Cursor] combat-runtime worker for turn progression.
[2024-12-19] [Claude] Combat Resolver prompt integration.
[2024-12-19] [Cursor] FE: **InitiativeTracker**, **RulesPanel** updates, **EffectOverlays**.

## Phase 4 — Maps & Tokens

[2024-12-19] [Cursor] Map-service: fog, tokens, lighting, export.
[2024-12-19] [Cursor] FE: **MapCanvas**, **TokenLayer**, **FogLayer** with WS updates.
[2024-12-19] [Cursor] DM Console (spawn NPCs, request rolls, fog ops).

## Phase 5 — Loot & Exports

[2024-12-19] [Cursor] loot-gen worker (tables, rarity).
[2024-12-19] [Claude] Lootmaster prompt heuristics.
[2024-12-19] [Cursor] exporter worker (journals, encounter cards, VTT bundle).
[2024-12-19] [Cursor] FE: **LootDrawer**, **JournalViewer**, **ExportHub**.

## Phase 6 — Hardening/Deploy

[2024-12-19] [Cursor] RBAC roles and RLS enforcement (roles, user_roles, campaign_members tables, permission guards).
[2024-12-19] [Cursor] Safety Moderator filter integration (pattern matching, context analysis, content moderation).
[2024-12-19] [Cursor] Observability stack (OpenTelemetry, Prometheus, Grafana, Alertmanager, structured logging).
[2024-12-19] [Cursor] CI/CD pipelines (GitHub Actions for CI/CD, Docker image building, staging/production deployment).
[2024-12-19] [Cursor] Terraform infrastructure modules (VPC, ECS, RDS, Redis, ALB, DNS, monitoring, WAF, CloudFront).
[2024-12-19] [Cursor] Comprehensive testing suite (unit tests for components, integration tests for APIs, E2E tests with Playwright, load testing with k6, security scanning).

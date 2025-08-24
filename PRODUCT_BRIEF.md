AI DUNGEON MASTER — END‑TO‑END PRODUCT BLUEPRINT
(React 18 + Next.js 14 App Router; CrewAI multi‑agent orchestration; TypeScript‑first contracts.)
1) Product Description & Presentation
One‑liner:
A multi‑agent tabletop RPG engine where AI “Dungeon Master,” “NPC Actors,” and “Combat/Rules” agents run fully playable campaigns—encounters, dialogue, maps, initiative, skill checks, loot, and session notes—with safety tools and exportable artifacts.
Positioning:
•
For game masters, players, educators, and actual‑play streamers who want cinematic, rules‑aware sessions with dynamic worldbuilding.
•
Outputs session transcripts, battle maps, stat blocks, loot tables, campaign journals, and encounter cards—ready for VTT import.
Demo narrative:
1.
Create a campaign → pick a ruleset (Open SRD‑style or custom) + tone + theme.
2.
Upload/choose assets (maps, tokens), pick difficulty, party size, and world seeds.
3.
Start session: agents narrate scene, role‑play NPCs, roll checks, resolve turns; DM Console lets you inject twists.
4.
End of session: auto‑generated Journal, XP & Loot, Next‑session hooks, and export bundle (maps, tokens, JSON).
2) Target User
•
Home groups (casual & hardcore), looking to offload prep and keep momentum.
•
Game masters wanting a co‑GM to pace scenes and manage combat.
•
Educators using RPGs for engagement & storytelling.
•
Actual‑play streamers needing reliable pace, maps, and recap artifacts.
•
New players learning rules via guided play.
3) Features & Functionalities (Extensive)
Play & Narrative
•
AI Dungeon Master: narrates scenes, sets stakes, runs checks, frames choices.
•
NPC Actors: distinct voices, motives; persistent memories; dynamic reactions.
•
Scene Pacing: tension curve model; cliffhangers; spotlight balancing across players.
•
Safety Tools: lines/veils, content tags, “pause” card; session tone sliders.
Rules & Combat
•
Ruleset Engine: pluggable SRD‑style mechanics (skills, DCs, advantage/disadvantage, saves).
•
Initiative & Turn Order: auto trackers, read‑outs, conditions, timers.
•
Skill/Attack Rolls: dice expressions (2d20kh1 + mod), advantage/disadvantage, contested checks.
•
Combat Resolver: hit/miss, damage rolls, crits, conditions, concentration, death saves (if applicable).
•
Encounter Builder: CR/XP budgeting, terrain effects, lair actions; difficulty estimator.
World, Maps & Tokens
•
Map Builder: grid/hex; fog‑of‑war; lighting toggles; terrain layers; labels.
•
Token Manager: upload tokens; size/speed/AC/HP; aura/vision; conditions overlay.
•
Procedural Locations: dungeons, towns, wilderness; keyed rooms w/ notes.
•
Loot & Economy: tables, shops, crafting; rarity, attunement, encumbrance.
Characters & Progression
•
Character Sheets: attributes, proficiencies, features, inventory, spells.
•
Level‑up: XP thresholds, subclass choices; hit points; skill increases.
•
Conditions & Effects: ongoing timers; reminders at turn start/end.
Collaboration
•
Party Lobby with invites; roles (GM, Player, Spectator).
•
Realtime chat + reactions; optional voice (WebRTC optional, gated).
•
DM Console: force re‑roll, inject event, tweak DCs, spawn NPCs/monsters.
Artifacts & Exports
•
Session Journal with chapter headings & bookmarks.
•
Encounter Cards (printable); Stat Blocks; Loot Lists; Map PNGs/JSON.
•
VTT export (generic JSON + images; avoids proprietary formats).
4) Backend Architecture (Extremely Detailed & Deployment‑Ready)
4.1 High‑Level Topology
•
Frontend/BFF: Next.js 14 (Vercel).
•
API Gateway: Node/NestJS (REST, OpenAPI, RBAC, rate limits, idempotency).
•
Auth: Auth.js (OAuth) + JWT (short‑lived) + rotating refresh; SAML/OIDC for orgs; SCIM optional.
•
Orchestration: CrewAI Orchestrator (Python FastAPI) with agents: Dungeon Master (lead), NPC Actor(s), Combat Resolver, Rules Lawyer, Worldbuilder, Mapwright, Lootmaster, Safety Moderator, Session Scribe.
•
Workers (Python):
o
rules-engine (resolves dice/skill/DC/conditions)
o
combat-runtime (initiative, effects, status loops)
o
map-service (tiles, fog, tokens, collision)
o
npc-brain (persona memories, dialogue acts)
o
loot-gen (tables, rarity, attunement)
o
exporter (journal/maps/stat blocks bundles)
•
Event Bus: NATS (session.*, combat.*, map.*, export.*).
•
Queue/Tasks: Celery (Redis/NATS).
•
DB: Postgres (Neon/Cloud SQL) + pgvector for lore, rules snippets, persona memory.
•
Object Storage: S3/R2 (maps, tokens, exports).
•
Cache: Upstash Redis (presence, session hot state, initiative order).
•
Realtime: WebSocket gateway (NestJS Gateway) + SSE fallback; room channels per session.
•
Observability: OpenTelemetry tracing; Prometheus/Grafana; Sentry; structured logs.
•
Secrets: Cloud secrets manager/Vault; KMS.
4.2 Service Responsibilities
1.
api-gateway (NestJS)
a.
TLS, auth/RBAC, zod/ajv validation, OpenAPI, Idempotency‑Key, request quotas.
b.
Proxies to orchestrator/workers; signs upload URLs for assets.
2.
auth-service
a.
OAuth, email magic links; session mgmt; SAML/OIDC; SCIM (optional).
3.
orchestrator (FastAPI + CrewAI)
a.
State machine per session: created → staging (party) → exploring → encounter → combat → downtime → completed/paused.
b.
Coordinates agent turns; enforces Safety Moderator filters; yields structured outputs (narration, rulings, map ops).
c.
Emits tick events (narration.partial, npc.line, roll.requested, ruling.made, map.update).
4.
rules-engine (worker)
a.
Parses dice expressions; applies advantage/disadvantage; calculates DC success.
b.
Resolves checks, saves, damage types, resistances/vulnerabilities; concentration/condition timers.
c.
Materializes Ruling objects with audit trail.
5.
combat-runtime (worker)
a.
Manages initiative, turn progression, effects; opportunity triggers; lair/legendary actions.
b.
Syncs with map-service (positions, ranges, LoS).
c.
Produces TurnLog with applied changes.
6.
map-service (worker)
a.
Tiles & layers; fog‑of‑war masks; lighting toggles; token CRUD; pathfinding hooks.
b.
Generates map thumbnails & export JSON; keeps authoritative state.
7.
npc-brain (worker)
a.
Persona memories, relationships; goals; dialogue acts (ask/argue/persuade/taunt).
b.
Deception/insight checks via rules‑engine as needed.
8.
loot-gen (worker)
a.
Table lookups; rarity rolls; shop inventories; crafting outcomes; encumbrance checks.
9.
exporter (worker)
a.
Builds Session Journal (PDF/HTML), Encounter Cards (PDF), Stat Blocks (JSON/PDF), VTT bundle (generic JSON + PNGs).
10.
billing-service
•
Stripe (seats + metered tokens/compute).
11.
analytics-service
•
Session lengths, completion rates, encounter win %, check success distributions, rule conflicts surfaced.
4.3 Data Model (Postgres + pgvector)
-- Tenancy & Users CREATE TABLE orgs (id UUID PRIMARY KEY, name TEXT NOT NULL, plan TEXT, created_at TIMESTAMPTZ DEFAULT now()); CREATE TABLE users (id UUID PRIMARY KEY, org_id UUID REFERENCES orgs(id), email CITEXT UNIQUE, name TEXT, role TEXT, created_at TIMESTAMPTZ DEFAULT now()); -- Campaigns & Sessions CREATE TABLE campaigns ( id UUID PRIMARY KEY, org_id UUID, name TEXT, ruleset TEXT, tone JSONB, difficulty TEXT, world_seed TEXT, created_by UUID REFERENCES users(id), created_at TIMESTAMPTZ DEFAULT now() ); CREATE TABLE sessions ( id UUID PRIMARY KEY, campaign_id UUID REFERENCES campaigns(id),
status TEXT CHECK (status IN ('created','staging','exploring','encounter','combat','downtime','paused','completed','failed')), started_at TIMESTAMPTZ, ended_at TIMESTAMPTZ, settings JSONB ); -- Characters & NPCs CREATE TABLE characters ( id UUID PRIMARY KEY, campaign_id UUID, owner_user_id UUID, name TEXT, ancestry TEXT, class TEXT, level INT, stats JSONB, proficiencies JSONB, features JSONB, inventory JSONB, spells JSONB, conditions JSONB, sheet JSONB, created_at TIMESTAMPTZ DEFAULT now() ); CREATE TABLE npcs ( id UUID PRIMARY KEY, campaign_id UUID, name TEXT, role TEXT, stat_block JSONB, persona JSONB, memory VECTOR(1536), created_at TIMESTAMPTZ DEFAULT now() ); -- Rules/Mechanics CREATE TABLE rules_refs ( id UUID PRIMARY KEY, ruleset TEXT, section TEXT, text TEXT, embedding VECTOR(1536) ); -- Maps & Tokens CREATE TABLE maps ( id UUID PRIMARY KEY, campaign_id UUID, name TEXT, grid TEXT CHECK (grid IN ('square','hex')), width INT, height INT, fog JSONB, lighting JSONB, layers JSONB, s3_key TEXT, created_at TIMESTAMPTZ DEFAULT now() ); CREATE TABLE tokens ( id UUID PRIMARY KEY, map_id UUID REFERENCES maps(id), owner_kind
TEXT CHECK (owner_kind IN ('pc','npc','monster')), owner_id UUID, x INT, y INT, facing INT, size TEXT, vision JSONB, auras JSONB, conditions JSONB ); -- Encounters & Combat CREATE TABLE encounters ( id UUID PRIMARY KEY, campaign_id UUID, name TEXT, environment TEXT, difficulty TEXT, participants JSONB, -- list of token/creature refs budget JSONB, notes TEXT, created_at TIMESTAMPTZ DEFAULT now() ); CREATE TABLE initiative ( id BIGSERIAL PRIMARY KEY, session_id UUID REFERENCES sessions(id), round INT, order_idx INT, participant_kind TEXT, participant_id UUID, current_hp INT, temp_hp INT, conditions JSONB ); CREATE TABLE turn_log ( id BIGSERIAL PRIMARY KEY, session_id UUID, round INT, actor_kind TEXT, actor_id UUID, action TEXT, payload JSONB, created_at TIMESTAMPTZ DEFAULT now() ); -- Rolls & Rulings CREATE TABLE rolls ( id BIGSERIAL PRIMARY KEY, session_id UUID, roller_kind TEXT, roller_id UUID, expr TEXT, raw_result JSONB, total INT, advantage TEXT, dc INT, success BOOLEAN, created_at TIMESTAMPTZ DEFAULT now() ); CREATE TABLE rulings ( id BIGSERIAL PRIMARY KEY, session_id UUID, rule_ref_id UUID, context JSONB, outcome JSONB, created_at TIMESTAMPTZ DEFAULT now() );
-- Loot, Shops, Economy CREATE TABLE loot ( id BIGSERIAL PRIMARY KEY, session_id UUID, source TEXT, items JSONB, total_value NUMERIC, created_at TIMESTAMPTZ DEFAULT now() ); -- Journals & Exports CREATE TABLE journals ( id UUID PRIMARY KEY, session_id UUID, content JSONB, -- structured chapters embedding VECTOR(1536), created_at TIMESTAMPTZ DEFAULT now() ); CREATE TABLE exports ( id UUID PRIMARY KEY, session_id UUID, kind TEXT, s3_key TEXT, meta JSONB, created_at TIMESTAMPTZ DEFAULT now() ); -- Audit & Costs CREATE TABLE audit_log ( id BIGSERIAL PRIMARY KEY, org_id UUID, user_id UUID, action TEXT, target TEXT, meta JSONB, created_at TIMESTAMPTZ DEFAULT now() ); CREATE TABLE costs ( id BIGSERIAL PRIMARY KEY, org_id UUID, session_id UUID, provider TEXT, resource TEXT, qty NUMERIC, usd NUMERIC, created_at TIMESTAMPTZ DEFAULT now() );
4.4 API Surface (REST /v1, OpenAPI)
Auth & Orgs
•
POST /v1/auth/login / POST /v1/auth/token / POST /v1/auth/refresh
•
GET /v1/me
•
POST /v1/orgs / GET /v1/orgs/:id
Campaigns & Sessions
•
POST /v1/campaigns {name, ruleset, tone, difficulty, world_seed}
•
GET /v1/campaigns/:id / list with filters
•
POST /v1/sessions {campaign_id, settings}
•
POST /v1/sessions/:id/start | pause | resume | end
•
GET /v1/sessions/:id/state / GET /v1/sessions/:id/transcript (paged)
•
POST /v1/sessions/:id/inject {event} (GM‑only)
Characters & NPCs
•
POST /v1/characters {sheet} / PATCH /v1/characters/:id
•
POST /v1/npcs {stat_block, persona}
•
POST /v1/npcs/:id/memory/add {text}
Maps & Tokens
•
POST /v1/maps {grid, size, layers}
•
POST /v1/maps/:id/fog {polygon|rect|clear}
•
POST /v1/maps/:id/tokens {owner_ref, x, y, ...}
•
PATCH /v1/tokens/:id/move {x,y}
•
POST /v1/maps/:id/export → PNG + JSON
Rules & Combat
•
POST /v1/rules/roll {expr, advantage?, dc?}
•
POST /v1/encounters {participants, environment}
•
POST /v1/encounters/:id/start → initiative created
•
POST /v1/initiative/:id/next → turn progression
•
POST /v1/turn/action {actor, action, target?, dice?, effect?}
Loot & Exports
•
POST /v1/loot/generate {tables, rarity}
•
POST /v1/exports/session {session_id, bundle: ['journal','maps','statblocks','vtt']}
Conventions
•
Idempotency‑Key for all mutating routes.
•
Problem+JSON error format.
•
Cursor pagination; Row‑Level Security by org/campaign/session.
4.5 Orchestration Logic (CrewAI)
Agents & Tooling
•
Dungeon Master (lead): scene framing; asks for checks; escalates stakes; delegates to Rules Lawyer/Combat Resolver.
•
NPC Actor(s): multi‑persona pool; each with memory vector & goals; DialogueAct tool.
•
Rules Lawyer: consults rules_refs via RAG.search (pgvector); proposes rulings with citations.
•
Combat Resolver: drives initiative/turns; calls rules-engine for rolls/damage/conditions.
•
Worldbuilder: location generation, hooks, factions; updates lore DB.
•
Mapwright: map ops (fog, tokens, labels); ensures state sync with map-service.
•
Lootmaster: treasure/shop inventories; rarity & attunement logic.
•
Safety Moderator: content filter; enforces lines/veils; pauses flow if breached.
•
Session Scribe: captures structured journal & bookmarks.
Turn Sequence (Exploration)
1.
DM narrates → requests skill checks (Perception/Stealth/etc.).
2.
Rules Lawyer computes DC & evaluates results; DM branches scene outcome.
3.
NPC Actor reacts; Worldbuilder may spawn hooks; Mapwright updates markers.
Turn Sequence (Combat)
1.
Encounter start → initiative order; per‑turn: Declare → Roll/Resolve → Apply Effects → Log.
2.
Combat Resolver calls rules‑engine; Mapwright updates token states; Scribe writes turn summary.
Safety
•
Any agent output flows through Safety Moderator; if violation → redact or re‑prompt; GM override logged.
4.6 Background Jobs
•
BuildWorldSeed(campaignId) → initial factions/locations.
•
GenerateEncounter(campaignId, difficulty) → participants + terrain + notes.
•
RenderMap(mapId) → thumbnails + export JSON.
•
WriteJournal(sessionId) periodically and on end.
•
BundleExports(sessionId) → ZIP of artifacts.
•
CostRollup(orgId), RetentionSweeper(), AlertOnFailure(jobId).
4.7 Realtime
•
WS channels:
o
session:{id}:narration (partials/finals)
o
session:{id}:rules (roll prompts/results)
o
session:{id}:combat (initiative/turn ticks)
o
session:{id}:map (fog/tokens/labels)
o
session:{id}:chat (party chat)
•
Presence & roles (GM/Player/Spectator); SSE fallback.
4.8 Caching & Performance
•
Redis keys: sess:{id}:state, sess:{id}:init, map:{id}:fog, npc:{id}:mem.
•
Warm caches for rules lookups (common sections); pre‑chunked rules SRD with embeddings.
•
Concurrency caps per session & per org; token/cost guardrails.
•
SLOs: narration first partial < 2.0s P95; roll resolution < 800ms P95; map op echo < 300ms P95.
4.9 Observability
•
OTel traces across gateway → orchestrator → rules/combat/map workers.
•
Metrics: turns/minute, rule conflict rate, re‑prompt rate (safety), combat round length, map op latency, export success %.
•
Logs: structured with correlation ids; PII‑safe; per‑session trace id; DM overrides audited.
5) Frontend Architecture (React 18 + Next.js 14)
5.1 Tech Choices
•
Next.js 14 App Router, TypeScript, Server Components for heavy lists; Client Components for canvas & realtime.
•
UI: shadcn/ui + Tailwind.
•
State: TanStack Query (server cache) + Zustand (ephemeral UI/session).
•
Realtime: WebSocket client with reconnect/backoff; SSE fallback.
•
Canvas: HTML5 Canvas / WebGL for MapCanvas (no external libs required, but PixiJS is optional).
•
Forms/Validation: react‑hook‑form + Zod with shared schemas.
•
Audio: (Optional) WebAudio for dice sounds; WebRTC gated behind feature flag.
5.2 App Structure
/app /(marketing)/page.tsx /(app) dashboard/page.tsx campaigns/ page.tsx new/page.tsx [campaignId]/ page.tsx // Campaign Overview settings/page.tsx sessions/ new/page.tsx [sessionId]/ page.tsx // Play Room journal/page.tsx exports/page.tsx admin/ usage/page.tsx audit/page.tsx /components DMConsole/* PartyPanel/*
NPCPanel/* RulesPanel/* DiceTray/* InitiativeTracker/* MapCanvas/* TokenLayer/* FogLayer/* EffectOverlays/* LootDrawer/* ChatDock/* SafetyTools/* JournalViewer/* ExportHub/* /lib api-client.ts ws-client.ts zod-schemas.ts rbac.ts /store useSessionStore.ts useMapStore.ts useCombatStore.ts useUIStore.ts
5.3 Key Pages & UX Flows
Dashboard
•
Cards: “Resume Session”, “New Campaign”, “Your Exports”.
•
Stats: sessions run, avg length, encounters won.
Campaign New/Settings
•
Ruleset pick (SRD‑style or custom), tone sliders, difficulty, safety lines/veils.
•
Brand/theme (optional) for journals & cards.
Play Room (Session View) — 3‑pane layout
1.
Center: MapCanvas
a.
Grid/hex toggle, zoom/pan; TokenLayer (drag/rotate); FogLayer (paint, reveal); EffectOverlays (conditions, auras).
2.
Left: Narrative & Panels
a.
Narration Stream (tokenized incremental text), NPC Panel (current speaker face/name), Rules Panel (latest rolls/rulings), Initiative Tracker.
3.
Right: DM Console & Party Panel
a.
DM Console: spawn NPC/monster, request checks, apply conditions, inject event, set DC, end round.
b.
Party Panel: character list; open Character Sheet drawers; use actions/items/spells.
•
DiceTray: manual roll entry for players with animation; server‑verified results shown.
•
ChatDock: OOC/IC channels; reactions; GM whisper.
Journal & Exports
•
JournalViewer: chapters/bookmarks; highlight to create a “Session Hook”.
•
ExportHub: select Journal / Encounter Cards / Stat Blocks / Map Bundle / VTT Export; generate & download.
5.4 Component Breakdown (Selected)
•
MapCanvas/CanvasRoot.tsx
Props: { map, tokens, fog, effects }. Manages offscreen buffers for fog & grid. Mouse handlers emit debounced PATCH events (/maps/:id/fog, /tokens/:id/move). Maintains optimistic UI with rollback on conflicts.
•
InitiativeTracker/OrderList.tsx
Props: { initiative, activeId }. Keyboard shortcuts (n next, b back); badges for conditions; integrates with useCombatStore.
•
DiceTray/ExpressionInput.tsx
Props: { onRoll }. Parses expressions client‑side for UX, but sends raw to server for authoritative roll; displays animated dice results synced to server total.
•
RulesPanel/RulingCard.tsx
Props: { ruling }. Shows rule citation (section), outcome, applied modifiers; “Explain” expands to show calculation steps.
•
NPCPanel/Speaker.tsx
Props: { npc, linePartial }. Streams partial lines; renders persona color/frame; “Ask follow‑up” button triggers orchestrator tool.
•
SafetyTools/Controls.tsx
Props: { lines, veils }. “Pause” card; per‑topic toggles; events broadcast to session channel; UI lock with countdown.
5.5 Data Fetching & Caching
•
Server Components for Campaign lists, Session header.
•
TanStack Query for session streams (query keys: ['session', id], ['map', id], ['initiative', id]).
•
WS events update cache via queryClient.setQueryData.
•
Prefetch next view (journal/exports) when combat ends.
5.6 Validation & Errors
•
Shared Zod schemas across FE/BE; dice expression validator with friendly hints.
•
Problem+JSON error banners; retriable actions with backoff; snackbar toasts for minor issues.
•
Idempotency headers for mutating ops (spawn/move/roll/resolve).
5.7 Accessibility & i18n
•
Keyboard ops for map actions (arrow keys move selected token; . next turn).
•
Screen‑reader labels for narration, turn changes, and rolls.
•
High‑contrast theme & color‑blind friendly condition markers.
•
next-intl scaffolding; text externalized.
6) Integrations
•
VTT Export: generic JSON + PNG map bundles (layers/tokens/labels) for import into popular tools (no proprietary SDKs).
•
Drive/Notion: store journals, cards, and stat blocks.
•
Voice (optional): WebRTC voice relay for table talk (behind feature flag).
•
Identity/SSO: Auth.js; SAML/OIDC; SCIM (enterprise).
•
Billing: Stripe (seats + metered tokens/compute).
•
Analytics: Segment → BigQuery/Snowflake (enterprise export).
•
Monitoring: Sentry; Grafana/Prometheus; optional LLM trace explorer.
7) DevOps & Deployment
•
FE: Vercel (Next.js 14).
•
APIs/Workers: Render/Fly.io; GKE for larger scale.
•
DB: Neon/Cloud SQL Postgres + pgvector (PITR).
•
Cache: Upstash Redis.
•
Object Store: S3/R2 with lifecycle rules.
•
Event Bus: NATS (managed or self‑hosted).
•
CI/CD: GitHub Actions (lint/typecheck/test, Docker build, deploy approvals).
•
IaC: Terraform modules for DB, Redis, NATS, buckets, DNS/CDN, secrets.
•
Testing:
o
Unit (rules math, dice parser, map ops)
o
Contract (OpenAPI)
o
E2E (Playwright: exploration→encounter→combat→export)
o
Load (k6: concurrent sessions; map ops per second)
o
Chaos (LLM latency)
o
Security (ZAP/containers)
8) Success Criteria
Product KPIs
•
Time to session start (from campaign create) < 3 minutes median.
•
Session completion rate ≥ 70%.
•
“GM workload reduction” self‑reported ≥ 50%.
•
30‑day retention ≥ 40% for active groups.
•
≥ 80% sessions export a Journal or VTT bundle.
Engineering SLOs
•
Narration first partial < 2.0s P95.
•
Dice roll resolution < 800ms P95 (server authoritative).
•
Map op echo < 300ms P95.
•
Export bundle generation < 30s P95.
9) Security & Compliance
•
RBAC: GM/Player/Spectator; DM Console privileged actions; least‑privilege tools.
•
Encryption: TLS 1.2+; AES‑256 at rest; envelope encryption for tokens.
•
Safety: content filters; session safety settings enforced; sensitive themes guarded.
•
Tenant Isolation: Postgres RLS by org/campaign; S3 prefix scoping per org.
•
Audit: immutable logs for GM overrides, session ends, exports.
•
Supply Chain: SLSA provenance; image signing; Dependabot; pinned base images.
•
Compliance: SOC 2 Type II roadmap; GDPR (DSRs, retention); COPPA avoidance (13+).
10) Visual/Logical Flows
Exploration Flow
Player actions → DM narrates → checks requested → rules‑engine resolves → world/map updates → Scribe logs to Journal.
Combat Flow
Encounter start → initiative order → per turn: declare → roll/resolve → apply effects → log → next actor → round advance → end → XP/loot awarded.
Map & Token Flow
DM draws fog → Map service updates mask → clients receive WS map.update → Token moves broadcast → collision/path checks (optional) → persisted to DB.
Export Flow
On session end → exporter compiles Journal (PDF/HTML), Encounter Cards, Stat Blocks, Map bundle (PNG+JSON) → ZIP & signed URL → optional push to Drive/Notion.
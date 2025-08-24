-- AI Dungeon Master Database Schema
-- Initial setup script

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";

-- Organizations and Users
CREATE TABLE orgs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    plan TEXT DEFAULT 'free',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    email CITEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Campaigns and Sessions
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    ruleset TEXT NOT NULL DEFAULT '5e',
    tone JSONB DEFAULT '{}',
    difficulty TEXT DEFAULT 'medium',
    world_seed TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('created','staging','exploring','encounter','combat','downtime','paused','completed','failed')) DEFAULT 'created',
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Characters and NPCs
CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    owner_user_id UUID REFERENCES users(id),
    name TEXT NOT NULL,
    ancestry TEXT,
    class TEXT,
    level INT DEFAULT 1,
    stats JSONB DEFAULT '{}',
    proficiencies JSONB DEFAULT '[]',
    features JSONB DEFAULT '[]',
    inventory JSONB DEFAULT '[]',
    spells JSONB DEFAULT '[]',
    conditions JSONB DEFAULT '[]',
    sheet JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE npcs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT,
    stat_block JSONB DEFAULT '{}',
    persona JSONB DEFAULT '{}',
    memory VECTOR(1536),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Rules and Mechanics
CREATE TABLE rules_refs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ruleset TEXT NOT NULL,
    section TEXT NOT NULL,
    text TEXT NOT NULL,
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Maps and Tokens
CREATE TABLE maps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    grid TEXT CHECK (grid IN ('square','hex')) DEFAULT 'square',
    width INT DEFAULT 50,
    height INT DEFAULT 50,
    fog JSONB DEFAULT '{}',
    lighting JSONB DEFAULT '{}',
    layers JSONB DEFAULT '[]',
    s3_key TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    map_id UUID REFERENCES maps(id) ON DELETE CASCADE,
    owner_kind TEXT CHECK (owner_kind IN ('pc','npc','monster')),
    owner_id UUID,
    x INT NOT NULL,
    y INT NOT NULL,
    facing INT DEFAULT 0,
    size TEXT DEFAULT 'medium',
    vision JSONB DEFAULT '{}',
    auras JSONB DEFAULT '[]',
    conditions JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Encounters and Combat
CREATE TABLE encounters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    environment TEXT,
    difficulty TEXT DEFAULT 'medium',
    participants JSONB DEFAULT '[]',
    budget JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE initiative (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    round INT DEFAULT 1,
    order_idx INT NOT NULL,
    participant_kind TEXT CHECK (participant_kind IN ('pc','npc','monster')),
    participant_id UUID NOT NULL,
    current_hp INT,
    temp_hp INT DEFAULT 0,
    conditions JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE turn_log (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    round INT NOT NULL,
    actor_kind TEXT CHECK (actor_kind IN ('pc','npc','monster')),
    actor_id UUID NOT NULL,
    action TEXT NOT NULL,
    payload JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Rolls and Rulings
CREATE TABLE rolls (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    roller_kind TEXT CHECK (roller_kind IN ('pc','npc','monster')),
    roller_id UUID NOT NULL,
    expr TEXT NOT NULL,
    raw_result JSONB NOT NULL,
    total INT NOT NULL,
    advantage TEXT CHECK (advantage IN ('normal','advantage','disadvantage')) DEFAULT 'normal',
    dc INT,
    success BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rulings (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    rule_ref_id UUID REFERENCES rules_refs(id),
    context JSONB DEFAULT '{}',
    outcome JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Loot and Economy
CREATE TABLE loot (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    source TEXT NOT NULL,
    items JSONB DEFAULT '[]',
    total_value NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Journals and Exports
CREATE TABLE journals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    content JSONB DEFAULT '{}',
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    s3_key TEXT NOT NULL,
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit and Costs
CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    target TEXT NOT NULL,
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE costs (
    id BIGSERIAL PRIMARY KEY,
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    resource TEXT NOT NULL,
    qty NUMERIC NOT NULL,
    usd NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_campaigns_org_id ON campaigns(org_id);
CREATE INDEX idx_sessions_campaign_id ON sessions(campaign_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_characters_campaign_id ON characters(campaign_id);
CREATE INDEX idx_npcs_campaign_id ON npcs(campaign_id);
CREATE INDEX idx_maps_campaign_id ON maps(campaign_id);
CREATE INDEX idx_tokens_map_id ON tokens(map_id);
CREATE INDEX idx_encounters_campaign_id ON encounters(campaign_id);
CREATE INDEX idx_initiative_session_id ON initiative(session_id);
CREATE INDEX idx_turn_log_session_id ON turn_log(session_id);
CREATE INDEX idx_rolls_session_id ON rolls(session_id);
CREATE INDEX idx_rulings_session_id ON rulings(session_id);
CREATE INDEX idx_loot_session_id ON loot(session_id);
CREATE INDEX idx_journals_session_id ON journals(session_id);
CREATE INDEX idx_exports_session_id ON exports(session_id);
CREATE INDEX idx_audit_log_org_id ON audit_log(org_id);
CREATE INDEX idx_costs_org_id ON costs(org_id);

-- Vector indexes for embeddings
CREATE INDEX idx_npcs_memory ON npcs USING ivfflat (memory vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_rules_refs_embedding ON rules_refs USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_journals_embedding ON journals USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Row Level Security (RLS) policies
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE npcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiative ENABLE ROW LEVEL SECURITY;
ALTER TABLE turn_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE rolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE rulings ENABLE ROW LEVEL SECURITY;
ALTER TABLE loot ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE costs ENABLE ROW LEVEL SECURITY;

-- Sample data for development
INSERT INTO orgs (name, plan) VALUES ('Demo Organization', 'premium');
INSERT INTO users (org_id, email, name, role) 
SELECT id, 'demo@example.com', 'Demo User', 'admin' FROM orgs WHERE name = 'Demo Organization';

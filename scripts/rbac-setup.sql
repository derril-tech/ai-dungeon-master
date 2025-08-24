-- AI Dungeon Master RBAC Setup
-- Role-based access control and Row Level Security policies

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, role_id, org_id)
);

-- Create campaign_members table for campaign-level permissions
CREATE TABLE IF NOT EXISTS campaign_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('owner', 'dm', 'player', 'observer')) NOT NULL,
    permissions JSONB DEFAULT '[]',
    joined_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(campaign_id, user_id)
);

-- Insert default roles
INSERT INTO roles (name, description, permissions) VALUES
('super_admin', 'Full system access', '["*"]'),
('org_admin', 'Organization administrator', '["org:read", "org:write", "user:read", "user:write", "campaign:read", "campaign:write", "session:read", "session:write", "billing:read", "billing:write"]'),
('org_member', 'Organization member', '["org:read", "campaign:read", "campaign:write", "session:read", "session:write"]'),
('campaign_owner', 'Campaign owner', '["campaign:read", "campaign:write", "campaign:delete", "session:read", "session:write", "character:read", "character:write", "npc:read", "npc:write", "map:read", "map:write", "encounter:read", "encounter:write"]'),
('campaign_dm', 'Campaign Dungeon Master', '["campaign:read", "session:read", "session:write", "character:read", "character:write", "npc:read", "npc:write", "map:read", "map:write", "encounter:read", "encounter:write", "combat:read", "combat:write"]'),
('campaign_player', 'Campaign player', '["campaign:read", "session:read", "character:read", "character:write", "combat:read"]'),
('campaign_observer', 'Campaign observer', '["campaign:read", "session:read", "character:read"]');

-- Enable RLS on new tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_members ENABLE ROW LEVEL SECURITY;

-- Create functions for permission checking
CREATE OR REPLACE FUNCTION get_user_org_id(user_uuid UUID)
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT org_id FROM users WHERE id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_roles(user_uuid UUID, org_uuid UUID)
RETURNS TEXT[] AS $$
BEGIN
    RETURN ARRAY(
        SELECT r.name 
        FROM roles r 
        JOIN user_roles ur ON r.id = ur.role_id 
        WHERE ur.user_id = user_uuid AND ur.org_id = org_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_permission(user_uuid UUID, required_permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_org_id UUID;
    user_role_names TEXT[];
    role_permissions JSONB;
    has_perm BOOLEAN := FALSE;
BEGIN
    -- Get user's org
    user_org_id := get_user_org_id(user_uuid);
    
    -- Get user's roles
    user_role_names := get_user_roles(user_uuid, user_org_id);
    
    -- Check if user has super_admin role
    IF 'super_admin' = ANY(user_role_names) THEN
        RETURN TRUE;
    END IF;
    
    -- Check permissions for each role
    FOR role_permissions IN 
        SELECT r.permissions 
        FROM roles r 
        JOIN user_roles ur ON r.id = ur.role_id 
        WHERE ur.user_id = user_uuid AND ur.org_id = user_org_id
    LOOP
        IF role_permissions ? required_permission OR role_permissions ? '*' THEN
            has_perm := TRUE;
            EXIT;
        END IF;
    END LOOP;
    
    RETURN has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_campaign_role(user_uuid UUID, campaign_uuid UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM campaign_members 
        WHERE user_id = user_uuid AND campaign_id = campaign_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_campaign_permission(user_uuid UUID, campaign_uuid UUID, required_permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    campaign_role TEXT;
    campaign_permissions JSONB;
BEGIN
    -- Get user's role in this campaign
    campaign_role := get_campaign_role(user_uuid, campaign_uuid);
    
    IF campaign_role IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get permissions for this role
    SELECT permissions INTO campaign_permissions
    FROM campaign_members
    WHERE user_id = user_uuid AND campaign_id = campaign_uuid;
    
    -- Check if user has the required permission
    RETURN campaign_permissions ? required_permission OR campaign_permissions ? '*';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for roles table
CREATE POLICY "roles_read_all" ON roles FOR SELECT USING (true);
CREATE POLICY "roles_write_admin" ON roles FOR ALL USING (has_permission(auth.uid(), 'role:write'));

-- RLS Policies for user_roles table
CREATE POLICY "user_roles_read_own_org" ON user_roles FOR SELECT 
USING (get_user_org_id(auth.uid()) = org_id);
CREATE POLICY "user_roles_write_admin" ON user_roles FOR ALL 
USING (has_permission(auth.uid(), 'user:write'));

-- RLS Policies for campaign_members table
CREATE POLICY "campaign_members_read_campaign" ON campaign_members FOR SELECT 
USING (has_campaign_permission(auth.uid(), campaign_id, 'campaign:read'));
CREATE POLICY "campaign_members_write_owner" ON campaign_members FOR ALL 
USING (get_campaign_role(auth.uid(), campaign_id) IN ('owner', 'dm'));

-- RLS Policies for orgs table
CREATE POLICY "orgs_read_own" ON orgs FOR SELECT 
USING (id = get_user_org_id(auth.uid()));
CREATE POLICY "orgs_write_admin" ON orgs FOR ALL 
USING (has_permission(auth.uid(), 'org:write'));

-- RLS Policies for users table
CREATE POLICY "users_read_own_org" ON users FOR SELECT 
USING (org_id = get_user_org_id(auth.uid()));
CREATE POLICY "users_write_admin" ON users FOR ALL 
USING (has_permission(auth.uid(), 'user:write'));

-- RLS Policies for campaigns table
CREATE POLICY "campaigns_read_own_org" ON campaigns FOR SELECT 
USING (org_id = get_user_org_id(auth.uid()));
CREATE POLICY "campaigns_write_own_org" ON campaigns FOR ALL 
USING (org_id = get_user_org_id(auth.uid()) AND has_permission(auth.uid(), 'campaign:write'));

-- RLS Policies for sessions table
CREATE POLICY "sessions_read_campaign" ON sessions FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM campaigns c 
    WHERE c.id = campaign_id 
    AND c.org_id = get_user_org_id(auth.uid())
    AND has_campaign_permission(auth.uid(), campaign_id, 'session:read')
));
CREATE POLICY "sessions_write_campaign" ON sessions FOR ALL 
USING (EXISTS (
    SELECT 1 FROM campaigns c 
    WHERE c.id = campaign_id 
    AND c.org_id = get_user_org_id(auth.uid())
    AND has_campaign_permission(auth.uid(), campaign_id, 'session:write')
));

-- RLS Policies for characters table
CREATE POLICY "characters_read_campaign" ON characters FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM campaigns c 
    WHERE c.id = campaign_id 
    AND c.org_id = get_user_org_id(auth.uid())
    AND has_campaign_permission(auth.uid(), campaign_id, 'character:read')
));
CREATE POLICY "characters_write_own" ON characters FOR ALL 
USING (owner_user_id = auth.uid() OR has_campaign_permission(auth.uid(), campaign_id, 'character:write'));

-- RLS Policies for npcs table
CREATE POLICY "npcs_read_campaign" ON npcs FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM campaigns c 
    WHERE c.id = campaign_id 
    AND c.org_id = get_user_org_id(auth.uid())
    AND has_campaign_permission(auth.uid(), campaign_id, 'npc:read')
));
CREATE POLICY "npcs_write_campaign" ON npcs FOR ALL 
USING (EXISTS (
    SELECT 1 FROM campaigns c 
    WHERE c.id = campaign_id 
    AND c.org_id = get_user_org_id(auth.uid())
    AND has_campaign_permission(auth.uid(), campaign_id, 'npc:write')
));

-- RLS Policies for maps table
CREATE POLICY "maps_read_campaign" ON maps FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM campaigns c 
    WHERE c.id = campaign_id 
    AND c.org_id = get_user_org_id(auth.uid())
    AND has_campaign_permission(auth.uid(), campaign_id, 'map:read')
));
CREATE POLICY "maps_write_campaign" ON maps FOR ALL 
USING (EXISTS (
    SELECT 1 FROM campaigns c 
    WHERE c.id = campaign_id 
    AND c.org_id = get_user_org_id(auth.uid())
    AND has_campaign_permission(auth.uid(), campaign_id, 'map:write')
));

-- RLS Policies for tokens table
CREATE POLICY "tokens_read_map" ON tokens FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM maps m 
    JOIN campaigns c ON m.campaign_id = c.id 
    WHERE m.id = map_id 
    AND c.org_id = get_user_org_id(auth.uid())
    AND has_campaign_permission(auth.uid(), c.id, 'map:read')
));
CREATE POLICY "tokens_write_map" ON tokens FOR ALL 
USING (EXISTS (
    SELECT 1 FROM maps m 
    JOIN campaigns c ON m.campaign_id = c.id 
    WHERE m.id = map_id 
    AND c.org_id = get_user_org_id(auth.uid())
    AND has_campaign_permission(auth.uid(), c.id, 'map:write')
));

-- RLS Policies for encounters table
CREATE POLICY "encounters_read_campaign" ON encounters FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM campaigns c 
    WHERE c.id = campaign_id 
    AND c.org_id = get_user_org_id(auth.uid())
    AND has_campaign_permission(auth.uid(), campaign_id, 'encounter:read')
));
CREATE POLICY "encounters_write_campaign" ON encounters FOR ALL 
USING (EXISTS (
    SELECT 1 FROM campaigns c 
    WHERE c.id = campaign_id 
    AND c.org_id = get_user_org_id(auth.uid())
    AND has_campaign_permission(auth.uid(), campaign_id, 'encounter:write')
));

-- RLS Policies for combat-related tables
CREATE POLICY "initiative_read_session" ON initiative FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM sessions s 
    JOIN campaigns c ON s.campaign_id = c.id 
    WHERE s.id = session_id 
    AND c.org_id = get_user_org_id(auth.uid())
    AND has_campaign_permission(auth.uid(), c.id, 'combat:read')
));
CREATE POLICY "initiative_write_session" ON initiative FOR ALL 
USING (EXISTS (
    SELECT 1 FROM sessions s 
    JOIN campaigns c ON s.campaign_id = c.id 
    WHERE s.id = session_id 
    AND c.org_id = get_user_org_id(auth.uid())
    AND has_campaign_permission(auth.uid(), c.id, 'combat:write')
));

CREATE POLICY "turn_log_read_session" ON turn_log FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM sessions s 
    JOIN campaigns c ON s.campaign_id = c.id 
    WHERE s.id = session_id 
    AND c.org_id = get_user_org_id(auth.uid())
    AND has_campaign_permission(auth.uid(), c.id, 'combat:read')
));
CREATE POLICY "turn_log_write_session" ON turn_log FOR ALL 
USING (EXISTS (
    SELECT 1 FROM sessions s 
    JOIN campaigns c ON s.campaign_id = c.id 
    WHERE s.id = session_id 
    AND c.org_id = get_user_org_id(auth.uid())
    AND has_campaign_permission(auth.uid(), c.id, 'combat:write')
));

-- RLS Policies for rolls table
CREATE POLICY "rolls_read_session" ON rolls FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM sessions s 
    JOIN campaigns c ON s.campaign_id = c.id 
    WHERE s.id = session_id 
    AND c.org_id = get_user_org_id(auth.uid())
    AND has_campaign_permission(auth.uid(), c.id, 'session:read')
));
CREATE POLICY "rolls_write_session" ON rolls FOR ALL 
USING (EXISTS (
    SELECT 1 FROM sessions s 
    JOIN campaigns c ON s.campaign_id = c.id 
    WHERE s.id = session_id 
    AND c.org_id = get_user_org_id(auth.uid())
    AND has_campaign_permission(auth.uid(), c.id, 'session:write')
));

-- RLS Policies for other session-related tables
CREATE POLICY "rulings_read_session" ON rulings FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM sessions s 
    JOIN campaigns c ON s.campaign_id = c.id 
    WHERE s.id = session_id 
    AND c.org_id = get_user_org_id(auth.uid())
    AND has_campaign_permission(auth.uid(), c.id, 'session:read')
));
CREATE POLICY "rulings_write_session" ON rulings FOR ALL 
USING (EXISTS (
    SELECT 1 FROM sessions s 
    JOIN campaigns c ON s.campaign_id = c.id 
    WHERE s.id = session_id 
    AND c.org_id = get_user_org_id(auth.uid())
    AND has_campaign_permission(auth.uid(), c.id, 'session:write')
));

CREATE POLICY "loot_read_session" ON loot FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM sessions s 
    JOIN campaigns c ON s.campaign_id = c.id 
    WHERE s.id = session_id 
    AND c.org_id = get_user_org_id(auth.uid())
    AND has_campaign_permission(auth.uid(), c.id, 'session:read')
));
CREATE POLICY "loot_write_session" ON loot FOR ALL 
USING (EXISTS (
    SELECT 1 FROM sessions s 
    JOIN campaigns c ON s.campaign_id = c.id 
    WHERE s.id = session_id 
    AND c.org_id = get_user_org_id(auth.uid())
    AND has_campaign_permission(auth.uid(), c.id, 'session:write')
));

CREATE POLICY "journals_read_session" ON journals FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM sessions s 
    JOIN campaigns c ON s.campaign_id = c.id 
    WHERE s.id = session_id 
    AND c.org_id = get_user_org_id(auth.uid())
    AND has_campaign_permission(auth.uid(), c.id, 'session:read')
));
CREATE POLICY "journals_write_session" ON journals FOR ALL 
USING (EXISTS (
    SELECT 1 FROM sessions s 
    JOIN campaigns c ON s.campaign_id = c.id 
    WHERE s.id = session_id 
    AND c.org_id = get_user_org_id(auth.uid())
    AND has_campaign_permission(auth.uid(), c.id, 'session:write')
));

CREATE POLICY "exports_read_session" ON exports FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM sessions s 
    JOIN campaigns c ON s.campaign_id = c.id 
    WHERE s.id = session_id 
    AND c.org_id = get_user_org_id(auth.uid())
    AND has_campaign_permission(auth.uid(), c.id, 'session:read')
));
CREATE POLICY "exports_write_session" ON exports FOR ALL 
USING (EXISTS (
    SELECT 1 FROM sessions s 
    JOIN campaigns c ON s.campaign_id = c.id 
    WHERE s.id = session_id 
    AND c.org_id = get_user_org_id(auth.uid())
    AND has_campaign_permission(auth.uid(), c.id, 'session:write')
));

-- RLS Policies for audit and costs tables
CREATE POLICY "audit_log_read_own_org" ON audit_log FOR SELECT 
USING (org_id = get_user_org_id(auth.uid()) AND has_permission(auth.uid(), 'audit:read'));
CREATE POLICY "audit_log_write_system" ON audit_log FOR ALL 
USING (true); -- System can always write audit logs

CREATE POLICY "costs_read_own_org" ON costs FOR SELECT 
USING (org_id = get_user_org_id(auth.uid()) AND has_permission(auth.uid(), 'billing:read'));
CREATE POLICY "costs_write_system" ON costs FOR ALL 
USING (true); -- System can always write cost records

-- Create indexes for performance
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_org_id ON user_roles(org_id);
CREATE INDEX idx_campaign_members_campaign_id ON campaign_members(campaign_id);
CREATE INDEX idx_campaign_members_user_id ON campaign_members(user_id);

-- Grant default roles to demo user
INSERT INTO user_roles (user_id, role_id, org_id, granted_by)
SELECT 
    u.id,
    r.id,
    u.org_id,
    u.id
FROM users u, roles r
WHERE u.email = 'demo@example.com' 
AND r.name = 'org_admin';

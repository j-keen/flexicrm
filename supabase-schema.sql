-- =============================================================================
-- FLEXICRM SUPABASE SCHEMA
-- Multi-tenant, Role-based access with flexible permissions
--
-- 사용법: Supabase Dashboard > SQL Editor에서 이 파일 전체를 실행하세요.
-- =============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- SECTION 1: CORE USER & ORGANIZATION TABLES
-- =============================================================================

-- Organizations (supports future multi-tenancy)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User roles enum - the 3-tier hierarchy
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ceo', 'team_lead', 'staff');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'staff',
    team_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams (for Team Lead > Staff hierarchy)
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    lead_id UUID REFERENCES user_profiles(id),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK constraint after teams exists
DO $$ BEGIN
    ALTER TABLE user_profiles
        ADD CONSTRAINT fk_user_team
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- SECTION 2: PERMISSION SYSTEM
-- =============================================================================

-- Permission definitions
CREATE TABLE IF NOT EXISTS permissions (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default role permissions
CREATE TABLE IF NOT EXISTS role_permissions (
    role user_role NOT NULL,
    permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role, permission_id)
);

-- User-specific permission overrides
CREATE TABLE IF NOT EXISTS user_permission_overrides (
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted BOOLEAN NOT NULL,
    granted_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, permission_id)
);

-- =============================================================================
-- SECTION 3: CRM SCHEMA DEFINITIONS (Dynamic Fields)
-- =============================================================================

-- Field type enum
DO $$ BEGIN
    CREATE TYPE field_type AS ENUM (
        'text', 'number', 'select', 'date', 'currency', 'email',
        'phone', 'url', 'textarea', 'checkbox', 'file', 'relation'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Field definitions (the dynamic schema)
CREATE TABLE IF NOT EXISTS field_definitions (
    id TEXT NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    field_type field_type NOT NULL DEFAULT 'text',
    is_visible BOOLEAN DEFAULT TRUE,
    is_system BOOLEAN DEFAULT FALSE,
    is_required BOOLEAN DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    column_width INTEGER DEFAULT 200,
    layout JSONB DEFAULT '{"x": 0, "y": 0, "w": 6, "h": 1}',
    options JSONB DEFAULT '[]',
    validation_rules JSONB DEFAULT '{}',
    default_value JSONB,
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, organization_id)
);

-- =============================================================================
-- SECTION 4: AUTOMATION RULES
-- =============================================================================

CREATE TABLE IF NOT EXISTS automation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    trigger_field_id TEXT NOT NULL,
    trigger_value JSONB NOT NULL,
    target_field_id TEXT NOT NULL,
    target_value JSONB NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- SECTION 5: CUSTOMER RECORDS (Dynamic Data with JSONB)
-- =============================================================================

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}',
    created_by UUID REFERENCES user_profiles(id),
    assigned_to UUID REFERENCES user_profiles(id),
    team_id UUID REFERENCES teams(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- =============================================================================
-- SECTION 6: AUDIT LOG
-- =============================================================================

DO $$ BEGIN
    CREATE TYPE audit_action AS ENUM (
        'create', 'update', 'delete', 'restore',
        'login', 'logout', 'permission_change'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id),
    action audit_action NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- SECTION 7: INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_org ON user_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_team ON user_profiles(team_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

CREATE INDEX IF NOT EXISTS idx_teams_org ON teams(organization_id);

CREATE INDEX IF NOT EXISTS idx_customers_org ON customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_created_by ON customers(created_by);
CREATE INDEX IF NOT EXISTS idx_customers_assigned_to ON customers(assigned_to);
CREATE INDEX IF NOT EXISTS idx_customers_team ON customers(team_id);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_not_deleted ON customers(organization_id) WHERE deleted_at IS NULL;

-- JSONB GIN index for dynamic field queries
CREATE INDEX IF NOT EXISTS idx_customers_data_gin ON customers USING GIN (data);

CREATE INDEX IF NOT EXISTS idx_field_definitions_org ON field_definitions(organization_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_org ON automation_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_trigger ON automation_rules(trigger_field_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_time ON audit_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);

-- =============================================================================
-- SECTION 8: SEED DATA - DEFAULT PERMISSIONS
-- =============================================================================

INSERT INTO permissions (id, category, name, description) VALUES
    ('schema.fields.read', 'schema', 'View Fields', 'View field definitions'),
    ('schema.fields.create', 'schema', 'Create Fields', 'Create new fields'),
    ('schema.fields.update', 'schema', 'Update Fields', 'Modify field definitions'),
    ('schema.fields.delete', 'schema', 'Delete Fields', 'Remove fields'),
    ('schema.automation.read', 'schema', 'View Automation', 'View automation rules'),
    ('schema.automation.manage', 'schema', 'Manage Automation', 'Create/edit automation rules'),
    ('data.customers.read.all', 'data', 'Read All Customers', 'View all customer records'),
    ('data.customers.read.team', 'data', 'Read Team Customers', 'View team customer records'),
    ('data.customers.read.own', 'data', 'Read Own Customers', 'View own customer records'),
    ('data.customers.create', 'data', 'Create Customers', 'Create new customer records'),
    ('data.customers.update.all', 'data', 'Update All Customers', 'Edit any customer record'),
    ('data.customers.update.team', 'data', 'Update Team Customers', 'Edit team customer records'),
    ('data.customers.update.own', 'data', 'Update Own Customers', 'Edit own customer records'),
    ('data.customers.delete', 'data', 'Delete Customers', 'Soft-delete customer records'),
    ('data.customers.export', 'data', 'Export Data', 'Export customer data'),
    ('admin.users.read', 'admin', 'View Users', 'View user list'),
    ('admin.users.manage', 'admin', 'Manage Users', 'Create/edit users'),
    ('admin.teams.manage', 'admin', 'Manage Teams', 'Create/edit teams'),
    ('admin.permissions.manage', 'admin', 'Manage Permissions', 'Assign permissions'),
    ('admin.audit.read', 'admin', 'View Audit Log', 'Access audit trail'),
    ('admin.settings.manage', 'admin', 'System Settings', 'Modify organization settings'),
    ('feature.reports.view', 'feature', 'View Reports', 'Access reporting dashboard'),
    ('feature.reports.create', 'feature', 'Create Reports', 'Build custom reports'),
    ('feature.api.access', 'feature', 'API Access', 'Use API endpoints')
ON CONFLICT (id) DO NOTHING;

-- CEO gets all permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'ceo', id FROM permissions
ON CONFLICT DO NOTHING;

-- Team Lead permissions
INSERT INTO role_permissions (role, permission_id) VALUES
    ('team_lead', 'schema.fields.read'),
    ('team_lead', 'schema.automation.read'),
    ('team_lead', 'data.customers.read.all'),
    ('team_lead', 'data.customers.read.team'),
    ('team_lead', 'data.customers.read.own'),
    ('team_lead', 'data.customers.create'),
    ('team_lead', 'data.customers.update.team'),
    ('team_lead', 'data.customers.update.own'),
    ('team_lead', 'data.customers.export'),
    ('team_lead', 'admin.users.read'),
    ('team_lead', 'admin.audit.read'),
    ('team_lead', 'feature.reports.view')
ON CONFLICT DO NOTHING;

-- Staff permissions
INSERT INTO role_permissions (role, permission_id) VALUES
    ('staff', 'schema.fields.read'),
    ('staff', 'data.customers.read.own'),
    ('staff', 'data.customers.create'),
    ('staff', 'data.customers.update.own'),
    ('staff', 'feature.reports.view')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- SECTION 9: HELPER FUNCTIONS
-- =============================================================================

-- Function to get user's organization
CREATE OR REPLACE FUNCTION get_user_org(p_user_id UUID)
RETURNS UUID AS $$
    SELECT organization_id FROM user_profiles WHERE id = p_user_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function to get user's team
CREATE OR REPLACE FUNCTION get_user_team(p_user_id UUID)
RETURNS UUID AS $$
    SELECT team_id FROM user_profiles WHERE id = p_user_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Function to check if user has a specific permission
CREATE OR REPLACE FUNCTION user_has_permission(
    p_user_id UUID,
    p_permission_id TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_role user_role;
    v_has_role_permission BOOLEAN;
    v_override_granted BOOLEAN;
BEGIN
    SELECT role INTO v_role FROM user_profiles WHERE id = p_user_id AND is_active = TRUE;

    IF v_role IS NULL THEN
        RETURN FALSE;
    END IF;

    SELECT EXISTS(
        SELECT 1 FROM role_permissions
        WHERE role = v_role AND permission_id = p_permission_id
    ) INTO v_has_role_permission;

    SELECT granted INTO v_override_granted
    FROM user_permission_overrides
    WHERE user_id = p_user_id AND permission_id = p_permission_id;

    IF v_override_granted IS NOT NULL THEN
        RETURN v_override_granted;
    END IF;

    RETURN v_has_role_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =============================================================================
-- SECTION 10: ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permission_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running)
DROP POLICY IF EXISTS org_isolation ON organizations;
DROP POLICY IF EXISTS user_profiles_read ON user_profiles;
DROP POLICY IF EXISTS user_profiles_self_update ON user_profiles;
DROP POLICY IF EXISTS teams_read ON teams;
DROP POLICY IF EXISTS permissions_read ON permissions;
DROP POLICY IF EXISTS role_permissions_read ON role_permissions;
DROP POLICY IF EXISTS user_overrides_read ON user_permission_overrides;
DROP POLICY IF EXISTS field_defs_read ON field_definitions;
DROP POLICY IF EXISTS field_defs_insert ON field_definitions;
DROP POLICY IF EXISTS field_defs_update ON field_definitions;
DROP POLICY IF EXISTS field_defs_delete ON field_definitions;
DROP POLICY IF EXISTS automation_read ON automation_rules;
DROP POLICY IF EXISTS automation_manage ON automation_rules;
DROP POLICY IF EXISTS customers_select ON customers;
DROP POLICY IF EXISTS customers_insert ON customers;
DROP POLICY IF EXISTS customers_update ON customers;
DROP POLICY IF EXISTS audit_read ON audit_logs;
DROP POLICY IF EXISTS audit_insert ON audit_logs;

-- ORGANIZATIONS
CREATE POLICY org_isolation ON organizations
    FOR ALL USING (id = get_user_org(auth.uid()));

-- USER_PROFILES
CREATE POLICY user_profiles_read ON user_profiles
    FOR SELECT USING (organization_id = get_user_org(auth.uid()));

CREATE POLICY user_profiles_self_update ON user_profiles
    FOR UPDATE USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- TEAMS
CREATE POLICY teams_read ON teams
    FOR SELECT USING (organization_id = get_user_org(auth.uid()));

-- PERMISSIONS (everyone can read)
CREATE POLICY permissions_read ON permissions
    FOR SELECT USING (TRUE);

-- ROLE_PERMISSIONS (everyone can read)
CREATE POLICY role_permissions_read ON role_permissions
    FOR SELECT USING (TRUE);

-- USER_PERMISSION_OVERRIDES
CREATE POLICY user_overrides_read ON user_permission_overrides
    FOR SELECT USING (
        user_id = auth.uid()
        OR user_has_permission(auth.uid(), 'admin.permissions.manage')
    );

-- FIELD_DEFINITIONS
CREATE POLICY field_defs_read ON field_definitions
    FOR SELECT USING (
        organization_id = get_user_org(auth.uid())
        AND user_has_permission(auth.uid(), 'schema.fields.read')
    );

CREATE POLICY field_defs_insert ON field_definitions
    FOR INSERT WITH CHECK (
        organization_id = get_user_org(auth.uid())
        AND user_has_permission(auth.uid(), 'schema.fields.create')
    );

CREATE POLICY field_defs_update ON field_definitions
    FOR UPDATE USING (
        organization_id = get_user_org(auth.uid())
        AND user_has_permission(auth.uid(), 'schema.fields.update')
    );

CREATE POLICY field_defs_delete ON field_definitions
    FOR DELETE USING (
        organization_id = get_user_org(auth.uid())
        AND user_has_permission(auth.uid(), 'schema.fields.delete')
        AND is_system = FALSE
    );

-- AUTOMATION_RULES
CREATE POLICY automation_read ON automation_rules
    FOR SELECT USING (
        organization_id = get_user_org(auth.uid())
        AND user_has_permission(auth.uid(), 'schema.automation.read')
    );

CREATE POLICY automation_manage ON automation_rules
    FOR ALL USING (
        organization_id = get_user_org(auth.uid())
        AND user_has_permission(auth.uid(), 'schema.automation.manage')
    );

-- CUSTOMERS (hierarchy-based access)
CREATE POLICY customers_select ON customers
    FOR SELECT USING (
        deleted_at IS NULL
        AND organization_id = get_user_org(auth.uid())
        AND (
            user_has_permission(auth.uid(), 'data.customers.read.all')
            OR (user_has_permission(auth.uid(), 'data.customers.read.team')
                AND team_id = get_user_team(auth.uid()))
            OR (user_has_permission(auth.uid(), 'data.customers.read.own')
                AND (assigned_to = auth.uid() OR created_by = auth.uid()))
        )
    );

CREATE POLICY customers_insert ON customers
    FOR INSERT WITH CHECK (
        organization_id = get_user_org(auth.uid())
        AND user_has_permission(auth.uid(), 'data.customers.create')
    );

CREATE POLICY customers_update ON customers
    FOR UPDATE USING (
        deleted_at IS NULL
        AND organization_id = get_user_org(auth.uid())
        AND (
            user_has_permission(auth.uid(), 'data.customers.update.all')
            OR (user_has_permission(auth.uid(), 'data.customers.update.team')
                AND team_id = get_user_team(auth.uid()))
            OR (user_has_permission(auth.uid(), 'data.customers.update.own')
                AND (assigned_to = auth.uid() OR created_by = auth.uid()))
        )
    );

-- AUDIT_LOGS
CREATE POLICY audit_read ON audit_logs
    FOR SELECT USING (
        organization_id = get_user_org(auth.uid())
        AND user_has_permission(auth.uid(), 'admin.audit.read')
    );

CREATE POLICY audit_insert ON audit_logs
    FOR INSERT WITH CHECK (organization_id = get_user_org(auth.uid()));

-- =============================================================================
-- SECTION 11: TRIGGERS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_organizations_updated_at ON organizations;
CREATE TRIGGER trg_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_teams_updated_at ON teams;
CREATE TRIGGER trg_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_field_definitions_updated_at ON field_definitions;
CREATE TRIGGER trg_field_definitions_updated_at
    BEFORE UPDATE ON field_definitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_automation_rules_updated_at ON automation_rules;
CREATE TRIGGER trg_automation_rules_updated_at
    BEFORE UPDATE ON automation_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_customers_updated_at ON customers;
CREATE TRIGGER trg_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Audit trigger for customers
CREATE OR REPLACE FUNCTION audit_customer_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (organization_id, user_id, action, table_name, record_id, new_data)
        VALUES (NEW.organization_id, auth.uid(), 'create', 'customers', NEW.id::TEXT, to_jsonb(NEW));
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (organization_id, user_id, action, table_name, record_id, old_data, new_data)
        VALUES (NEW.organization_id, auth.uid(), 'update', 'customers', NEW.id::TEXT, to_jsonb(OLD), to_jsonb(NEW));
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_customers_audit ON customers;
CREATE TRIGGER trg_customers_audit
    AFTER INSERT OR UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION audit_customer_changes();

-- =============================================================================
-- SECTION 12: HANDLE NEW USER SIGNUP
-- =============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_org_id UUID;
    v_invite_org_id UUID;
    v_invite_role user_role;
    v_invite_team_id UUID;
BEGIN
    v_invite_org_id := (NEW.raw_user_meta_data->>'organization_id')::UUID;
    v_invite_role := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'staff');
    v_invite_team_id := (NEW.raw_user_meta_data->>'team_id')::UUID;

    IF v_invite_org_id IS NOT NULL THEN
        v_org_id := v_invite_org_id;
    ELSE
        INSERT INTO organizations (name, settings)
        VALUES (
            COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Organization'),
            '{}'
        )
        RETURNING id INTO v_org_id;

        v_invite_role := 'ceo';
    END IF;

    INSERT INTO user_profiles (
        id,
        organization_id,
        email,
        full_name,
        role,
        team_id
    ) VALUES (
        NEW.id,
        v_org_id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        v_invite_role,
        v_invite_team_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create auth trigger (this needs to be run separately in Supabase Dashboard)
-- Go to: Authentication > Hooks > Add Hook
-- Or run this if you have sufficient permissions:
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- DONE!
-- 스키마 설치 완료. 이제 Supabase Dashboard에서:
-- 1. Authentication > Settings에서 이메일 인증 설정
-- 2. API Keys에서 anon key 복사하여 .env.local에 설정
-- =============================================================================

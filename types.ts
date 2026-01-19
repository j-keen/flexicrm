// ============================================================================
// FlexiCRM Type Definitions
// ============================================================================

// Field Types
export type FieldType = 'text' | 'number' | 'select' | 'date' | 'currency' | 'email';

// Modal Sizes
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | 'full';

// User Roles (3-tier hierarchy)
export type UserRole = 'ceo' | 'team_lead' | 'staff';

// Select Option for dropdown fields
export interface SelectOption {
  id: string;
  label: string;
  color: string;  // Tailwind classes e.g., 'bg-blue-100 text-blue-800'
}

// Field Definition (Schema)
export interface FieldDefinition {
  id: string;
  name: string;
  type: FieldType;
  visible: boolean;
  order: number;
  isSystem?: boolean;
  width?: number;
  layout?: {
    x: number;  // Grid column start (0-11)
    y: number;  // Grid row start
    w: number;  // Width in grid units (1-12)
    h: number;  // Height in grid units
  };
  options?: SelectOption[];  // For select type only
}

// Customer Record (Dynamic fields stored as key-value)
export interface CustomerRecord {
  id: string;
  created_at: string;
  [key: string]: any;  // Dynamic field values keyed by field ID (e.g., f_name, f_email)
}

// Automation/Dependency Rule
export interface DependencyRule {
  id: string;
  triggerFieldId: string;
  triggerValue: string | number;
  targetFieldId: string;
  targetValue: string | number;
}

// App State (for local state management)
export interface AppState {
  fields: FieldDefinition[];
  data: CustomerRecord[];
  dependencies: DependencyRule[];
  modalSize: ModalSize;
}

// ============================================================================
// Supabase Database Types
// ============================================================================

// Organization
export interface Organization {
  id: string;
  name: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// User Profile (extends Supabase auth.users)
export interface UserProfile {
  id: string;
  organization_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  team_id: string | null;
  is_active: boolean;
  preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Team
export interface Team {
  id: string;
  organization_id: string;
  name: string;
  lead_id: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Permission
export interface Permission {
  id: string;
  category: 'schema' | 'data' | 'admin' | 'feature';
  name: string;
  description: string | null;
}

// Database Field Definition (Supabase version)
export interface DbFieldDefinition {
  id: string;
  organization_id: string;
  name: string;
  field_type: FieldType;
  is_visible: boolean;
  is_system: boolean;
  is_required: boolean;
  sort_order: number;
  column_width: number;
  layout: { x: number; y: number; w: number; h: number };
  options: SelectOption[];
  validation_rules: Record<string, unknown>;
  default_value: unknown;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Database Customer (Supabase version with JSONB data)
export interface DbCustomer {
  id: string;
  organization_id: string;
  data: Record<string, unknown>;  // Dynamic fields in JSONB
  created_by: string | null;
  assigned_to: string | null;
  team_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// Database Automation Rule (Supabase version)
export interface DbAutomationRule {
  id: string;
  organization_id: string;
  name: string | null;
  is_active: boolean;
  trigger_field_id: string;
  trigger_value: unknown;
  target_field_id: string;
  target_value: unknown;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Permission IDs (Constants)
// ============================================================================

export const PERMISSIONS = {
  // Schema permissions
  SCHEMA_FIELDS_READ: 'schema.fields.read',
  SCHEMA_FIELDS_CREATE: 'schema.fields.create',
  SCHEMA_FIELDS_UPDATE: 'schema.fields.update',
  SCHEMA_FIELDS_DELETE: 'schema.fields.delete',
  SCHEMA_AUTOMATION_READ: 'schema.automation.read',
  SCHEMA_AUTOMATION_MANAGE: 'schema.automation.manage',

  // Data permissions
  DATA_CUSTOMERS_READ_ALL: 'data.customers.read.all',
  DATA_CUSTOMERS_READ_TEAM: 'data.customers.read.team',
  DATA_CUSTOMERS_READ_OWN: 'data.customers.read.own',
  DATA_CUSTOMERS_CREATE: 'data.customers.create',
  DATA_CUSTOMERS_UPDATE_ALL: 'data.customers.update.all',
  DATA_CUSTOMERS_UPDATE_TEAM: 'data.customers.update.team',
  DATA_CUSTOMERS_UPDATE_OWN: 'data.customers.update.own',
  DATA_CUSTOMERS_DELETE: 'data.customers.delete',
  DATA_CUSTOMERS_EXPORT: 'data.customers.export',

  // Admin permissions
  ADMIN_USERS_READ: 'admin.users.read',
  ADMIN_USERS_MANAGE: 'admin.users.manage',
  ADMIN_TEAMS_MANAGE: 'admin.teams.manage',
  ADMIN_PERMISSIONS_MANAGE: 'admin.permissions.manage',
  ADMIN_AUDIT_READ: 'admin.audit.read',
  ADMIN_SETTINGS_MANAGE: 'admin.settings.manage',

  // Feature permissions
  FEATURE_REPORTS_VIEW: 'feature.reports.view',
  FEATURE_REPORTS_CREATE: 'feature.reports.create',
  FEATURE_API_ACCESS: 'feature.api.access',
} as const;

export type PermissionId = typeof PERMISSIONS[keyof typeof PERMISSIONS];

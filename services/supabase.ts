import { createClient } from '@supabase/supabase-js';
import type {
  DbFieldDefinition,
  DbCustomer,
  DbAutomationRule,
  UserProfile,
  Organization,
  Team,
  FieldDefinition,
  CustomerRecord,
  DependencyRule,
} from '../types';

// ============================================================================
// Supabase Client Configuration
// ============================================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local'
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// ============================================================================
// Direct REST API Helper (workaround for supabase.from() hanging issue)
// ============================================================================

function getAuthHeaders(): Record<string, string> {
  const storedSession = localStorage.getItem('sb-vcebeykrumeydnpdajzp-auth-token');
  const token = storedSession ? JSON.parse(storedSession).access_token : null;
  return {
    'apikey': supabaseAnonKey || '',
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };
}

async function restGet<T>(table: string, queryParams: string = ''): Promise<T[]> {
  try {
    const url = `${supabaseUrl}/rest/v1/${table}${queryParams ? `?${queryParams}` : ''}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) {
      console.error(`[REST] GET ${table} failed:`, res.status, res.statusText);
      return [];
    }
    return await res.json();
  } catch (err) {
    console.error(`[REST] GET ${table} error:`, err);
    return [];
  }
}

async function restPost<T>(table: string, data: object): Promise<T | null> {
  try {
    const url = `${supabaseUrl}/rest/v1/${table}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      console.error(`[REST] POST ${table} failed:`, res.status, res.statusText);
      return null;
    }
    const result = await res.json();
    return Array.isArray(result) && result.length > 0 ? result[0] : result;
  } catch (err) {
    console.error(`[REST] POST ${table} error:`, err);
    return null;
  }
}

async function restPatch<T>(table: string, queryParams: string, data: object): Promise<T | null> {
  try {
    const url = `${supabaseUrl}/rest/v1/${table}?${queryParams}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      console.error(`[REST] PATCH ${table} failed:`, res.status, res.statusText);
      return null;
    }
    const result = await res.json();
    return Array.isArray(result) && result.length > 0 ? result[0] : result;
  } catch (err) {
    console.error(`[REST] PATCH ${table} error:`, err);
    return null;
  }
}

async function restDelete(table: string, queryParams: string): Promise<boolean> {
  try {
    const url = `${supabaseUrl}/rest/v1/${table}?${queryParams}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.ok;
  } catch (err) {
    console.error(`[REST] DELETE ${table} error:`, err);
    return false;
  }
}

// ============================================================================
// Type Converters (DB ↔ Frontend)
// ============================================================================

/**
 * Convert database field definition to frontend format
 */
export function dbFieldToFrontend(dbField: DbFieldDefinition): FieldDefinition {
  return {
    id: dbField.id,
    name: dbField.name,
    type: dbField.field_type,
    visible: dbField.is_visible,
    order: dbField.sort_order,
    isSystem: dbField.is_system,
    width: dbField.column_width,
    layout: dbField.layout,
    options: dbField.options,
  };
}

/**
 * Convert frontend field definition to database format
 */
export function frontendFieldToDb(
  field: FieldDefinition,
  organizationId: string
): Omit<DbFieldDefinition, 'created_at' | 'updated_at' | 'created_by'> {
  return {
    id: field.id,
    organization_id: organizationId,
    name: field.name,
    field_type: field.type,
    is_visible: field.visible,
    is_system: field.isSystem || false,
    is_required: false,
    sort_order: field.order,
    column_width: field.width || 200,
    layout: field.layout || { x: 0, y: 0, w: 6, h: 1 },
    options: field.options || [],
    validation_rules: {},
    default_value: null,
  };
}

/**
 * Convert database customer to frontend format
 */
export function dbCustomerToFrontend(dbCustomer: DbCustomer): CustomerRecord {
  return {
    id: dbCustomer.id,
    created_at: dbCustomer.created_at,
    ...dbCustomer.data,
  };
}

/**
 * Convert frontend customer record to database format
 */
export function frontendCustomerToDb(
  record: CustomerRecord,
  organizationId: string
): Omit<DbCustomer, 'created_at' | 'updated_at' | 'created_by'> {
  const { id, created_at, ...data } = record;
  return {
    id,
    organization_id: organizationId,
    data,
    assigned_to: null,
    team_id: null,
    deleted_at: null,
  };
}

/**
 * Convert database automation rule to frontend format
 */
export function dbRuleToFrontend(dbRule: DbAutomationRule): DependencyRule {
  return {
    id: dbRule.id,
    triggerFieldId: dbRule.trigger_field_id,
    triggerValue: dbRule.trigger_value as string | number,
    targetFieldId: dbRule.target_field_id,
    targetValue: dbRule.target_value as string | number,
  };
}

/**
 * Convert frontend dependency rule to database format
 */
export function frontendRuleToDb(
  rule: DependencyRule,
  organizationId: string
): Omit<DbAutomationRule, 'created_at' | 'updated_at' | 'created_by'> {
  return {
    id: rule.id,
    organization_id: organizationId,
    name: null,
    is_active: true,
    trigger_field_id: rule.triggerFieldId,
    trigger_value: rule.triggerValue,
    target_field_id: rule.targetFieldId,
    target_value: rule.targetValue,
    sort_order: 0,
  };
}

// ============================================================================
// Auth Functions
// ============================================================================

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  companyName?: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        company_name: companyName,
      },
    },
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentUserProfile(userId?: string): Promise<UserProfile | null> {
  console.log('[Supabase] getCurrentUserProfile called, userId:', userId);

  let uid = userId;
  if (!uid) {
    const user = await getCurrentUser();
    uid = user?.id;
  }

  if (!uid) return null;

  // 직접 fetch 사용 (supabase.from()이 응답하지 않는 문제 회피)
  try {
    const url = `${supabaseUrl}/rest/v1/user_profiles?id=eq.${uid}&select=*`;
    const storedSession = localStorage.getItem('sb-vcebeykrumeydnpdajzp-auth-token');
    const token = storedSession ? JSON.parse(storedSession).access_token : null;

    const res = await fetch(url, {
      headers: {
        'apikey': supabaseAnonKey || '',
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await res.json();
    console.log('[Supabase] user_profiles result:', data);

    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }
    return null;
  } catch (err) {
    console.error('Error fetching user profile:', err);
    return null;
  }
}

// ============================================================================
// Permission Functions
// ============================================================================

export async function checkPermission(
  userId: string,
  permissionId: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('user_has_permission', {
    p_user_id: userId,
    p_permission_id: permissionId,
  });

  if (error) {
    console.error('Error checking permission:', error);
    return false;
  }

  return data === true;
}

export async function getUserPermissions(userId: string): Promise<string[]> {
  console.log('[Supabase] getUserPermissions called, userId:', userId);

  try {
    const storedSession = localStorage.getItem('sb-vcebeykrumeydnpdajzp-auth-token');
    const token = storedSession ? JSON.parse(storedSession).access_token : null;
    const headers = {
      'apikey': supabaseAnonKey || '',
      'Authorization': `Bearer ${token}`,
    };

    // Get user's role from profile
    const profileUrl = `${supabaseUrl}/rest/v1/user_profiles?id=eq.${userId}&select=role`;
    const profileRes = await fetch(profileUrl, { headers });
    const profileData = await profileRes.json();
    console.log('[Supabase] Profile for permissions:', profileData);

    if (!Array.isArray(profileData) || profileData.length === 0) return [];
    const role = profileData[0].role;

    // Get role permissions
    const rolePermsUrl = `${supabaseUrl}/rest/v1/role_permissions?role=eq.${role}&select=permission_id`;
    const rolePermsRes = await fetch(rolePermsUrl, { headers });
    const rolePerms = await rolePermsRes.json();
    console.log('[Supabase] Role permissions:', rolePerms);

    // Get user overrides
    const overridesUrl = `${supabaseUrl}/rest/v1/user_permission_overrides?user_id=eq.${userId}&select=permission_id,granted`;
    const overridesRes = await fetch(overridesUrl, { headers });
    const overrides = await overridesRes.json();
    console.log('[Supabase] User overrides:', overrides);

    const permissions = new Set<string>();

    // Add role permissions
    if (Array.isArray(rolePerms)) {
      rolePerms.forEach((rp: { permission_id: string }) => permissions.add(rp.permission_id));
    }

    // Apply overrides
    if (Array.isArray(overrides)) {
      overrides.forEach((o: { permission_id: string; granted: boolean }) => {
        if (o.granted) {
          permissions.add(o.permission_id);
        } else {
          permissions.delete(o.permission_id);
        }
      });
    }

    console.log('[Supabase] Final permissions:', Array.from(permissions));
    return Array.from(permissions);
  } catch (err) {
    console.error('[Supabase] Error getting permissions:', err);
    return [];
  }
}

// ============================================================================
// Data Functions - Fields
// ============================================================================

export async function fetchFields(): Promise<FieldDefinition[]> {
  const data = await restGet<DbFieldDefinition>('field_definitions', 'select=*&order=sort_order');
  return data.map(dbFieldToFrontend);
}

export async function createField(
  field: FieldDefinition,
  organizationId: string
): Promise<FieldDefinition | null> {
  const dbField = frontendFieldToDb(field, organizationId);

  const { data, error } = await supabase
    .from('field_definitions')
    .insert(dbField)
    .select()
    .single();

  if (error) {
    console.error('Error creating field:', error);
    return null;
  }

  return dbFieldToFrontend(data);
}

export async function updateField(
  field: FieldDefinition,
  organizationId: string
): Promise<FieldDefinition | null> {
  const { data, error } = await supabase
    .from('field_definitions')
    .update({
      name: field.name,
      field_type: field.type,
      is_visible: field.visible,
      sort_order: field.order,
      column_width: field.width,
      layout: field.layout,
      options: field.options,
    })
    .eq('id', field.id)
    .eq('organization_id', organizationId)
    .select()
    .single();

  if (error) {
    console.error('Error updating field:', error);
    return null;
  }

  return dbFieldToFrontend(data);
}

export async function deleteField(
  fieldId: string,
  organizationId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('field_definitions')
    .delete()
    .eq('id', fieldId)
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error deleting field:', error);
    return false;
  }

  return true;
}

// ============================================================================
// Data Functions - Customers
// ============================================================================

export async function fetchCustomers(): Promise<CustomerRecord[]> {
  const data = await restGet<DbCustomer>('customers', 'select=*&deleted_at=is.null&order=created_at.desc');
  return data.map(dbCustomerToFrontend);
}

export async function createCustomer(
  record: CustomerRecord,
  organizationId: string
): Promise<CustomerRecord | null> {
  const { id, created_at, ...data } = record;

  const { data: newRecord, error } = await supabase
    .from('customers')
    .insert({
      organization_id: organizationId,
      data,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating customer:', error);
    return null;
  }

  return dbCustomerToFrontend(newRecord);
}

export async function updateCustomer(
  record: CustomerRecord
): Promise<CustomerRecord | null> {
  const { id, created_at, ...data } = record;

  const { data: updated, error } = await supabase
    .from('customers')
    .update({ data })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating customer:', error);
    return null;
  }

  return dbCustomerToFrontend(updated);
}

export async function deleteCustomer(id: string): Promise<boolean> {
  // Soft delete
  const { error } = await supabase
    .from('customers')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error deleting customer:', error);
    return false;
  }

  return true;
}

// ============================================================================
// Data Functions - Automation Rules
// ============================================================================

export async function fetchAutomationRules(): Promise<DependencyRule[]> {
  const data = await restGet<DbAutomationRule>('automation_rules', 'select=*&is_active=eq.true&order=sort_order');
  return data.map(dbRuleToFrontend);
}

export async function saveAutomationRules(
  rules: DependencyRule[],
  organizationId: string
): Promise<boolean> {
  // Delete existing and insert new (simple approach)
  const { error: deleteError } = await supabase
    .from('automation_rules')
    .delete()
    .eq('organization_id', organizationId);

  if (deleteError) {
    console.error('Error deleting old rules:', deleteError);
    return false;
  }

  if (rules.length === 0) return true;

  const dbRules = rules.map((r) => frontendRuleToDb(r, organizationId));

  const { error: insertError } = await supabase
    .from('automation_rules')
    .insert(dbRules);

  if (insertError) {
    console.error('Error inserting rules:', insertError);
    return false;
  }

  return true;
}

// ============================================================================
// Organization & Team Functions
// ============================================================================

export async function fetchOrganization(): Promise<Organization | null> {
  const profile = await getCurrentUserProfile();
  if (!profile) return null;

  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', profile.organization_id)
    .single();

  if (error) {
    console.error('Error fetching organization:', error);
    return null;
  }

  return data;
}

export async function fetchTeams(): Promise<Team[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching teams:', error);
    return [];
  }

  return data;
}

export async function fetchUsers(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('is_active', true)
    .order('full_name');

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  return data;
}

// ============================================================================
// Invite User Function
// ============================================================================

export async function inviteUser(
  email: string,
  fullName: string,
  role: 'ceo' | 'team_lead' | 'staff',
  teamId?: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getCurrentUserProfile();
  if (!profile) {
    return { success: false, error: 'Not authenticated' };
  }

  // Create user via Supabase Auth Admin (requires service role key on backend)
  // For now, use invite link approach
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name: fullName,
      role,
      team_id: teamId,
      organization_id: profile.organization_id,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

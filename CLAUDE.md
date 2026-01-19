# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FlexiCRM is a configurable CRM built with React 19, TypeScript, and Supabase. Features:
- Dynamic field definitions with JSONB storage
- Drag-and-drop form layout editor
- Automation rules (field dependencies)
- Role-based access control (CEO > Team Lead > Staff)
- Multi-user authentication

## Commands

```bash
npm install    # Install dependencies
npm run dev    # Start Vite dev server (http://localhost:5173)
npm run build  # Production build
npm run preview # Preview production build
```

## Setup

### 1. Supabase Configuration
1. Create project at https://supabase.com
2. Run `supabase-schema.sql` in SQL Editor
3. Copy API keys to `.env.local`:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Demo Mode
Without Supabase configuration, the app runs in demo mode with mock data.

## Architecture

### State Management
- **With Supabase**: Data fetched via custom hooks (`useCustomers`, `useFields`, `useAutomationRules`)
- **Demo Mode**: Falls back to mock data from `services/mockStore.ts`

### Authentication & Permissions
- `AuthContext.tsx` - Manages auth state, user profile, permissions
- Permissions stored in `role_permissions` table
- RLS policies enforce data access at database level

### Type System (`types.ts`)
```typescript
FieldDefinition   // Schema for a column
CustomerRecord    // Dynamic object with field values in JSONB
DependencyRule    // Automation rule (IF/THEN)
UserProfile       // User with role and organization
UserRole          // 'ceo' | 'team_lead' | 'staff'
```

### Component Structure

```
App.tsx                          # Auth wrapper + main CRM
├── contexts/
│   └── AuthContext.tsx          # Authentication state
├── hooks/
│   ├── useCustomers.ts          # Customer CRUD
│   ├── useFields.ts             # Field definitions
│   └── useAutomationRules.ts    # Dependency rules
├── components/
│   ├── Auth/
│   │   └── LoginForm.tsx        # Login/signup form
│   ├── CRM/
│   │   ├── Table.tsx            # Data grid
│   │   ├── RecordModal.tsx      # Record editor + layout editor
│   │   └── NewFieldModal.tsx    # Quick-add field
│   ├── Settings/
│   │   └── FieldManager.tsx     # Schema + rules editor
│   └── ui/
│       └── Badge.tsx            # Status badge
└── services/
    ├── supabase.ts              # Supabase client + API functions
    └── mockStore.ts             # Demo data
```

### Database Schema (Supabase)

| Table | Purpose |
|-------|---------|
| `organizations` | Multi-tenant isolation |
| `user_profiles` | User info + role |
| `teams` | Team structure |
| `field_definitions` | Dynamic field schema |
| `customers` | Records with JSONB `data` column |
| `automation_rules` | IF/THEN rules |
| `permissions` | Permission definitions |
| `role_permissions` | Default role permissions |

### Key Patterns

**JSONB for Dynamic Fields**: Customer data stored as `{"f_name": "value", "f_status": "opt_lead", ...}`

**Permission Checking**: `hasPermission(PERMISSIONS.SCHEMA_FIELDS_UPDATE)` in components

**RLS Policies**: Database-level access control based on user role and ownership

### Styling
- Tailwind CSS via CDN
- Brand colors: `brand-500` through `brand-900` (teal)
- Icons: `lucide-react`

## Permission Levels

| Permission | CEO | Team Lead | Staff |
|------------|-----|-----------|-------|
| Edit schema | ✅ | ❌ | ❌ |
| View all customers | ✅ | ✅ | ❌ |
| Edit team customers | ✅ | ✅ | ❌ |
| Edit own customers | ✅ | ✅ | ✅ |
| Manage users | ✅ | ❌ | ❌ |

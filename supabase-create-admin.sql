-- =============================================================================
-- FlexiCRM 초기 관리자 계정 생성
--
-- 이 스크립트를 Supabase Dashboard > SQL Editor에서 실행하세요.
--
-- 로그인 정보:
--   아이디: admin
--   비밀번호: 1234
--
-- (내부적으로 admin@flexicrm.local / 1234##crm 로 저장됨)
-- =============================================================================

-- 1. 조직 생성
INSERT INTO organizations (id, name, settings)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'FlexiCRM',
    '{}'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Admin 사용자 생성 (Supabase Auth)
-- 주의: 이 방식은 auth.users에 직접 삽입합니다.
-- Supabase Dashboard > Authentication > Users에서 수동으로 생성하는 것이 더 안전합니다.

-- 방법 A: SQL로 직접 생성 (테스트용)
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud,
    confirmation_token
)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'admin@flexicrm.local',
    crypt('1234##crm', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "관리자"}',
    FALSE,
    'authenticated',
    'authenticated',
    ''
)
ON CONFLICT (id) DO UPDATE SET
    encrypted_password = crypt('1234##crm', gen_salt('bf')),
    updated_at = NOW();

-- 3. Auth identities 생성 (필수)
INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    '{"sub": "b0000000-0000-0000-0000-000000000001", "email": "admin@flexicrm.local"}',
    'email',
    'admin@flexicrm.local',
    NOW(),
    NOW(),
    NOW()
)
ON CONFLICT (provider_id, provider) DO NOTHING;

-- 4. User profile 생성 (CEO 역할)
INSERT INTO user_profiles (
    id,
    organization_id,
    email,
    full_name,
    role,
    is_active
)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'admin@flexicrm.local',
    '관리자',
    'ceo',
    TRUE
)
ON CONFLICT (id) DO UPDATE SET
    role = 'ceo',
    is_active = TRUE;

-- 5. 기본 필드 정의 추가
INSERT INTO field_definitions (id, organization_id, name, field_type, is_visible, is_system, sort_order, column_width, layout, options)
VALUES
    ('f_name', 'a0000000-0000-0000-0000-000000000001', '이름', 'text', TRUE, TRUE, 0, 200, '{"x": 0, "y": 0, "w": 6, "h": 1}', '[]'),
    ('f_email', 'a0000000-0000-0000-0000-000000000001', '이메일', 'email', TRUE, FALSE, 1, 250, '{"x": 6, "y": 0, "w": 6, "h": 1}', '[]'),
    ('f_status', 'a0000000-0000-0000-0000-000000000001', '상태', 'select', TRUE, FALSE, 2, 150, '{"x": 0, "y": 1, "w": 4, "h": 1}', '[{"id": "opt_lead", "label": "신규", "color": "bg-blue-100 text-blue-800"}, {"id": "opt_contacted", "label": "연락완료", "color": "bg-yellow-100 text-yellow-800"}, {"id": "opt_closed", "label": "계약완료", "color": "bg-green-100 text-green-800"}, {"id": "opt_lost", "label": "실패", "color": "bg-red-100 text-red-800"}]'),
    ('f_phone', 'a0000000-0000-0000-0000-000000000001', '전화번호', 'text', TRUE, FALSE, 3, 150, '{"x": 4, "y": 1, "w": 4, "h": 1}', '[]'),
    ('f_amount', 'a0000000-0000-0000-0000-000000000001', '예상금액', 'currency', TRUE, FALSE, 4, 120, '{"x": 8, "y": 1, "w": 4, "h": 1}', '[]')
ON CONFLICT (id, organization_id) DO NOTHING;

-- =============================================================================
-- 완료!
--
-- 로그인: admin / 1234
-- =============================================================================

SELECT '✅ Admin 계정 생성 완료! 로그인: admin / 1234' AS result;

# GUARDRAILS.md - FlexiCRM 시행착오 및 해결 기록

> **목적:** 미래의 AI 에이전트 및 개발자가 동일한 실수를 반복하지 않도록 하는 참조 문서
>
> **마지막 업데이트:** 2026-01-20

---

## 1. Supabase RLS 무한 루프 문제

### 증상

- `supabase.from('table').select()` 호출 시 **무한 대기** 또는 **timeout**
- 브라우저 콘솔에 아무런 에러 없이 요청이 hang됨
- 네트워크 탭에서 요청이 pending 상태로 유지

### 원인

```sql
-- 문제가 되는 RLS 정책 패턴
CREATE POLICY user_profiles_read ON user_profiles
    FOR SELECT USING (organization_id = get_user_org(auth.uid()));

-- get_user_org 함수가 user_profiles를 조회함 → 무한 재귀
CREATE FUNCTION get_user_org(p_user_id UUID) RETURNS UUID AS $$
    SELECT organization_id FROM user_profiles WHERE id = p_user_id;
$$ LANGUAGE sql;
```

RLS 정책이 `get_user_org()` 호출 → 함수가 `user_profiles` 조회 → RLS 정책 재평가 → **무한 루프**

### 해결책

**옵션 A: user_profiles 테이블 RLS 비활성화**

```sql
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
```

**옵션 B: REST API 직접 호출 (권장)**

```typescript
// services/supabase.ts
async function restFetch<T>(table: string, query: string = ''): Promise<T[]> {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?${query}`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
      }
    }
  );
  return response.json();
}
```

### 예방책

- ⚠️ **RLS 정책에서 자기참조 함수 사용 금지**
- 프로필/권한 테이블은 RLS를 끄거나 직접 REST 호출 사용
- 새 RLS 정책 작성 시 순환 참조 여부 검토

---

## 2. React Strict Mode 이중 마운트 문제

### 증상

- 로그인 후 데이터가 **잠깐 보였다가 사라짐**
- 콘솔에 동일한 이벤트가 2회 출력됨
- 상태가 초기화되는 듯한 동작

### 원인

React 18의 Strict Mode는 개발 환경에서 **컴포넌트를 2회 마운트**하여 부작용(side effect)을 감지함. 인증 상태 변경 리스너가 2회 등록되어 이벤트가 중복 처리됨.

### 해결책

```tsx
// index.tsx - Strict Mode 비활성화
root.render(<App />);

// 기존 (문제 발생)
// root.render(<React.StrictMode><App /></React.StrictMode>);
```

### 예방책

- 인증/구독 로직에서 **cleanup 함수 반드시 구현**
- Strict Mode 영향을 고려한 상태 관리 설계
- 프로덕션에서는 Strict Mode가 꺼지므로, 개발 중 이상 동작 시 이 점 인지

---

## 3. onAuthStateChange 이벤트 중복 처리 문제

### 증상

- 로그인 버튼 클릭 후 **대시보드 진입 안됨**
- 콘솔에 `SIGNED_IN` 이벤트가 **무시됨** 로그 출력
- 무한 로딩 상태

### 원인

`onAuthStateChange`가 발생시키는 이벤트:

1. `INITIAL_SESSION` - 페이지 로드 시
2. `SIGNED_IN` - 세션 복원 또는 로그인 시

**문제:** 초기 세션 복원과 수동 로그인을 구분하지 못하고 모든 `SIGNED_IN`을 스킵함

### 해결책

```typescript
// contexts/AuthContext.tsx
let hasInitialized = false;

supabase.auth.onAuthStateChange(async (event, session) => {
  // 초기 이벤트만 스킵 (첫 번째 SIGNED_IN)
  if (event === 'INITIAL_SESSION' || (event === 'SIGNED_IN' && !hasInitialized)) {
    hasInitialized = true;
    return; // 스킵
  }
  hasInitialized = true;

  // 수동 로그인은 처리
  if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
    setUser(session?.user ?? null);
    if (session?.user) {
      await loadUserData(session.user.id);
    }
  }
});
```

### 예방책

- 인증 이벤트 로깅 필수 (`console.log('[Auth] event:', event)`)
- 이벤트 타입별 처리 로직 명확히 분리
- `initSession()`과 `onAuthStateChange`의 역할 구분

---

## 4. 인증 레이스 컨디션 (로딩 상태 관리)

### 증상

- 로그인 성공 로그는 보이지만 **빈 화면**
- 사이드바 메뉴가 **누락됨** (Settings 메뉴 안 보임)
- `organizationId`가 `undefined`로 데이터 요청 실패

### 원인

```typescript
// 문제 코드
const handleSignIn = async (email, password) => {
  await supabase.auth.signInWithPassword({ email, password });
  setLoading(false); // ❌ 프로필 로드 전에 false로 설정
};
```

`setLoading(false)`가 `onAuthStateChange`에서 프로필을 로드하기 **전에** 호출되어, App 컴포넌트가 프로필 없이 렌더링됨.

### 해결책

```typescript
// handleSignIn에서 setLoading(false) 제거
const handleSignIn = async (email, password) => {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    setLoading(false);
    return { error: error.message };
  }
  // loading은 onAuthStateChange에서 관리
  return { error: null };
};

// onAuthStateChange에서 로딩 관리
if (event === 'SIGNED_IN') {
  setLoading(true);
  await loadUserData(session.user.id);
  setLoading(false); // ✅ 프로필 로드 완료 후
}
```

### 예방책

- **비동기 체인에서 loading 상태 흐름도 그리기**
- 상태 변경 타이밍 콘솔 로깅으로 검증
- 컴포넌트가 필수 데이터(profile, organizationId) 없이 렌더링되지 않도록 가드

---

## 5. Vercel 배포 환경 변수 오류

### 증상

- 환경 변수 입력 시 에러: `"Only letters, digits, and underscores are allowed"`

### 원인

**NAME** 칸에 **VALUE** 값(URL)을 잘못 입력함

```
❌ NAME: https://abc.supabase.co  (URL에 . : / 포함)
✅ NAME: VITE_SUPABASE_URL
```

### 해결책

```
┌──────────────────────┬─────────────────────────────────────┐
│ NAME (Key)           │ VALUE                               │
├──────────────────────┼─────────────────────────────────────┤
│ VITE_SUPABASE_URL    │ https://xxxx.supabase.co            │
│ VITE_SUPABASE_ANON_KEY│ eyJhbGciOiJIUzI1NiIsInR5cCI6...    │
└──────────────────────┴─────────────────────────────────────┘
```

### 예방책

- 배포 전 체크리스트에 환경변수 검증 항목 추가
- `.env.local` 파일에서 복사 시 KEY=VALUE 구분 확인

---

## 6. WSL/Windows npm 호환 문제

### 증상

```
Error: Cannot find module @rollup/rollup-linux-x64-gnu
```

### 원인

Windows에서 `npm install`로 설치한 `node_modules`를 WSL(Linux) 환경에서 실행하려 함. 네이티브 바이너리 모듈이 OS별로 다름.

### 해결책

**옵션 A: Vercel 웹 대시보드로 배포** (권장)

- GitHub 연동 후 Import → 자동 빌드

**옵션 B: 동일 환경에서 재설치**

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 예방책

- 빌드는 **배포 환경과 동일한 OS**에서 실행
- CI/CD 사용 시 환경 일치 확인

---

## Quick Reference (요약 테이블)

| # | 문제 | 핵심 원인 | 해결 파일 | 키워드 |
|---|------|----------|----------|--------|
| 1 | RLS 무한루프 | 자기참조 함수 | `supabase.ts`, SQL | `get_user_org`, `user_profiles` |
| 2 | Strict Mode | 2회 렌더링 | `index.tsx` | `React.StrictMode` |
| 3 | 인증 이벤트 중복 | 이벤트 스킵 로직 | `AuthContext.tsx` | `onAuthStateChange`, `hasInitialized` |
| 4 | 레이스 컨디션 | loading 타이밍 | `AuthContext.tsx` | `setLoading`, `loadUserData` |
| 5 | 환경변수 에러 | KEY/VALUE 혼동 | Vercel Dashboard | `VITE_SUPABASE_URL` |
| 6 | OS 호환 | 네이티브 모듈 | `node_modules` | `rollup`, WSL |

---

## 디버깅 체크리스트

새로운 문제 발생 시 먼저 확인:

- [ ] 브라우저 DevTools > Console 에러 확인
- [ ] 브라우저 DevTools > Network 탭에서 요청 상태 확인
- [ ] `[Auth]`, `[Supabase]` 로그 출력 여부 확인
- [ ] Supabase Dashboard > Logs에서 서버 에러 확인
- [ ] `.env.local` 환경변수 값 정확한지 확인
- [ ] RLS 정책 활성화 상태 확인 (`ALTER TABLE ... DISABLE ROW LEVEL SECURITY`)

# FlexiCRM 변경 이력 (Changelog)

---

## 2026-01-20 - 레이아웃 현대화 & 랜딩 페이지 시스템

### 🎨 UI/UX 변경

#### 레이아웃 변경: 사이드바 → 헤더

- **기존**: 좌측 사이드바 네비게이션
- **변경**: 상단 헤더 네비게이션
- **파일**:
  - `components/Layout/Header.tsx` (신규)
  - `components/Layout/AppLayout.tsx` (신규)
  - `App.tsx` (전면 리팩토링)

#### 네비게이션 메뉴

- **Customers**: 고객 데이터베이스
- **Reception**: 접수처(랜딩 페이지) 관리 (신규)
- **Settings**: 시스템 설정

---

### 🚀 신규 기능: 랜딩 페이지 시스템

#### 접수처 관리 (Reception Manager)

- **위치**: `/reception`
- **기능**:
  - 랜딩 페이지 생성 (New Page 버튼 드롭다운)
  - 랜딩 페이지 카드 목록 (컴팩트 그리드)
  - 링크 복사 / 새 탭에서 열기
  - 카드 클릭 → 편집 모달 (미리보기 포함)
- **파일**: `components/Pages/ReceptionManager.tsx`

#### 공개 랜딩 페이지

- **위치**: `/p/:slug` (예: `/p/abc123`)
- **기능**:
  - 로그인 없이 접근 가능
  - 연락처 입력 → 고객 자동 등록
  - 커스텀 문구 지원
- **파일**: `components/Pages/PublicLandingPage.tsx`

#### 커스텀 가능한 문구 (LandingPageContent)

| 필드 | 설명 | 기본값 |
|------|------|--------|
| `title` | 페이지 제목 | "Welcome" |
| `description` | 설명 문구 | "Please enter your contact number below." |
| `inputLabel` | 입력 필드 라벨 | "Phone Number" |
| `inputPlaceholder` | Placeholder | "010-1234-5678" |
| `buttonText` | 전송 버튼 | "Submit" |
| `successTitle` | 완료 제목 | "Thank you!" |
| `successMessage` | 완료 메시지 | "Your information has been registered successfully." |

---

### 📦 신규 파일 목록

```
components/
├── Layout/
│   ├── Header.tsx          # 상단 헤더 네비게이션
│   └── AppLayout.tsx       # 메인 레이아웃 (Outlet 포함)
├── Pages/
│   ├── CustomerList.tsx    # 고객 목록 페이지
│   ├── SettingsPage.tsx    # 설정 페이지
│   ├── ReceptionManager.tsx # 접수처 관리 페이지
│   └── PublicLandingPage.tsx # 공개 랜딩 페이지
hooks/
└── useLandingPages.ts      # 랜딩 페이지 CRUD 훅
```

---

### 🗄️ 데이터베이스 변경

#### 신규 테이블: `landing_pages`

```sql
CREATE TABLE landing_pages (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    content JSONB DEFAULT '{ ... }',  -- 커스텀 문구
    created_by UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

#### 테이블 수정: `customers`

```sql
ALTER TABLE customers 
ADD COLUMN source_landing_page_id UUID REFERENCES landing_pages(id);
```

---

### 📚 의존성 추가

```json
{
  "react-router-dom": "^7.x"
}
```

---

### ⚙️ 배포 설정

#### Vercel 설정 (`vercel.json`)

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

- SPA 라우팅 지원을 위한 rewrite 규칙 추가

---

## 적용 방법

1. **의존성 설치**

   ```bash
   npm install react-router-dom
   ```

2. **DB 마이그레이션** (Supabase SQL Editor에서 실행)

   ```sql
   -- landing_pages 테이블 생성
   CREATE TABLE IF NOT EXISTS landing_pages ( ... );
   
   -- customers 테이블에 source 컬럼 추가
   ALTER TABLE customers 
   ADD COLUMN IF NOT EXISTS source_landing_page_id UUID;
   ```

3. **앱 실행**

   ```bash
   npm run dev
   ```

---

*마지막 업데이트: 2026-01-20 09:14 KST*

@AGENTS.md
# 프로젝트 개요

AI 에이전트형 프로젝트 관리 서비스의 프론트엔드.
Next.js + TypeScript + Tailwind CSS 기반으로 구현한다.

API 명세는 `api.md` 파일을 참고한다. 모든 API 호출 시 `api.md`의 명세를 정확히 따른다.

---

# 기술 스택

- Runtime: Bun
- Framework: Next.js 14 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- Server State: React Query (TanStack Query)
- Client State: Zustand
- HTTP Client: Axios
- Package Manager: Bun

---

# 명령어

## 개발 서버 실행
```bash
bun dev
```

## 빌드
```bash
bun run build
```

## 패키지 설치
```bash
bun add [패키지명]
bun add -d [패키지명]
```

---

# 디자인 토큰 규칙

색상, 폰트 크기, 간격 등 디자인 값은 절대로 컴포넌트에 직접 하드코딩하지 않는다.
반드시 `tailwind.config.ts`에 커스텀 토큰으로 정의한 후 사용한다.

## tailwind.config.ts 예시
```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#5B5BD6',
        'primary-hover': '#4B4BC6',
        surface: '#F9F9F7',
        border: '#D3D1C7',
        'text-primary': '#1A1A1A',
        'text-secondary': '#5F5E5A',
        'text-tertiary': '#888780',
        // 필요한 색상 추가
      },
      fontSize: {
        xs: '11px',
        sm: '12px',
        base: '13px',
        md: '14px',
        lg: '15px',
        xl: '20px',
        // 필요한 폰트 크기 추가
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        // 필요한 값 추가
      },
    },
  },
  plugins: [],
}

export default config
```

피그마에서 확인한 색상/폰트 크기/간격 값은 위 파일에 먼저 정의하고, 컴포넌트에서 `text-primary`, `bg-surface` 형태로 사용한다.

---

# 프로젝트 구조

```
src/
├── app/                        # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx
│   └── [feature]/
│       └── page.tsx
├── components/
│   ├── ui/                     # 공통 UI 컴포넌트 (Button, Input 등)
│   └── [feature]/              # 기능별 컴포넌트
├── hooks/                      # 커스텀 훅 (React Query 훅 포함)
├── store/                      # Zustand 스토어
├── lib/
│   ├── axios.ts                # Axios 인스턴스 설정
│   └── queryClient.ts          # React Query 클라이언트 설정
├── types/                      # TypeScript 타입 정의
└── constants/                  # 상수 정의
```

---

# 코드 작성 규칙

## 컴포넌트
- 컴포넌트는 최대한 작은 단위로 분리한다
- 모든 컴포넌트는 TypeScript로 작성하고 props 타입을 명시한다
- `'use client'` 는 필요한 경우에만 사용한다 (이벤트 핸들러, 훅 사용 시)
- 파일명은 PascalCase (예: `ProjectCard.tsx`)

## Axios 설정
```ts
// src/lib/axios.ts
import axios from 'axios'

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})
```

## React Query
- 서버 데이터 fetching/mutation은 React Query로 관리한다
- 커스텀 훅으로 분리한다 (예: `useProjects`, `useMeeting`)
- query key는 `constants/queryKeys.ts`에 상수로 정의한다

```ts
// src/constants/queryKeys.ts
export const QUERY_KEYS = {
  projects: ['projects'] as const,
  project: (id: string) => ['projects', id] as const,
  meetings: (projectId: string) => ['meetings', projectId] as const,
  meeting: (id: string) => ['meeting', id] as const,
  schedules: (projectId: string, year: number, month: number) => ['schedules', projectId, year, month] as const,
  memos: (projectId: string) => ['memos', projectId] as const,
}
```

## Zustand
- 클라이언트 전용 상태 (UI 상태, 선택된 항목 등)만 Zustand로 관리한다
- 서버 데이터는 React Query로 관리하고 Zustand에 넣지 않는다
- 스토어 파일명: `src/store/[feature]Store.ts`

## TypeScript
- `any` 사용 금지
- API 응답 타입은 `src/types/` 에 정의한다
- 타입명은 PascalCase (예: `Project`, `Meeting`, `Schedule`)

## SSE (Server-Sent Events)
- 해당 엔드포인트: `POST /meetings/:meetingId/audio`, `POST /projects/:projectId/agent`
- POST 요청이라 EventSource는 사용 불가. `fetch` + `ReadableStream` 또는 `@microsoft/fetch-event-source` 등 적절한 방법을 판단해서 사용한다
- 스트리밍 응답을 실시간으로 청크 단위로 처리할 수 있어야 한다

## 환경변수
서버 주소 등 설정값은 `.env.local` 파일에 분리해서 관리한다. 코드에 직접 하드코딩하지 않는다.
`.env.local`은 `.gitignore`에 추가해 커밋하지 않는다.

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

백엔드 서버는 `http://localhost:8080`에서 실행된다.
Axios 인스턴스의 `baseURL`은 `process.env.NEXT_PUBLIC_API_URL`을 참조한다.

---

# API 연동 확인 규칙

각 API 연동 구현 후 실제 curl로 백엔드 서버에 요청을 보내 동작을 확인한다.
백엔드 서버(`http://localhost:8080`)가 실행 중인지 먼저 확인한다.

확인 항목:
- HTTP 상태 코드가 `api.md` 명세와 일치하는지
- Response body 구조와 필드가 명세와 일치하는지
- 프론트에서 받은 데이터가 화면에 올바르게 렌더링되는지

```bash
# 예시: 프로젝트 목록 조회
curl http://localhost:8080/projects

# 예시: 프로젝트 생성
curl -X POST http://localhost:8080/projects \
  -w "\n상태코드: %{http_code}\n"
```

curl 테스트가 실패하거나 명세와 다르면 백엔드 팀에 확인 후 프론트 코드를 수정한다.

---

# 피그마 작업 규칙

피그마 링크: https://www.figma.com/design/gj6McZdTOPMh2mTf1PbPwn/Aidee?node-id=205-587&t=979oZR3byjAD1SAT-1

1. 위 피그마 링크의 node-id=205-587 섹션을 열고 디자인을 확인한다
2. 피그마 코멘트를 모두 읽고 인터랙션/액션 요구사항을 파악한다
3. `tailwind.config.ts`에 해당 섹션의 디자인 토큰(색상, 폰트, 간격)을 먼저 정의한다
4. 컴포넌트를 작은 단위로 쪼개서 구현한다
5. 코멘트에 명시된 인터랙션(클릭, 호버, 상태 변화 등)을 모두 구현한다

---

# 커밋 규칙

```
feat: 프로젝트 목록 컴포넌트 구현
feat: 회의 생성 모달 구현
style: 디자인 토큰 tailwind.config 추가
fix: 일정 조회 날짜 필터 오류 수정
refactor: MeetingCard 컴포넌트 분리
```

## 커밋 단위
- 컴포넌트 1개 또는 페이지 1개 단위로 커밋
- 디자인 토큰 추가는 별도 커밋
- 너무 많은 변경을 하나의 커밋에 넣지 않는다
- 화면이 정상적으로 렌더링되는 것을 확인한 후 커밋한다

---

# 구현 순서

1. `tailwind.config.ts`에 디자인 토큰 정의 후 커밋
2. `src/lib/axios.ts` Axios 인스턴스 설정
3. `src/lib/queryClient.ts` React Query 클라이언트 설정
4. `src/types/` API 응답 타입 정의
5. `src/constants/queryKeys.ts` query key 상수 정의
6. 공통 UI 컴포넌트 구현 (`src/components/ui/`)
7. 피그마 섹션 기준으로 페이지/컴포넌트 구현
8. 각 단위 완료 시 커밋
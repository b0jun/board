# 익명 게시판 — Next.js 폴더 구조 데모

로그인 없는 게시판을 소재로, Next.js App Router 프로젝트의 폴더 구조와 데이터 계층을 보여 주는 데모다. 글 목록을 페이지 단위로 보고, 글을 쓰고, 글 상세를 읽는다. 글은 SQLite 파일에 저장되어 서버를 다시 띄워도 남는다.

스택: Next.js 16 (App Router, Cache Components) · React 19 · TanStack Query v5 · Drizzle ORM + better-sqlite3 · zod · sonner · Tailwind CSS v4

## 실행

```bash
pnpm install
pnpm db:seed   # 선택: 샘플 글 35개 (이미 글이 있으면 건너뛴다)
pnpm dev
```

<http://localhost:3000>을 연다. DB 파일 `data/board.db`와 테이블은 첫 요청 때 자동으로 만들어진다.

| 스크립트 | 하는 일 |
| --- | --- |
| `pnpm dev` | 개발 서버 |
| `pnpm build` | 프로덕션 빌드 (타입 검사 포함) |
| `pnpm lint` | ESLint (import 방향 규칙 포함) |
| `pnpm db:generate` | `src/shared/db/schema.ts` 변경을 `drizzle/`의 마이그레이션 SQL로 생성 |
| `pnpm db:seed` | 샘플 글 삽입 |

로컬 실행 전용이다. SQLite 파일은 서버리스 배포 환경에서 유지되지 않는다.

## 폴더 구조

```text
src/
├─ app/                          라우팅 전용. 화면 조립과 HTTP 입출력만 한다
│  ├─ layout.tsx · providers.tsx   전역 레이아웃, QueryClientProvider
│  ├─ posts/
│  │  ├─ layout.tsx                게시판 공통 틀
│  │  ├─ page.tsx                  목록   /posts?page=N&category=…&q=…
│  │  ├─ error.tsx                 목록·상세·작성의 오류 화면
│  │  ├─ new/page.tsx              작성   /posts/new
│  │  └─ [id]/page.tsx · not-found.tsx   상세   /posts/{id}
│  └─ api/posts/
│     ├─ route.ts                  GET 목록, POST 작성
│     └─ [id]/route.ts             GET 상세
│
├─ features/                     기능 단위. 한 기능의 코드는 한 폴더에 모은다
│  └─ posts/
│     ├─ schemas/post-schema.ts    zod 스키마 (폼과 API가 함께 쓴다)
│     ├─ types.ts                  Post, PostListResponse 등
│     ├─ server/                   서버 전용 (server-only)
│     │  ├─ post-service.ts          규칙: 페이지 계산, 날짜 변환
│     │  └─ post-repository.ts       SQL
│     ├─ api/post-api.ts           브라우저에서 /api/posts를 부르는 함수
│     ├─ lib/post-list-href.ts     페이지·필터 → 목록 URL
│     ├─ queries/
│     │  ├─ post-queries.ts          queryOptions factory (쿼리 키의 유일한 출처)
│     │  └─ use-create-post.ts       작성 mutation 훅
│     └─ components/               PostList, PostFilterBar, PostDetail, PostForm, 스켈레톤
│
└─ shared/                       기능과 무관한 공용 코드
   ├─ api/                         HTTP 클라이언트, 오류 형식, Route Handler 오류 래퍼
   ├─ db/                          Drizzle 스키마와 연결
   ├─ query/                       QueryClient 생성, 전역 오류 처리
   ├─ lib/                         날짜 포맷, 실패 주입(데모용)
   └─ ui/                          Button, TextField, Pagination

drizzle/     마이그레이션 SQL (커밋한다)
scripts/     seed.ts
data/        SQLite 파일 (git 제외)
```

## import 규칙

방향은 하나다.

```text
app  →  features  →  shared
```

- `shared`는 `features`와 `app`을 import하지 않는다.
- `features`는 `app`을 import하지 않는다.
- feature끼리는 서로 import하지 않는다. 두 feature가 같은 코드를 필요로 하면 `shared`로 내린다.
- feature 안에서는 상대 경로(`../queries/post-queries`)를 쓰고, 다른 계층은 별칭(`@/shared/...`)으로 부른다.

`eslint.config.mjs`의 `no-restricted-imports`가 이 규칙을 검사한다. 상대 경로로 다른 feature를 부르는 경우는 잡지 못한다.

## 요청 한 건의 흐름

### 읽기: 목록 화면

1. `src/app/posts/page.tsx` — URL의 `page`를 읽고 `postQueries.list(params)`의 키로 서버에서 데이터를 채운다. 이때 `queryFn`만 `listPosts()` 직접 호출로 바꾼다. 서버가 자기 `/api`를 HTTP로 부르지 않는다.
2. `src/features/posts/server/post-service.ts` — `listPosts()`가 전체 개수와 페이지를 계산한다.
3. `src/features/posts/server/post-repository.ts` — `postRepository.findPage()`가 SQL을 실행한다.
4. `HydrationBoundary`가 결과를 브라우저로 넘긴다.
5. `src/features/posts/components/post-list.tsx` — `useSuspenseQuery(postQueries.list(params))`로 같은 키의 데이터를 읽어 그린다.

브라우저에서 데이터가 낡았거나 무효화되면 같은 쿼리가 이번에는 원래 `queryFn`으로 다시 실행된다.

```text
PostList → postQueries.list → post-api.ts fetchPosts → GET /api/posts
        → app/api/posts/route.ts → post-service.ts → post-repository.ts → SQLite
```

### 쓰기: 글 작성

```text
PostForm → createPostSchema 검증 → useCreatePost → post-api.ts createPost → POST /api/posts
        → app/api/posts/route.ts (같은 스키마로 다시 검증) → post-service.ts → post-repository.ts
```

성공하면 `useCreatePost`가 `postQueries.lists()` 키를 무효화하고, 폼은 `/posts/{id}`로 이동한다.

## 계층별 책임

| 계층 | 하는 일 | 하지 않는 일 |
| --- | --- | --- |
| `app/**/page.tsx` | URL 읽기, 서버에서 데이터 채우기, 컴포넌트 배치 | 데이터 가공, 스타일이 많은 UI |
| `app/api/**/route.ts` | 입력 파싱, 성공 응답 | 규칙, SQL, 오류 응답 분기 |
| `server/post-service.ts` | 규칙, DB 행 → 응답 형태 변환 | HTTP, SQL 문법 |
| `server/post-repository.ts` | SQL | 규칙 |
| `queries/` | 쿼리 키, `queryFn`, 캐시 무효화 | 화면 |
| `components/` | 화면, 사용자 입력 | `fetch` 직접 호출 |

## React Query factory

쿼리 키와 `queryFn`을 `src/features/posts/queries/post-queries.ts` 한 곳에 둔다.

```ts
postQueries.all()          // ["posts"]
postQueries.lists()        // ["posts", "list"]
postQueries.list(params)   // ["posts", "list", { page, size }]  + queryFn
postQueries.details()      // ["posts", "detail"]
postQueries.detail(id)     // ["posts", "detail", id]            + queryFn
```

- `useSuspenseQuery`, 서버의 `queryClient.query()`, `invalidateQueries`가 같은 객체를 받는다. 키를 손으로 다시 쓰는 곳이 없다.
- 키가 계층을 이루므로 `lists()` 하나로 모든 페이지의 목록을 무효화한다.
- `queryOptions()`가 키에 데이터 타입을 묶어 `getQueryData`와 `setQueryData`의 타입이 추론된다.

## 목록 필터

카테고리(`category`)와 제목 검색(`q`) 두 가지다. 필터 상태는 URL에만 있다: `/posts?category=question&q=검색어&page=2`.

```text
PostFilterBar (client)  ──router.push/replace──▶  URL
                                                   │
PostsPage (server)  ◀── searchParams ──────────────┘
  └ PostListSection: postListSearchSchema로 파싱 → listPosts(params) → hydrate
      └ PostList (client): useSuspenseQuery(postQueries.list(params))
```

`useSuspenseQuery`와 필터를 함께 쓸 때 생기는 문제 두 가지를 구조로 막았다.

- **필터를 바꿀 때 스켈레톤이 깜빡이는 문제** — `PostFilterBar`가 이동을 `startTransition`으로 감싼다. 새 목록이 준비될 때까지 이전 목록이 화면에 남고, 그동안 「불러오는 중…」만 표시된다.
- **입력 중에 검색창이 초기화되거나 포커스를 잃는 문제** — `PostFilterBar`는 목록의 `<Suspense>` 경계 밖에 있다(`src/app/posts/page.tsx`). 목록이 로딩 상태가 되어도 검색창은 교체되지 않는다.

그 밖의 규칙:

- 필터를 바꾸면 1페이지로 돌아간다. 페이지 링크는 현재 필터를 유지한다(`postListHref`).
- 검색어는 300ms debounce 뒤에 `router.replace`로 반영한다. 글자마다 히스토리가 쌓이지 않는다.
- URL은 사람이 고칠 수 있으므로 화면 쪽 파싱은 실패하지 않는다. 잘못된 `category`는 「전체」, 잘못된 `page`는 1페이지가 된다. API는 같은 값에 `400`을 돌려준다.
- 쿼리 키는 `["posts", "list", { page, size, q, category }]`다. `params`를 통째로 키에 넣으므로 필터를 추가해도 factory는 바뀌지 않는다.

## 오류 처리

오류의 형태는 한 가지이고, 처리하는 곳은 종류별로 정해져 있다.

```text
서버  throw AppError / ZodError / 그 밖의 예외
        → withErrorHandling → { error: { code, message, fieldErrors? } }
브라우저  http-client → HttpError(status, code, message, fieldErrors)
        → QueryCache / MutationCache (전역) → 폼, error.tsx (화면)
```

| 오류 | 처리하는 곳 | 사용자에게 보이는 것 |
| --- | --- | --- |
| 입력 검증 실패 (`fieldErrors` 있음) | `PostForm` | 필드 아래 문구 |
| 작성 실패 (그 밖) | `MutationCache.onError` | 토스트 |
| 조회 실패, 화면에 데이터 없음 | `src/app/posts/error.tsx` | 오류 화면과 「다시 시도」 |
| 조회 실패, 이전 데이터가 화면에 있음 | `QueryCache.onError` | 토스트 (화면은 유지) |
| 서버의 예상 못 한 예외 | `withErrorHandling` | `500 INTERNAL_ERROR` 고정 문구. 원인은 서버 로그에만 남는다 |

- **서버** — Route Handler를 `withErrorHandling()`(`src/shared/api/with-error-handling.ts`)으로 감싼다. 핸들러는 `schema.parse()`와 `throw new AppError(404, ...)`만 쓰고 `try/catch`와 응답 분기를 쓰지 않는다.
- **브라우저** — 전역 처리는 `src/shared/query/get-query-client.ts`의 `QueryCache`·`MutationCache` 콜백 한 곳에 있다. 컴포넌트는 자기만 할 수 있는 일(필드 오류 표시)만 한다.
- **재시도** — 4xx는 다시 보내도 결과가 같아 재시도하지 않는다. 그 밖의 실패는 두 번까지 다시 시도한다.
- **타입** — `Register.defaultError`를 `HttpError`로 등록해 모든 훅의 `error`가 `HttpError`로 추론된다.

### 일부러 실패시켜 보기

`.env.local`에 실패 비율을 적으면 service 호출의 그만큼이 `503 TEMPORARY_FAILURE`로 실패한다(`src/shared/lib/chaos.ts`). 값을 바꾼 뒤에는 개발 서버를 다시 띄운다.

```bash
# .env.local
CHAOS_FAILURE_RATE=0.5   # 절반쯤 실패. 지우거나 0이면 꺼짐
```

| 실패한 곳 | 일어나는 일 |
| --- | --- |
| 페이지 진입·필터 변경 (서버 렌더) | 오류 화면. 「다시 시도」를 누르면 서버가 다시 렌더한다 |
| 브라우저의 재요청 (`/api/posts`) | 5xx라서 자동으로 두 번 더 시도한다. 모두 실패하면 토스트, 화면의 목록은 유지 |
| 글 작성 | 토스트. 입력값이 남아 있어 「등록」을 다시 누르면 된다 (자동 재시도 없음) |

「다시 시도」는 `useQueryErrorResetBoundary().reset()`을 먼저 호출한다. 브라우저에서 실패한 쿼리는 에러 상태로 캐시에 남고, `useSuspenseQuery`는 그 에러를 재요청 없이 다시 던지기 때문이다.

## Next.js 16 Cache Components에서 주의할 점

- `better-sqlite3`는 동기 드라이버라 쿼리가 프리렌더 중에 끝난다. 그대로 두면 빌드 시점의 결과가 정적 페이지로 굳는다. `post-service.ts`의 읽기 함수는 쿼리 전에 `await io()`를 호출해 요청 시점에 실행된다.
- `searchParams`와 `params`를 읽는 컴포넌트는 `<Suspense>` 안에 둔다. 바깥의 제목과 버튼은 정적 셸로 먼저 나간다.
- DB 연결은 import 시점에 열지 않고 `getDb()`가 처음 불릴 때 연다. `next build`가 라우트 모듈을 여러 워커에서 동시에 평가하면서 SQLite 잠금을 다투기 때문이다.

## 새 feature를 추가하려면

`comments`를 예로 든다.

1. 테이블이 필요하면 `src/shared/db/schema.ts`에 추가하고 `pnpm db:generate`를 실행한다.
2. `src/features/comments/`를 만들고 필요한 폴더만 채운다.
   - `schemas/` — 입력 검증
   - `types.ts`
   - `server/` — repository와 service
   - `api/` — 브라우저용 fetch 함수
   - `queries/` — `commentQueries` factory와 mutation 훅
   - `components/`
3. `src/app/api/comments/route.ts`에서 service를 호출한다.
4. `src/app/` 아래 페이지에서 컴포넌트를 조립한다.
5. `comments`가 `posts`의 코드를 필요로 하면 그 코드를 `shared`로 옮기거나, 두 feature를 `app`의 페이지에서 조합한다.

## API

| Method · Path | 요청 | 성공 | 실패 |
| --- | --- | --- | --- |
| `GET /api/posts` | `page`(기본 1), `size`(기본 10, 최대 50), `q`(제목 검색, 50자까지), `category`(`free`·`question`·`info`) | `200 { items, page, size, totalCount, totalPages }` | `400 VALIDATION_ERROR` |
| `GET /api/posts/{id}` | | `200 Post` | `404 POST_NOT_FOUND` |
| `POST /api/posts` | `{ title, content, nickname?, category? }` | `201 Post` | `400 VALIDATION_ERROR` |

오류 본문은 `{ error: { code, message, fieldErrors? } }` 형태다. `title`은 1~100자, `content`는 1~5000자, `nickname`은 20자까지이고 비우면 `익명`으로 저장한다. `category`를 생략하면 `free`(자유)다.

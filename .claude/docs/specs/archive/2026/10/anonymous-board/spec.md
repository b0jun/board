---
feature: anonymous-board
status: done
ambiguity_score: 0.169
ambiguity_score_forced: false
rework_count: 1
jira_track: none
drift_check:
  verdict: WARN
  base_ref: origin/main
  merge_base: 297182cb6a1c667dc8ba33d118a19b1df7643d89
  head: 297182cb6a1c667dc8ba33d118a19b1df7643d89
  digest: 75b85c6559fd
  intent_digest: de69ec32a871
  mismatches:
    - intent_excerpt: "import 방향은 `app → features → shared` 한쪽으로만 흐르고 feature끼리는 서로 import하지 않는다. 이 규칙은 ESLint로 강제한다."
      category: missing
      confidence: low
      justification: "features 블록은 `@/features/*` 별칭 import만 금지해 상대 경로로 다른 feature를 부르는 경우는 lint가 잡지 못한다(README:82가 스스로 명시). 현재 feature가 posts 하나뿐이고 SC11(shared→features 실패)은 충족되므로 부분 누락인지 불확실하다."
    - intent_excerpt: "Next.js App Router 프로젝트의 폴더 구조와 데이터 계층을 보여 주는 데모 사이트를 만든다. 소재는 로그인 없는 익명 게시판이다."
      category: extra
      confidence: low
      justification: "다른 저장소(`/Users/bjun/code/my/climbing-pass`)의 pass-list 수정 지시서로 spec 의도 어디에도 대응하지 않는다. 호출자가 게시 대상에서 제외된다고 밝혔으므로 실제 변경분에 포함되는지는 불확실하다."
---

# 익명 게시판 데모 (폴더 구조 레퍼런스)

## 1. Specification

### Overview

Next.js App Router 프로젝트의 폴더 구조와 데이터 계층을 보여 주는 데모 사이트를 만든다. 소재는 로그인 없는 익명 게시판이다. 사용자는 게시글 목록을 페이지 단위로 넘겨 보고, 카테고리와 제목 검색으로 목록을 좁히고, 글을 작성하고, 글 상세를 읽는다. 작성한 글은 SQLite 파일에 저장되어 새로고침과 서버 재시작 뒤에도 남는다.

feature 이름 `anonymous-board`는 요청 문장에서 정한 가정이다.

### User Scenario

1. `/`에 접속하면 `/posts`로 이동한다.
2. `/posts`에서 최신 글부터 10개씩 본다. 각 행은 카테고리, 제목, 닉네임, 작성 시각을 보여 준다.
3. 페이지 번호나 이전·다음 버튼을 누르면 URL이 `/posts?page=N`으로 바뀌고 해당 페이지가 나온다(1페이지는 `page` 없이 `/posts`). 새로고침이나 뒤로 가기를 해도 같은 페이지가 유지된다.
4. 「글쓰기」를 눌러 `/posts/new`로 이동한다. 카테고리(자유·질문·정보, 기본 자유)를 고르고 제목과 본문을 입력한다. 닉네임은 비워 둘 수 있다.
5. 제출에 성공하면 방금 쓴 글의 상세 `/posts/{id}`로 이동한다. 목록으로 돌아가면 새 글이 1페이지 맨 위에 있다.
6. 목록에서 제목을 누르면 `/posts/{id}`에서 카테고리, 제목, 닉네임, 작성 시각, 본문을 본다.
7. 목록 위의 카테고리 칩(전체·자유·질문·정보)을 누르거나 검색창에 제목 일부를 입력하면 목록이 그 조건으로 좁혀진다. 조건은 URL에 남는다(`/posts?category=question&q=검색어&page=2`). 조건을 바꾸면 1페이지로 돌아가고, 페이지 링크는 조건을 유지한다.

### States

- 목록이 비어 있으면 「아직 게시글이 없습니다」와 글쓰기 링크를 보여 준다.
- `page` 쿼리가 1 이상의 정수가 아니면 1페이지로 취급한다. 마지막 페이지를 넘는 값이면 빈 목록 안내와 1페이지 링크를 보여 준다.
- 목록·상세를 불러오는 동안 스켈레톤을 보여 준다. 보여 줄 데이터가 없는 상태에서 요청이 실패하면 오류 문구와 「다시 시도」 버튼을 보여 주고, 버튼을 누르면 다시 불러온다.
- 필터 조건을 바꾸는 동안에는 이전 목록이 화면에 남고 「불러오는 중…」이 표시된다. 스켈레톤으로 돌아가지 않으며 검색창의 입력값과 포커스가 유지된다.
- 검색어는 입력이 300ms 멈춘 뒤 반영된다.
- 조건에 맞는 글이 없으면 「조건에 맞는 게시글이 없습니다」와 「필터 지우기」 링크를 보여 준다.
- URL의 `category`가 알려진 값이 아니면 「전체」로 취급한다.
- 작성 폼은 제출 전에 입력을 검증하고 틀린 필드 아래에 사유를 표시한다. 제출 중에는 버튼을 비활성화한다. 서버가 필드 오류를 돌려주면 해당 필드 아래에 표시하고, 그 밖의 실패(서버 오류, 연결 실패)는 입력값을 유지한 채 토스트로 알린다.
- 없는 id의 상세는 「게시글을 찾을 수 없습니다」 화면과 목록 링크를 보여 준다.
- 본문은 일반 텍스트로만 렌더링하고 줄바꿈을 유지한다. HTML은 해석하지 않는다.

### API / Data Contracts

Route Handler가 임시 백엔드 역할을 한다. 시각은 ISO 8601 문자열이다.

| Method · Path | 요청 | 성공 응답 | 실패 응답 |
| --- | --- | --- | --- |
| `GET /api/posts` | query `page`(기본 1, 1 이상 정수), `size`(기본 10, 1~50), `q`(제목 검색, 50자까지), `category`(`free`·`question`·`info`) | `200 { items: PostSummary[], page, size, totalCount, totalPages }` | `400 VALIDATION_ERROR` |
| `GET /api/posts/{id}` | path `id` | `200 Post` | `404 POST_NOT_FOUND` (정수가 아닌 id 포함) |
| `POST /api/posts` | JSON `{ title, content, nickname?, category? }` | `201 Post` | `400 VALIDATION_ERROR` |

- `PostSummary`: `{ id: number, title: string, nickname: string, category: "free" | "question" | "info", createdAt: string }`
- `Post`: `PostSummary`에 `content: string`을 더한 형태
- 오류 본문: `{ error: { code: string, message: string, fieldErrors?: Record<string, string[]> } }`
- 입력 규칙(앞뒤 공백 제거 후): `title` 1~100자, `content` 1~5000자, `nickname` 1~20자. `nickname`이 없거나 빈 문자열이면 `익명`으로 저장한다. `category`가 없으면 `free`로 저장하고, 세 값이 아니면 `400`이다.
- 정렬: `createdAt` 내림차순, 같으면 `id` 내림차순.
- 범위를 넘는 `page`는 `200`과 빈 `items`를 돌려준다.
- `q`는 제목에 그 문자열이 들어 있는 글만 남긴다(영문 대소문자 무시, `%`·`_`는 문자 그대로). `category`는 그 카테고리의 글만 남긴다. 둘을 함께 주면 둘 다 만족하는 글이다. `totalCount`와 `totalPages`는 조건을 적용한 뒤의 값이다.
- 예상하지 못한 서버 예외는 `500 INTERNAL_ERROR`와 고정 문구로 응답한다. 내부 오류 메시지는 응답에 싣지 않고 서버 로그에만 남긴다.
- 실패 주입이 켜져 있으면 세 엔드포인트가 설정한 비율로 `503 TEMPORARY_FAILURE`를 돌려준다.

DB는 SQLite 파일 `data/board.db` 하나이고 Drizzle ORM으로 접근한다. 테이블은 `posts`(`id` 자동 증가 PK, `title`, `content`, `nickname`, `category`, `created_at`) 하나다. `category`는 기본값 `free`다. 마이그레이션은 서버가 DB에 처음 연결할 때 자동으로 적용되어 `pnpm dev`만으로 실행된다. `pnpm db:seed`는 페이지네이션과 필터 확인용 샘플 글 35개를 세 카테고리에 나눠 넣는다.

실패 주입은 환경 변수 `CHAOS_FAILURE_RATE`(0~1)로 켠다. 목록 조회, 상세 조회, 글 작성이 그 비율로 실패한다. 값이 없거나 0이면 꺼져 있다.

### Target Location

```text
src/
  app/                      라우팅 전용 (page, layout, route handler)
    posts/  posts/new/  posts/[id]/
    api/posts/  api/posts/[id]/
  features/posts/           게시글 기능 한 덩어리
    api/                    브라우저에서 호출하는 fetch 함수
    lib/                    목록 URL 생성
    queries/                queryOptions factory, mutation 훅
    components/             목록, 필터 바, 폼, 상세
    schemas/                zod 스키마 (클라이언트·서버 공용)
    server/                 repository, service (서버 전용)
    types.ts
  shared/                   기능과 무관한 공용 코드
    api/  db/  query/  ui/  lib/      (페이지네이션은 ui/, 실패 주입은 lib/)
drizzle/                    마이그레이션 SQL
data/                       SQLite 파일 (git 제외)
```

### Design Notes

- 디자인 시안은 없다. 스캐폴드에 들어 있는 Tailwind CSS v4와 Geist 폰트로 단순한 화면을 만든다.
- **폴더 구조 결정(전역)**: feature 기반 구조를 쓴다. import 방향은 `app → features → shared` 한쪽으로만 흐르고 feature끼리는 서로 import하지 않는다. 이 규칙은 ESLint로 강제한다.
- **서버 상태 결정(전역)**: TanStack Query를 쓰고 쿼리 키와 `queryFn`을 feature별 `queryOptions` factory 한 곳에 둔다. 키 계층은 `all → lists → list(params)`, `all → details → detail(id)`다. mutation은 훅으로 두고 성공 시 `lists` 키를 무효화한다.
- **렌더링 결정(전역)**: 목록과 상세 페이지는 서버에서 같은 쿼리 키로 미리 불러와 hydrate한다. 서버는 자기 자신의 `/api`를 HTTP로 호출하지 않고 service를 직접 부른다. 목록은 `postQueries`의 옵션을 그대로 펼치고 `queryFn`만 service 호출로 덮어쓴다. 상세는 없는 글 판정을 위해 이미 읽은 글을 factory의 키로 캐시에 넣는다. 키는 factory가 유일한 출처로 남는다. 링크 이동(페이지 번호, 필터 변경)도 서버가 다시 렌더해 데이터를 채운다. `/api`는 브라우저의 재요청(캐시가 낡았을 때, 무효화된 뒤)과 글 작성에 쓰인다.
- **계층 결정(전역)**: Route Handler는 입력 파싱과 응답 변환만 맡는다. 규칙은 service에, SQL은 repository에 둔다.
- **오류 처리 결정(전역)**: 오류의 형태는 경계에서 한 번만 바꾸고 처리는 한 곳에서 한 번만 한다. 서버는 Route Handler를 감싸는 래퍼 하나가 모든 실패를 `{ error: { code, message, fieldErrors? } }`로 바꾼다. 브라우저는 HTTP 클라이언트가 모든 실패를 한 가지 오류 타입으로 바꾸고, QueryClient의 전역 콜백이 토스트와 재시도 정책을 맡는다. 컴포넌트는 필드 오류 표시와 오류 화면만 맡는다. 4xx는 재시도하지 않고 그 밖의 조회 실패는 두 번까지 다시 시도한다.
- **필터 결정(전역)**: 목록 필터의 상태는 URL에만 둔다. 필터 바는 목록의 Suspense 경계 밖에 두고 이동을 transition으로 감싼다.
- 개발 중에는 React Query devtools를 화면에 띄운다.

### Constraints

- 스캐폴드의 `next@16.4.0`, `react@19.3.0`, `cacheComponents: true` 설정을 유지한다.
- 로컬 실행 전용이다. SQLite 파일은 서버리스 배포 환경에서 유지되지 않는다.
- `as any`, `@ts-ignore`, `@ts-expect-error`, `console.log`를 쓰지 않는다.

### Goals

1. 게시글 목록을 10개 단위 페이지네이션으로 본다.
2. 로그인 없이 게시글을 작성한다.
3. 게시글 상세를 본다.
4. 작성한 글이 새로고침과 서버 재시작 뒤에도 남는다.
5. API가 Route Handler로 제공되고 위 계약을 따른다.
6. 코드가 feature 기반 구조와 한 방향 import 규칙을 따른다.
7. React Query 사용처가 `queryOptions` factory를 거친다.
8. 구조와 각 폴더의 역할을 README에서 읽을 수 있다.
9. 목록을 카테고리로 좁힌다.
10. 목록을 제목 검색으로 좁힌다.
11. 필터를 바꾸는 동안 이전 목록과 검색창 입력이 유지된다.
12. 서버와 브라우저의 실패가 한 가지 형태로 통일되어 공통 위치에서 처리된다.
13. 오류 화면에서 「다시 시도」로 복구한다.
14. 실패 주입을 켜서 실패와 재시도 흐름을 일부러 일으킨다.

### Success Criteria

- SC1 (G1): 글이 35개일 때 `/posts`는 최신 10개를, `/posts?page=4`는 5개를 보여 준다. 페이지네이션은 총 4페이지를 표시한다.
- SC2 (G1): 페이지 번호를 누르면 URL의 `page` 값이 바뀌고, 그 URL을 새로고침하면 같은 페이지가 나온다.
- SC3 (G1): `/posts?page=abc`는 1페이지를 보여 준다.
- SC4 (G2): 제목·본문을 채워 제출하면 `/posts/{id}`로 이동하고, `/posts` 1페이지 첫 행에 그 글이 있다.
- SC5 (G2): 닉네임을 비우고 제출한 글의 닉네임은 `익명`이다.
- SC6 (G2): 제목이나 본문이 비어 있으면 요청을 보내지 않고 해당 필드 아래에 오류를 표시한다.
- SC7 (G3): 목록에서 제목을 누르면 `/posts/{id}`에 제목, 닉네임, 작성 시각, 줄바꿈이 유지된 본문이 나온다. `<b>굵게</b>`를 본문에 쓰면 태그 문자가 그대로 보인다.
- SC8 (G3): `/posts/999999`는 「게시글을 찾을 수 없습니다」 화면을 보여 준다.
- SC9 (G4): 글을 작성한 뒤 개발 서버를 종료하고 다시 띄워도 그 글이 목록에 있다.
- SC10 (G5): `curl`로 세 엔드포인트를 호출하면 표의 상태 코드와 본문 형태가 나온다. `title`이 빈 `POST`는 `400`과 `fieldErrors.title`을 돌려준다.
- SC11 (G6): `pnpm lint`가 통과한다. `shared`에서 `features`를 import하는 줄을 임시로 넣으면 lint가 실패한다.
- SC12 (G7): `src`에서 `useQuery`·`useSuspenseQuery`·`prefetchQuery` 호출이 모두 `postQueries`의 옵션을 인자로 받는다. 쿼리 키 배열 리터럴은 factory 파일에만 있다.
- SC13 (G8): README에 폴더 트리, 폴더별 역할, import 규칙, 요청 한 건의 흐름(컴포넌트 → query → api → route → service → repository), 실행 방법이 있다.
- SC14 (전체): `pnpm build`가 통과한다.
- SC15 (G9): 시드 35건 상태에서 「질문」 칩을 누르면 URL이 `/posts?category=question`이 되고 목록의 모든 행이 「질문」 배지를 단다. `GET /api/posts?category=question`의 `totalCount`는 12다.
- SC16 (G9): 카테고리를 「질문」으로 골라 작성한 글은 상세와 목록에서 「질문」 배지를 달고, 카테고리를 건드리지 않고 작성한 글은 「자유」다.
- SC17 (G10): 시드 35건 상태에서 검색창에 `게시글 3`을 입력하면 URL에 `q`가 붙고 제목에 그 문자열이 든 7건만 나온다. `GET /api/posts?q=%25`의 `totalCount`는 0이다.
- SC18 (G9, G10): `/posts?category=question`의 2페이지 링크는 `/posts?category=question&page=2`다. `/posts?category=info&q=zzz`는 「조건에 맞는 게시글이 없습니다」와 「필터 지우기」를 보여 준다. `/posts?category=bogus`는 「전체」가 선택된 1페이지다.
- SC19 (G11): 칩을 눌러 목록이 바뀌는 동안 스켈레톤이 나타나지 않고 목록이 비는 순간이 없다. 검색창에 글자를 입력하는 동안 검색창이 포커스를 잃지 않고 입력값이 유지된다.
- SC20 (G12): `GET /api/posts?category=nope`와 `title`이 빈 `POST`는 둘 다 `400`, `code: "VALIDATION_ERROR"`, `fieldErrors`를 돌려준다. Route Handler 파일에 `try`/`catch`와 오류 응답 분기가 없다.
- SC21 (G12): Route Handler 래퍼에 일반 예외를 던지면 `500`과 `code: "INTERNAL_ERROR"`가 나오고 응답 본문에 원래 예외 메시지가 들어 있지 않다.
- SC22 (G12): 개발 서버를 끈 채 작성 폼을 제출하면 「서버에 연결하지 못했습니다.」 토스트가 뜨고 입력값이 남는다.
- SC23 (G13, G14): `CHAOS_FAILURE_RATE=0.5`로 띄우고 필터 칩을 반복해 누르면 오류 화면이 나타나고, 「다시 시도」를 반복해 누르면 목록으로 돌아온다. 오류 화면에 갇히지 않는다.
- SC24 (G14): `CHAOS_FAILURE_RATE`가 없으면 `GET /api/posts` 30회가 모두 `200`이다. `0.5`면 `200`과 `503 TEMPORARY_FAILURE`가 섞여 나온다.

### Non-goals

- 로그인, 회원, 권한
- 글 수정·삭제, 비밀번호 보호
- 댓글, 본문 검색, 정렬 변경, 조회수, 첨부 파일
- 카테고리 추가·수정 화면, 한 글에 여러 태그
- 테스트 러너 도입과 테스트 코드
- 배포 설정과 호스팅 DB 연결
- 다크 모드 토글, 디자인 시스템

### Open Questions

None

## 2. Analysis

- 프로젝트는 `create-next-app` 직후 상태다. `src/app`에 `layout.tsx`, `page.tsx`, `globals.css`만 있고 `node_modules`는 설치되지 않았다. git 저장소도 아직 없다.
- `package.json`의 스크립트는 `dev`·`build`·`start`·`lint` 네 개다. 테스트 스크립트가 없어 검증 수단은 `lint`와 `build`, 브라우저 수동 확인이다.
- `next.config.ts`는 `cacheComponents: true`와 `partialPrefetching: true`를 켜 두었다. 요청마다 달라지는 데이터를 읽는 서버 컴포넌트는 Suspense 경계가 필요할 것으로 예상하며, 정확한 규칙은 의존성 설치 뒤 `node_modules/next/dist/docs`에서 확인한다.
- `tsconfig.json`의 `paths`가 `@/*`를 `./src/*`로 잡아 두었다. 새 코드는 이 별칭으로 import한다.
- `pnpm-workspace.yaml`의 `ignoredBuiltDependencies`에는 `sharp`와 `unrs-resolver`만 있다. pnpm 10은 허용하지 않은 패키지의 빌드 스크립트를 실행하지 않으므로 네이티브 모듈을 쓰려면 이 파일에 허용 항목을 추가해야 한다.
- `src/app/layout.tsx`의 `RootLayout`은 `lang="en"`과 기본 메타데이터를 쓴다. Provider를 감싸는 자리는 이 `<body>` 안이다.

### 검토한 대안

- **폴더 구조**: Feature-Sliced Design은 레이어가 여섯 개라 기능이 하나뿐인 게시판에서는 빈 레이어가 생긴다. 종류별 평면 구조(`components`, `hooks`, `api`)는 기능이 늘면 한 기능의 파일이 여러 폴더로 흩어진다. feature 기반 구조를 골랐다.
- **DB**: JSON 파일은 의존성이 없지만 스키마와 마이그레이션 계층을 보여 주지 못한다. 호스팅 Postgres는 계정 연결과 환경 변수가 필요하다. SQLite 파일과 Drizzle을 골랐다.
- **SQLite 드라이버**: `better-sqlite3`는 Drizzle 문서의 기본 SQLite 드라이버이고 동기 API라 코드가 짧다. 네이티브 빌드가 필요한 점이 약점이다. 설치가 실패하면 `@libsql/client`의 `file:` URL로 바꾼다.
- **폼**: `react-hook-form`을 넣지 않는다. 필드가 세 개라 기본 `<form>`과 zod `safeParse`로 충분하다.
- **쿼리 키 관리**: 키 상수만 따로 두는 방식은 키와 `queryFn`이 떨어져 타입 추론이 끊긴다. `queryOptions` factory는 `useQuery`, `prefetchQuery`, `invalidateQueries`가 같은 객체를 공유한다.

## 3. Risks

- **엣지 케이스**: 범위를 넘는 `page`, 정수가 아닌 `id`, 공백만 있는 입력, 5000자 경계는 계약에 처리 방식을 적었다. 글 작성 직후 목록 캐시가 낡은 상태로 남는 경우는 `lists` 키 무효화로 막는다.
- **의존성·선행 조건**: `better-sqlite3`가 Node 24.20과 pnpm 10.33 환경에서 설치되는지 확인하지 않았다. Task 1에서 가장 먼저 확인하고, 실패하면 `@libsql/client`로 바꾼다.
- **공유 파일 충돌**: `package.json`은 Task 1과 Task 3이 고친다. `src/app/layout.tsx`는 Task 3만, `src/app/posts/page.tsx`는 Task 4만 고친다. 순차 실행이라 충돌은 없다.
- **외부 라이브러리 호환성**: 아래 세 가지는 문서로 확인하지 않은 가정이다. 각 task가 시작할 때 설치된 패키지의 문서로 확인한다.
  - `cacheComponents: true`에서 `searchParams`를 읽는 페이지와 Route Handler가 추가 설정 없이 동적으로 동작하는지
  - TanStack Query v5의 서버 prefetch와 `HydrationBoundary`가 React 19.3 스트리밍과 함께 동작하는지
  - Next.js가 `better-sqlite3`를 서버 번들에서 자동으로 제외하는지, `serverExternalPackages` 설정이 필요한지
- **개발 서버 재시작**: HMR이 DB 모듈을 다시 평가하면 연결이 여러 개 열린다. 개발 모드에서는 `globalThis`에 연결을 보관한다.

## 4. Implementation Roadmap

1. DB와 프로젝트 골격 — 의존성, SQLite 연결, 스키마, 마이그레이션, 시드, import 경계 lint
2. 게시글 API — zod 스키마, repository, service, Route Handler 세 개
3. 클라이언트 데이터 계층 — QueryClient provider, HTTP 클라이언트, `postQueries` factory, 작성 mutation
4. 목록·상세 화면 — 서버 prefetch, 페이지네이션, 상세, 로딩·오류·없음 상태
5. 작성 화면 — 폼, 검증, 제출 뒤 이동
6. README — 구조 설명과 실행 방법
7. 공통 오류 처리 — Route Handler 래퍼, QueryClient 전역 콜백, 토스트
8. 목록 필터 — `category` 컬럼, 필터 API, 필터 바, 필터를 유지하는 페이지 링크
9. 실패 주입 — `CHAOS_FAILURE_RATE`, 오류 화면의 쿼리 오류 초기화

## 5. Work Units

| # | Title | Status | Acceptance snapshot |
| --- | --- | --- | --- |
| 1 | DB와 프로젝트 골격 구성 | done | SC9(저장 유지의 기반), SC11 |
| 2 | 게시글 API 구현 | done | SC5, SC10 |
| 3 | React Query 데이터 계층 구성 | done | SC12 |
| 4 | 게시글 목록·상세 화면 구현 | done | SC1, SC2, SC3, SC7, SC8 |
| 5 | 게시글 작성 화면 구현 | done | SC4, SC6, SC9 |
| 6 | README에 구조 설명 작성 | done | SC13, SC14 |
| 7 | 공통 오류 처리 추가 | done | SC20, SC21, SC22 |
| 8 | 목록 필터(카테고리·제목 검색) 추가 | done | SC15, SC16, SC17, SC18, SC19 |
| 9 | 실패 주입과 오류 화면 재시도 보강 | done | SC23, SC24 |

### Task 1 — DB와 프로젝트 골격 구성 (done)

- 범위: SQLite 연결, `posts` 스키마와 초기 마이그레이션, 시드 스크립트, import 경계 lint.
- 수용 기준: `pnpm db:seed` 뒤 35행, 빈 `data/`에서 첫 연결 시 파일·테이블 자동 생성, SC11(경계 위반 시 lint 실패), `pnpm build` 통과.
- 구현: `src/shared/db/schema.ts`의 `posts`, `src/shared/db/connect.ts`의 `connect()`(WAL, `migrate()`), `src/shared/db/client.ts`의 `db`(`server-only`, 개발 모드 `globalThis` 보관), `drizzle/0000_even_the_spike.sql`, `scripts/seed.ts`(행이 있으면 건너뜀), `eslint.config.mjs`의 `no-restricted-imports` 두 블록(별칭·상대 경로 모두), `pnpm-workspace.yaml`의 `onlyBuiltDependencies`.
- 결정: 연결 로직을 `connect.ts`로 분리해 Next 밖의 시드 스크립트와 공유한다. `better-sqlite3@13.0.3`이 그대로 설치되어 `@libsql/client` 대체는 쓰지 않았다. `serverExternalPackages` 설정은 필요 없다(Next 기본 외부 패키지 목록에 포함).
- 참고: `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md` "Predictable values" — 동기 SQLite 쿼리는 프리렌더 중에 끝나므로 요청마다 읽으려면 `await connection()`이 먼저 와야 한다.
- 리스크: 설치·번들 제외 가정은 해소. import 시점 `migrate()`의 빌드 워커 경합 가능성은 Task 2로 이월.
- 이슈: 리뷰 WARNING 2건 중 시드 중복 삽입은 수정, 마이그레이션 경합은 이월. INFO였던 상대 경로 lint 우회도 수정.
- 검증: `lint` 통과, `build` 통과, `manual` 시드 35행·재실행 시 유지, `test` N/A — no test script.

### Task 2 — 게시글 API 구현 (done)

- 범위: zod 스키마, 타입, repository, service, 오류 응답 헬퍼, Route Handler 세 개.
- 수용 기준: SC10(세 엔드포인트의 상태 코드와 본문), SC5(빈 닉네임 → `익명`), 잘못된 id 404, `page=0` 400, 범위 초과 `page` 200·빈 목록, 최신순 정렬.
- 구현: `src/features/posts/schemas/post-schema.ts`(`createPostSchema`, `listPostsParamsSchema`, `postIdSchema`), `types.ts`, `server/post-repository.ts`의 `postRepository`, `server/post-service.ts`의 `listPosts`·`getPost`·`createPost`, `src/shared/api/api-error.ts`의 `errorResponse`, `src/app/api/posts/route.ts`, `src/app/api/posts/[id]/route.ts`.
- 결정: DB 연결을 `getDb()` 지연 연결로 바꿨다(빌드 워커들이 import 시점에 동시에 열어 `database is locked` 발생). 읽기 함수는 쿼리 전에 `await io()`를 호출해 프리렌더에서 빠진다. id는 10진 숫자 문자열만 받는다.
- 참고: Next 문서 `15-route-handlers.md` "With Cache Components", `04-functions/io.md`, `04-functions/connection.md`. zod v4 `z.flattenError`.
- 리스크: Route Handler 캐시 여부와 zod API 가정은 해소. Task 1에서 이월된 마이그레이션 경합도 해소.
- 이슈: `page`·`size`의 `z.coerce`가 `0x2` 같은 표기를 받는 점은 남겨 두었다.
- 검증: `lint` 통과, `build` 통과(빈 `data/` 포함), `manual` curl 13개 케이스, `test` N/A — no test script.

### Task 3 — React Query 데이터 계층 구성 (done)

- 범위: HTTP 클라이언트, QueryClient 생성기와 Provider, 브라우저용 fetch 함수, `postQueries` factory, 작성 mutation 훅.
- 수용 기준: SC12(쿼리 키 리터럴은 factory 파일에만), `lists()` 키로 목록 전체 무효화, `HttpError`가 `status`·`code`·`message`·`fieldErrors` 노출, devtools 표시.
- 구현: `src/shared/api/http-client.ts`의 `http`·`HttpError`, `src/shared/query/get-query-client.ts`의 `getQueryClient`(서버는 호출마다 새로, 브라우저는 싱글턴, `staleTime` 30초), `src/app/providers.tsx`, `src/app/layout.tsx`, `src/features/posts/api/post-api.ts`, `queries/post-queries.ts`의 `postQueries`, `queries/use-create-post.ts`의 `useCreatePost`(성공 시 `lists` 무효화).
- 결정: feature 사이 import 금지를 lint에 추가했다(`src/features/**`에서 `@/features/*` 금지, feature 내부는 상대 경로).
- 참고: `src/app/layout.tsx`의 `RootLayout`, Task 2의 `types.ts`와 `ApiErrorBody`.
- 리스크: `page` 타입은 `number`로 고정. 서버 prefetch의 실제 동작 확인은 Task 4로 넘김.
- 이슈: 리뷰 INFO 3건 반영(오류 본문 optional chaining, feature 간 lint, 효과 없는 `setQueryData` 제거).
- 검증: `lint` 통과, `build` 통과, `manual` devtools 버튼·콘솔 오류 없음, `test` N/A — no test script.

### Task 4 — 게시글 목록·상세 화면 구현 (done)

- 범위: `/posts` 목록과 페이지네이션, `/posts/{id}` 상세, 로딩·오류·없음 상태, `/` 리다이렉트.
- 수용 기준: SC1, SC2, SC3, SC7, SC8, 범위 초과 페이지 안내, 첫 HTML에 글 제목 포함.
- 구현: `src/app/posts/layout.tsx`, `page.tsx`(`PostListSection`이 `fetchQuery`로 채우고 `HydrationBoundary`로 전달), `error.tsx`(`retry`), `[id]/page.tsx`(`getPost` → `notFound()` 또는 `setQueryData` 후 hydrate), `[id]/not-found.tsx`, `src/features/posts/components/post-list.tsx`·`post-detail.tsx`·`post-skeletons.tsx`, `src/shared/ui/pagination.tsx`, `src/shared/lib/format-date.ts`, `post-schema.ts`의 `pageParamSchema`, `next.config.ts`의 `redirects()`.
- 결정: `/` 리다이렉트는 `next.config.ts`에 두고 `src/app/page.tsx`를 지웠다(페이지 안 `redirect()`가 개발 서버에 요청마다 오류를 남김). `prefetchQuery` 대신 `fetchQuery`를 써서 실패가 `error.tsx`로 간다. 숫자 쿼리 값은 9자리로 제한한다.
- 참고: Next 문서 `08-caching.md`(Suspense와 `searchParams`), `03-file-conventions/error.md`, `page.md`.
- 리스크: Suspense 경계, hydrate 뒤 재요청, 시간대 차이는 해소(빌드에서 두 페이지가 Partial Prerender, `Asia/Seoul` 고정).
- 이슈: Design Notes의 「페이지 전환은 `/api`를 거친다」는 실제와 다르다. 링크 이동도 서버 컴포넌트가 다시 렌더되고 `/api`는 재요청에만 쓰인다. `public/`의 스캐폴드 SVG 5개가 미사용으로 남았다. 상대 경로 교차 feature import는 lint가 못 잡는다.
- 검증: `lint` 통과, `build` 통과, `manual` 브라우저 800×600에서 SC1·SC2·SC3·SC8과 SC7 일부 확인. 빈 DB 화면과 「다시 시도」는 미확인. `test` N/A — no test script.

### Task 5 — 게시글 작성 화면 구현 (done)

- 범위: `/posts/new` 화면, 작성 폼, 공용 입력·버튼 컴포넌트.
- 수용 기준: SC4, SC5, SC6, SC9, 제출 중 버튼 비활성, 서버 오류 시 입력 유지.
- 구현: `src/app/posts/new/page.tsx`, `src/features/posts/components/post-form.tsx`의 `PostForm`(`FormData` → `createPostSchema.safeParse` → `useCreatePost().mutate` → `router.push`), `src/shared/ui/text-field.tsx`, `src/shared/ui/button.tsx`, `src/shared/api/http-client.ts`(응답 없는 실패 → `HttpError(0, "NETWORK_ERROR")`).
- 결정: 입력은 비제어로 둔다. 버튼은 `isPending || isSuccess` 동안 비활성이다. 검증 실패 시 `reset()`으로 이전 서버 오류를 지운다.
- 참고: Task 2의 `createPostSchema`, Task 3의 `useCreatePost`와 `HttpError`.
- 리스크: 낡은 목록 캐시는 `lists` 무효화로 해소(SC4 확인). `setQueryData` 선주입 계획은 쓰지 않았다.
- 이슈: 서버가 꺼졌을 때 오류 문구가 `Failed to fetch`로 나와 한글 문구로 바꿨다.
- 검증: `lint` 통과, `build` 통과, `manual` 브라우저 800×600에서 SC4·SC5·SC6·SC7·SC9와 서버 꺼짐 시 입력 유지 확인. 서버 `400` 경로와 제출 중 비활성 표시는 미확인. `test` N/A — no test script.

### Task 6 — README에 구조 설명 작성 (done)

- 범위: `README.md` 전체 교체.
- 수용 기준: SC13(폴더 트리, 폴더별 역할, import 규칙, 요청 흐름, 실행 방법), 적힌 경로가 모두 존재, 새 feature 추가 절차, SC14.
- 구현: `README.md` — 실행, 폴더 구조, import 규칙, 읽기·쓰기 요청 흐름, 계층별 책임, factory, Cache Components 주의점, 새 feature 추가 절차, API 표.
- 결정: 트리와 요청 흐름을 구현 결과 기준으로 썼다.
- 참고: spec §1 Target Location과 Design Notes.
- 리스크: Task 1~5의 변경(지연 연결, `io()`, `next.config.ts` 리다이렉트)을 반영했다.
- 이슈: 없음.
- 검증: `manual` 경로 존재 확인, `lint` 통과, `build` 통과, `test` N/A — no test script.

### Task 7 — 공통 오류 처리 추가 (done)

- 범위: 서버 Route Handler 오류 래퍼, 브라우저 전역 오류 콜백과 재시도 정책, 토스트.
- 수용 기준: SC20, SC21, SC22, 기존 API 계약 유지.
- 구현: `src/shared/api/api-error.ts`의 `AppError`, `src/shared/api/with-error-handling.ts`의 `withErrorHandling()`(`AppError`·`ZodError`·그 밖의 예외 → 응답, `unstable_rethrow`), 두 Route Handler를 래퍼로 전환, `src/shared/query/get-query-client.ts`의 `QueryCache`·`MutationCache` `onError`와 `retry`와 `Register.defaultError`, `src/app/providers.tsx`의 `Toaster`, `post-form.tsx`에서 인라인 오류 문구 제거, `src/app/posts/page.tsx`의 `fetchQuery` → `queryClient.query()`.
- 결정: 토스트는 `sonner@2.0.8`. mutation별 전역 처리 끄기 옵션은 넣지 않았다. 필드 오류는 키가 하나 이상 있을 때만 폼 몫으로 본다.
- 참고: Next 문서 `04-functions/unstable_rethrow.md`, Task 2의 `errorResponse`, Task 3의 `HttpError`.
- 리스크: `defaultError: HttpError`는 타입 선언일 뿐이라 콜백은 `instanceof`로 확인한다. `page`·`size` 검증 실패 문구가 공통 문구로 바뀌었다.
- 이슈: 리뷰 INFO 1건 반영(빈 `fieldErrors`).
- 검증: `lint` 통과, `build` 통과, `manual` 래퍼 세 분기 직접 호출·curl 계약 확인·서버 꺼짐 토스트. 백그라운드 재요청 실패 토스트와 5xx 자동 재시도 횟수는 미확인. `test` N/A — no test script.

### Task 8 — 목록 필터(카테고리·제목 검색) 추가 (done)

- 범위: `category` 컬럼과 마이그레이션, 필터 API, 필터 바, 필터를 유지하는 페이지 링크, 작성 폼의 카테고리.
- 수용 기준: SC15, SC16, SC17, SC18, SC19.
- 구현: `src/shared/db/schema.ts`의 `posts.category`, `drizzle/0001_lame_lila_cheney.sql`, `post-schema.ts`(`POST_CATEGORIES`, `postCategorySchema`, `postListSearchSchema`, `pageParamSchema`의 최대 페이지 처리), `post-repository.ts`의 `matches()`(카테고리 일치, 제목 `instr`), `post-api.ts`, `src/features/posts/lib/post-list-href.ts`, `components/post-filter-bar.tsx`(칩, 검색창 debounce 300ms, `startTransition`, `useOptimistic` 카테고리, URL과 검색창 동기화), `post-category-badge.tsx`, `post-list.tsx`·`post-detail.tsx`·`post-form.tsx`, `src/app/posts/page.tsx`(필터 바를 별도 Suspense에 배치), `scripts/seed.ts`.
- 결정: 필터 상태는 URL에만 둔다. 검색은 `LIKE` 대신 `instr`을 써서 `%`·`_`가 문자 그대로다. 진행 표시는 칩 옆 「불러오는 중…」이다. 9자리를 넘는 `page`는 최대 페이지로 낮춰 범위 초과 안내가 나오게 했다(이전 명세 대조 FAIL 해소).
- 참고: Task 3의 `postQueries.list(params)` — `params`를 통째로 키에 넣어 factory 수정이 없었다.
- 리스크: 스키마 변경 뒤에는 개발 서버를 다시 띄워야 마이그레이션이 적용된다. SQLite `lower()`는 ASCII만 바꾼다.
- 이슈: 리뷰 WARNING 2건 반영(지운 검색어가 칩 클릭으로 되살아남, 칩 이동 중 입력 경합), INFO 1건 반영(시드의 카테고리 목록 중복).
- 검증: `lint` 통과, `build` 통과, `manual` curl 필터 조합·브라우저에서 전환 중 스켈레톤 0회와 포커스 유지·SC16·검색창 동기화. 칩 이동 중 입력 경합은 재현하지 못함. `test` N/A — no test script.

### Task 9 — 실패 주입과 오류 화면 재시도 보강 (done)

- 범위: 확률적 실패 주입, 오류 화면의 쿼리 오류 초기화, README 세 절.
- 수용 기준: SC23, SC24.
- 구현: `src/shared/lib/chaos.ts`의 `maybeFail()`(`CHAOS_FAILURE_RATE` 확률로 `AppError(503, "TEMPORARY_FAILURE")`), `post-service.ts` 세 함수에서 호출, `src/app/posts/error.tsx`가 `retry()` 전에 `useQueryErrorResetBoundary().reset()` 호출, `README.md`의 「목록 필터」「오류 처리」「일부러 실패시켜 보기」.
- 결정: 사용자 선택으로 실패 주입을 삭제하지 않고 유지한다. 값이 없으면 꺼져 있다.
- 참고: Task 7의 `AppError`와 재시도 정책, Task 2의 `await io()`.
- 리스크: `.env.local`에 값이 남아 있으면 앱과 수동 검증이 확률적으로 실패한다. 값이 없어도 service에 호출 세 줄이 남는다.
- 이슈: 리뷰 지적 없음.
- 검증: `lint` 통과, `build` 통과, `manual` 비율 0.5에서 30회 중 503 16회·「다시 시도」 13회 중 9회 복구, 0.1에서 100회 중 503 8회, 0에서 30회 모두 200. 자동 재시도 2회와 작성 503 토스트는 미확인. `test` N/A — no test script.

## 6. Execution Strategy

여섯 task를 번호 순서대로 하나씩 진행한다. 1 → 2 → 3은 계층이 아래에서 위로 쌓이는 순서라 바꿀 수 없다. 5는 SC4를 목록 화면에서 확인하므로 4 뒤에 온다. 6은 구현이 끝난 실제 파일을 기준으로 쓴다. 7~9는 1~6 완료 뒤 사용자 요청으로 추가됐고 코드는 이미 작성됐다. 남은 일은 리뷰, pre-PR, Done Sync이며 7 → 8 → 9 순서로 진행한다. 각 task가 끝날 때 `pnpm lint`와 `pnpm build`를 돌린다.

## 7. Progress

- Status: done
- Completed: Task 1 (DB와 프로젝트 골격 구성), Task 2 (게시글 API 구현), Task 3 (React Query 데이터 계층 구성), Task 4 (게시글 목록·상세 화면 구현), Task 5 (게시글 작성 화면 구현), Task 6 (README에 구조 설명 작성), Task 7 (공통 오류 처리 추가), Task 8 (목록 필터 추가), Task 9 (실패 주입과 오류 화면 재시도 보강)
- Verification: Task 1 — lint, build, manual(시드 35행). Task 2 — lint, build, manual(curl). Task 3 — lint, build, manual(devtools). Task 4 — lint, build, manual(브라우저). Task 5 — lint, build, manual(브라우저). Task 6 — lint, build, manual(경로 확인). Task 7~9 — lint, build, manual(curl·브라우저)
- 중단(2026-10-13): 전체 명세 대조(Aggregate Drift Gate)가 FAIL 1건으로 멈췄다. `?page=`에 10자리 이상 숫자가 오면 spec은 빈 목록 안내를 요구하는데 구현은 1페이지를 보여 준다(`src/features/posts/schemas/post-schema.ts`의 `pageParamSchema`, Task 4 리뷰 수정에서 생김). 자동 수정하지 않았고 `drift_check`도 기록하지 않았다. WARN 8건은 실행 요약에 보고했다.
- 수정(2026-10-13): 위 FAIL 항목을 고쳤다. `pageParamSchema`가 9자리를 넘는 숫자를 최대 페이지(999,999,999)로 낮춰 빈 페이지 안내가 나온다. 명세 대조는 다시 돌리지 않았다 — 이후 사용자 요청으로 spec 범위 밖 기능(공통 오류 처리, 카테고리·제목 검색 필터, 실패 주입)이 추가됐고, 제목 검색은 Non-goals의 「검색」과 겹친다. spec 갱신이 먼저다.
- 범위 확장(2026-10-13): task 7~9 추가. 코드는 작성됐고 리뷰·pre-PR·Done Sync가 남았다. 다음 `/feature anonymous-board`가 7 → 8 → 9를 이어서 처리하고 전체 명세 대조를 다시 돌린다.
- 완료(2026-10-14): task 7~9 리뷰·pre-PR·Done Sync 완료. 전체 명세 대조 WARN(FAIL 0, WARN 2)을 `drift_check`에 기록했다. 게시 대기.

## 8. Changelog

- 2026-10-13: 사용자 요청으로 범위를 넓혔다. Goals 9~14와 SC15~SC24 추가(카테고리·제목 검색 필터, 공통 오류 처리, 「다시 시도」, 실패 주입). Non-goals의 「검색」을 「본문 검색」으로 좁혔다. API 계약에 `q`·`category`·`INTERNAL_ERROR`·`TEMPORARY_FAILURE`, 데이터에 `category` 컬럼 추가. Design Notes의 「페이지 전환은 `/api`를 거친다」를 실제 동작(서버가 다시 렌더)에 맞게 고쳤다. Target Location에 `shared/lib`, `features/posts/lib`, 페이지네이션 위치를 반영했다. task 7~9 추가(코드는 작성됨, 리뷰 전).

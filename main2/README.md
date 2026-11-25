# Oreum (오름) — 프론트엔드 (main2)

역할(디자인 · 프론트 · 백)끼리 일을 주고받는 흐름을 산길(루트)로 보여 주는 협업 웹의 프로토타입입니다.
Vite + React 19 + TypeScript(strict) + Tailwind v4 + react-router v7 + Radix(dialog · dropdown · popover).

**지금은 서버 없이 전부 동작합니다(목업 모드).** 서버가 생기면 `.env` 한 줄만 바꾸면 됩니다 → [백엔드 연결](#백엔드-연결)

## 실행

```bash
npm install
npm run dev        # http://localhost:5183
npm run build      # 타입 검사(tsc -b) + 빌드
```

- 처음 들어가면 로그인 화면입니다. 목업 모드에서는 **아무 이메일 · 비밀번호**나 넣거나 "구글로 로그인하기"를 누르면 들어갑니다.
- 데이터는 브라우저 `localStorage`(`oreum:*`)에 저장됩니다. 처음 상태로 되돌리려면 개발자 도구에서 `oreum:` 으로 시작하는 값을 지우세요. (요청 카드만은 요청 상세의 "예시 데이터로 되돌리기")
- 환경 변수: `.env.example` 을 `.env.local` 로 복사해서 씁니다.

| 변수 | 뜻 | 비워 두면 |
| --- | --- | --- |
| `VITE_API_URL` | 백엔드 주소 (예: `http://localhost:8080/api`) | 목업 모드 |
| `VITE_A11Y_URL` | 접근성 검사 앱(main1) 주소 | `http://localhost:5173` |

## 폴더 구조

```
src/
  api/            서버와 주고받는 모든 것 (백엔드가 볼 곳)
    index.ts        api 객체 하나 — mock / http 두 구현, 주소 목록
    types.ts        주고받는 값의 모양(DTO)
    http.ts         fetch 도우미 (주소 · JSON · 토큰 · 시간 제한 · 오류)
    sync.ts         저장소 ↔ api 공통 방식 (push = 낙관적 저장 · pull = 불러오기)
    config.ts       VITE_API_URL → mock / http 결정
    storage.ts      localStorage 읽기 · 쓰기 (목업의 "서버")
  data/           화면이 함께 쓰는 저장소 (useSyncExternalStore)
    sessionStore.ts        로그인 · 팀 스페이스
    planStore.ts           마감일 · 역할 · 체크포인트 · 추천 루트
    requestStore.ts        넘겨주기 카드(요청) + 주고받은 기록
    roomStore.ts           방 대화에 보낸 메시지
    notificationStore.ts   알림(카드 기록에서 계산) · 읽음 표시
    hydrate.ts             http 모드에서 서버 값 불러오기
    mock.ts                예시 데이터 (역할 · 방 · 사용자 · 팀 스페이스)
  layout/         사이드바 · 공통 틀
  pages/          화면 (start · board · rooms · request · compare · notifications · a11y · misc)
  ui/             공용 부품 (유리 패널 · 버튼 · 칩 · 알림 토스트)
  styles/index.css  디자인 토큰 (색 · 여백)
  router.tsx      주소 ↔ 화면, 로그인 확인
```

## 화면 ↔ 주소

| 주소 | 화면 | 파일 |
| --- | --- | --- |
| `/login` | 로그인 | `pages/start/LoginPage.tsx` |
| `/start` | 시작하기 (마감일 · 역할 · 기획안) | `pages/start/StartPage.tsx` |
| `/start/route` | 추천 루트 (3D 산) | `pages/start/RouteMapPage.tsx` |
| `/board` | 메인보드 | `pages/board/MainBoardPage.tsx` |
| `/route` | 원정대 흐름 (루트 상세) | `pages/board/RouteDetailPage.tsx` |
| `/notifications` | 알림 | `pages/notifications/NotificationsPage.tsx` |
| `/rooms/all` · `/design` · `/front` · `/back` | 방(원정대) | `pages/rooms/*RoomPage.tsx` |
| `/rooms/front/compare` · `/compare-simple` | 버전 비교 | `pages/compare/*` |
| `/requests/new?room=front\|design` | 요청 보내기 | `pages/request/RequestSendPage.tsx` |
| `/requests/:id` | 요청 상세 | `pages/request/RequestDetailPage.tsx` |
| `/requests/:id/progress` | 완료 알리기(전달) | `pages/request/RequestProgressPage.tsx` |
| `/requests/:id/review` | 확인 · 수정 요청 | `pages/request/RequestReviewPage.tsx` |
| `/a11y` | 웹 접근성 검사 (main1 끼워 넣기) | `pages/a11y/A11yPage.tsx` |

로그인하지 않으면 모든 화면이 `/login` 으로 갑니다. 로그인한 채 `/login` 에 가면 `/board`, `/` 는 상태에 맞는 쪽으로 갑니다.

## 프론트만으로 동작하는 것

- **요청 흐름**: 요청 보내기 → 수락 / 다른 날짜 제안 → 전달 → 확인 / 수정 요청 → 완료, 막힘 표시 · 해제, 대화의 링크에서 바로 넘겨주기
- **요청 상세의 코멘트 · 질문**: "주고받은 기록" 아래 입력칸 (Enter 로 보내기)
- **알림**: 모든 카드의 기록에서 자동으로 만들어짐. 오늘 / 이전 묶음, 전체 · 안 읽음 · 막힘 걸러 보기, 모두 읽음, 읽음 표시 저장. 사이드바의 빨간 숫자 = 안 읽은 수
- **방 대화**: 보낸 메시지가 방별로 저장됨(전체 방에 쓰면 세 방 모두에 보임). 카드가 생기거나 전달 · 수정 요청 · 확인 · 막힘 처리되면 관련된 방과 전체 방의 대화에 한 줄씩 보임
- **사이드바**: 방 숫자 = 아직 안 끝난 카드 수, 팀 스페이스 고르기(이름만 바뀜), 내 이름 → 로그아웃, 접기 · 폭 조절 · 모바일 서랍
- **시작하기 · 추천 루트**: 마감일 · 역할 · 체크포인트 고치기(최대 8개) → **메인보드의 마감 칩 · 작은 지도, 루트 상세**에 그대로 반영
  - 루트 상세의 산길 지도는 체크포인트 4개에 맞춰 그려져 있어, 4개가 아니면 목록 보기로 보여 줍니다. 메인보드의 작은 지도는 개수에 맞춰 같은 길 위에 고르게 놓습니다.
- **로그인**: 이메일 형식 · 빈 비밀번호 확인(오류 문구), 로그인 상태 저장, 로그인 확인(주소 보호)
- 버전 비교의 코멘트, 구간 할 일 고르기 등 그 밖의 화면 안 동작

## 백엔드 연결

화면은 저장소(`src/data/*Store.ts`)만 보고, 저장소는 `api`(`src/api/index.ts`)만 부릅니다. **화면 코드는 고칠 필요가 없습니다.**

```
화면 ──읽기(동기)──▶ 저장소 ──api.*──▶  mock : localStorage + 예시 데이터   (VITE_API_URL 없음)
                                        http : fetch → 서버                  (VITE_API_URL 있음)
```

- 화면은 먼저 바뀌고(낙관적), 서버 요청이 실패하면 값을 되돌리고 화면 아래에 오류 알림이 뜹니다. (`api/sync.ts`)
- http 모드에서는 앱이 시작할 때와 로그인 직후에 서버 값을 불러옵니다. (`data/hydrate.ts`)

### 연결 순서

1. `.env.local` 에 `VITE_API_URL=http://localhost:8080/api` 를 적고 `npm run dev` 를 다시 켭니다.
2. 아래 표의 주소를 서버에 만듭니다. 요청 · 응답 모양은 `src/api/types.ts` 의 타입 그대로(JSON)입니다.
3. 로그인부터 붙입니다 — `POST /auth/login` 이 `{ token, user }` 를 주면 그 뒤 모든 요청에 `Authorization: Bearer <token>` 이 붙습니다.
4. `GET /plan` · `GET /requests` 처럼 불러오기부터 만들면 화면이 서버 값으로 채워집니다. 그다음 저장(PUT · POST · PATCH).
5. 주소나 모양이 다르면 **`src/api/index.ts` 의 `httpApi` 한 곳**만 고치면 됩니다.

### 서버가 지킬 약속

- 오류는 4xx/5xx + `{ "message": "보여 줄 문구" }`. 문구가 그대로 화면 알림에 나옵니다.
- `401` 이 오면 프론트가 로그아웃하고 로그인 화면으로 보냅니다.
- 요청에 `credentials: 'include'` 를 씁니다 → CORS 에서 프론트 주소(`http://localhost:5183`)와 credentials 를 허용해 주세요. (쿠키 세션이면 `token` 은 빈 글자여도 됩니다)
- **id 는 프론트가 만들어 보냅니다**(카드 · 기록 · 메시지). 보낸 직후 그 주소로 이동하기 때문이니 그대로 저장해 주세요.
- 날짜 글자(`due: '11/21 (금) 18:00'`, 기록의 `at: '11/18 11:00'`)는 화면에 보이는 글자 그대로 주고받습니다. 기록의 `ts` 는 밀리초 시각입니다.
- 목업에서는 예시 화면에 맞춰 "오늘"이 2026/11/18 로 고정돼 있고, http 모드에서는 진짜 오늘을 씁니다. (`requestStore.ts` 의 `demoNow`)

### 필요한 API

| 기능 | 지금 동작 (목업) | API (`VITE_API_URL` 뒤에 붙음) | 요청 → 응답 | 프론트 연결 (`api.*` ← 부르는 곳) |
| --- | --- | --- | --- | --- |
| 이메일 로그인 | 아무 값이나 통과, 예시 사용자(김혜승 · 디자인) | `POST /auth/login` | `LoginInput { email, password }` → `Session { token, user: User }` | `api.auth.login` ← `sessionStore.signIn` |
| 구글 로그인 | 예시 사용자로 바로 로그인 | `POST /auth/google` | `GoogleLoginInput { credential? }` → `Session` | `api.auth.loginWithGoogle` ← `sessionStore.signInWithGoogle` |
| 로그아웃 | 세션 지움 | `POST /auth/logout` | – → 204 | `api.auth.logout` ← `sessionStore.signOut` |
| 내 정보 | 저장된 세션 | `GET /auth/me` | – → `User { id, name, email, role }` | `api.auth.me` ← `sessionStore.hydrateSession` |
| 팀 스페이스 목록 | 예시 3개 (`data/mock.ts`) | `GET /workspaces` | – → `Workspace[] { id, name }` | `api.workspaces.list` ← `sessionStore.hydrateSession` |
| 일정 불러오기 | localStorage | `GET /plan` | – → `Plan { unit, date, time, roles, checkpoints, generatedFrom? }` | `api.plan.get` ← `planStore.hydratePlan` |
| 일정 저장 | localStorage | `PUT /plan` | `Plan` → `Plan` | `api.plan.save` ← `planStore.updatePlan` (0.5초 모아서 보냄) |
| 기획안 파일 올리기 | 올리지 않고 이름 · 크기만 | `POST /files/plan` (multipart, 칸 이름 `file`) | 파일 → `PlanFile { id, name, size, type, pages, url? }` | `api.files.uploadPlan` ← `StartPage` "루트 생성하기" |
| **AI 추천 루트** | 기본 체크포인트 4개를 바로 돌려줌 | `POST /route/recommend` (60초까지 기다림) | `RouteRecommendInput { deadline, roles, source }` → `RouteRecommendation { checkpoints }` | `api.route.recommend` ← `planStore.recommendRoute` ← `StartPage` "루트 생성하기" · `RouteMapPage` "추천으로 되돌리기" |
| 카드 목록 | localStorage + 예시 9장 | `GET /requests` | – → `HandoffCard[]` | `api.requests.list` ← `requestStore.hydrateRequests` |
| 카드 만들기 (요청 · 넘겨주기) | localStorage | `POST /requests` | `HandoffCard` → `HandoffCard` | `api.requests.create` ← `createRequest` · `handOff` |
| 카드에 한 일 (수락 · 날짜 제안 · 전달 · 확인 · 수정 요청 · 막힘 · 코멘트) | localStorage | `PATCH /requests/:id` | `RequestUpdate { action: RequestAction, card: HandoffCard }` → `HandoffCard` | `api.requests.update` ← `acceptRequest` · `proposeDate` · `deliverRequest` · `confirmRequest` · `requestFix` · `setBlocked` · `addComment` … |
| (데모) 예시 데이터로 되돌리기 | 예시 9장으로 | `POST /requests/reset` *(없어도 됨)* | – → `HandoffCard[]` | `api.requests.reset` ← `resetRequests` |
| 방 대화 불러오기 | localStorage (피그마 예시 대화는 화면에 고정) | `GET /rooms/:room/messages` (`room` = `all` · `design` · `front` · `back`) | – → `RoomMessage[]` | `api.rooms.list` ← `roomStore.hydrateRooms` |
| 방 대화 보내기 | localStorage | `POST /rooms/:room/messages` | `RoomMessage { id, room, author, role, text, time, ts, attachments? }` → `RoomMessage` | `api.rooms.send` ← `roomStore.sendRoomMessage` |
| 알림 (읽음 여부) | 카드 기록에서 계산 + localStorage | `GET /notifications` | – → `Notification[]` (`id` = `"{카드 id}:{기록 id}"`, `read`) | `api.notifications.list` ← `notificationStore.hydrateNotifications` |
| 알림 읽음 표시 | localStorage | `POST /notifications/read` | `MarkReadInput { ids }` → 204 | `api.notifications.markRead` ← `notificationStore.markRead` |

참고

- `PATCH /requests/:id` 는 `action`(무슨 일을 했는지)과 `card`(그 결과로 프론트가 계산한 카드)를 함께 보냅니다. 처음에는 `card` 를 그대로 저장하면 되고, 나중에 서버가 `action` 을 직접 검증 · 적용해 돌려줘도 됩니다(돌려준 카드로 화면을 맞춥니다).
- 알림 목록 자체는 프론트가 카드의 `history` 에서 만들어 보여 줍니다. 서버의 `GET /notifications` 에서는 지금 `read` 만 가져다 씁니다(푸시 알림 등으로 넓힐 자리).
- http 모드에서는 피그마 예시 대화(`pages/rooms/roomData.ts`)가 숨고 서버 메시지만 보입니다. 메시지에 `attachments`(Figma 미리보기 · PR 카드)를 넣어 주면 그대로 그려집니다.
- 전체 방(`all`)에 쓴 메시지는 세 방 모두에 보입니다(프론트가 합쳐서 보여 줌).
- 구글 로그인은 지금 버튼 → `POST /auth/google` 만 연결돼 있습니다. 실제로는 구글 로그인 창을 띄워 받은 ID 토큰을 `credential` 로 넣어야 합니다.

## 아직 서버 · 주소가 없어 "준비 중" 알림만 뜨는 것

| 버튼 | 위치 | 필요한 것 |
| --- | --- | --- |
| 팀 스페이스 추가하기 | 사이드바 팀 스페이스 메뉴 | `POST /workspaces` + 만드는 화면 디자인 |
| 회사 / 학교 계정으로 로그인 · 비밀번호 재설정 · 회원 가입 | 로그인 | 서버(SSO · 메일) + 화면 디자인 |
| 최근 링크 열기 | 메인보드 방 카드 | 방별 최근 링크 데이터(진짜 주소) |
| Figma에서 열기 · GitHub에서 PR 열기 · 링크 칩 열기 | 방 대화 첨부, 디자인 방 "링크/파일 보기" | Figma · GitHub 연동(진짜 주소) |
| 기획 문서 · 다른 화면 비교 · 새 창으로 열기 | 버전 비교 | 배포 주소 · 화면 목록 데이터 |

그 밖에 아직 예시 값인 곳: 메인보드 방 카드의 AI 요약 · 마지막 메시지(`pages/board/boardData.ts`), 구간별 추천 할 일(`boardData.ts`), 버전 비교(`pages/compare/compareData.ts`), 방 인원 수 · GitHub 연결 칩(`pages/rooms/roomData.ts`). 팀 스페이스를 바꿔도 지금은 이름만 바뀌고 데이터는 같습니다.

## 아직 디자인이 없는 화면

피그마에 그림이 없어 기존 부품(유리 패널 · 칩 · 버튼)으로 맞춰 둔 것들입니다. 디자인이 나오면 해당 파일만 바꾸면 됩니다.

- 알림 (`/notifications`)
- 백 방 (`/rooms/back`) — 방 틀에 "비어 있음 / 불러오는 중 / 실패" 상태 카드
- 웹 접근성 검사 (`/a11y`)
- 사이드바의 팀 스페이스 메뉴 · 내 계정 메뉴, 접힌 사이드바, 모바일 서랍
- 요청 상세의 코멘트 · 질문 입력칸, "지금 할 수 있는 일" 버튼 묶음
- 로그인 오류 문구, 체크포인트가 4개가 아닐 때의 루트 상세, 없는 주소(404)

## 접근성 검사 연결 (main1)

`/a11y` 화면은 전에 만든 A11y Translator 웹(main1)을 iframe 으로 끼워 넣습니다.

1. main1 을 켭니다 (기본 `http://localhost:5173`).
2. 주소가 다르면 `.env.local` 에 `VITE_A11Y_URL=…` 을 적고 개발 서버를 다시 켭니다.
3. main1 이 꺼져 있으면 빈 화면 대신 안내가 보입니다. 화면 디자인이 정해지면 `pages/a11y/A11yPage.tsx` 만 바꾸면 됩니다.

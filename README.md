# A11y Translator · Frontend

웹 접근성 검사 서비스의 프론트엔드 **프로토타입**입니다.
**① 크롬 확장(작업하는 곳)** 과 **② 협업 웹사이트(기록·분배·리포트)** 화면을 한 프로젝트에서 만듭니다.

- 디자인: Figma `회의` 파일 › Page 4 (구현 · Workflow · 할 일 탭 · sidebar/checklist)
- 스택: React 19 · TypeScript · Vite · Tailwind CSS v4 · React Router 7 · Radix UI
- 데이터: **전부 임시 데이터**(`src/shared/mocks`). 화면에 나오는 이슈·숫자·팀원은 예시 사이트를 검사했다고 가정한 값이에요.
- 서버 연결 없음. 웹 ↔ 확장 데모 흐름은 브라우저 `localStorage` 로만 공유합니다.

## 실행

```bash
npm install
npm run dev      # http://localhost:5173/demo  ← 전체 화면 목록
npm run lint     # 접근성 규칙(eslint-plugin-jsx-a11y) 포함
npm run build
```

데모를 처음 상태로 돌리려면 `/demo` 의 **데모 데이터 초기화** 버튼을 누르세요.

## 지금까지 한 작업

### 구현한 화면
| 구분 | Figma | 주소 | 파일 |
|---|---|---|---|
| 웹 | A11Y_LOG_001 (로그인) | `/login` | `web/pages/auth/LoginPage.tsx` |
| 웹 | project /home (W1) · 팀 스페이스 전환 | `/` | `web/pages/home/ProjectHomePage.tsx` |
| 웹 | project/none (첫 검사) | `/projects/new` | `web/pages/home/ProjectEmptyPage.tsx` |
| 웹 | project/inspection · 접근성 검사 | `/projects/:id/inspection` | `web/pages/inspection/InspectionResultPage.tsx` |
| 웹 | project/issue-detail (05 · 코멘트) | `/issues/:id` | `web/pages/issue/IssueDetailPage.tsx` |
| 웹 | 할 일 · 내 할 일 / 우리 팀 / 미배정 (06) / 넘기기 | `/todo/mine` `/todo/team` `/todo/unassigned` | `web/pages/todo/*` |
| 웹 | report (08 · 버전 관리) | `/report` | `web/pages/report/VersionReportPage.tsx` |
| 웹 | member · 팀원 | `/members` | `web/pages/members/TeamMembersPage.tsx` |
| 웹 | setting | `/settings` | `web/pages/settings/SettingsPage.tsx` |
| 확장 | 01 로그인 · 검사 시작 | `/extension` | `extension/screens/LoginScreen.tsx` |
| 확장 | 02 검사 결과 · 오버레이 | ″ | `extension/screens/ScanResultScreen.tsx` |
| 확장 | 03 이슈 상세 · 미리 고쳐보기 | ″ | `extension/screens/IssueFixPreviewScreen.tsx` |
| 확장 | 04 결과 저장 · 웹으로 전송 | ″ | `extension/screens/SaveAndSendScreen.tsx` |
| 확장 | 07 재검사 · 자동 해결 | ″ | `extension/screens/RecheckAutoResolveScreen.tsx` |
| 확장 | sidebar/checklist v1 · v2 (**공통 부분만 확정, 버전별 배치는 임시**) | `/extension?checklist=v1` | `extension/screens/checklist/*` |
| 확장 | project/overlayed (가짜 사이트 + 오버레이 + 패널) | `/extension` | `extension/demo/ExtensionDemoPage.tsx` |

### Workflow 연결 (검사 → 고쳐보기 → 전달 → 분배 → 재검사)
1. **01→02** 확장에서 검사 → 이슈 카드에 마우스를 올리면 사이트 요소가 강조됨
2. **03** 추천 색을 고르면 데모 사이트의 버튼 색이 즉시 바뀜 → 수정안 저장
3. **04** "웹으로 전송" → 웹 `/todo/unassigned` 에 올라감
4. **06** 웹에서 팀 단위로 분배 (AI 추천대로 모두 분배 가능)
5. **07** 데모 브라우저 ↻ → 수정안을 저장한 이슈는 자동 해결 → 웹 할 일·리포트·팀원 숫자도 함께 바뀜

### 디자인이 없어 "준비 중" 안내만 있는 기능
회원가입 · 비밀번호 재설정 · 회사/학교 계정 로그인 · 할 일 직접 추가 · 팀원 초대 · 프로필 관리

## 폴더 구조

```
src/
├─ app/                        라우터(router.tsx), 화면 목록(DemoIndex.tsx · /demo)
├─ shared/                     웹·확장 공통 (둘 다 가져다 씀)
│  ├─ api/types.ts             데이터 형태 (이슈·팀원·버전…) — 백엔드와 맞출 기준
│  ├─ mocks/index.ts           [임시] 팀원·프로젝트·이슈·코멘트
│  ├─ mocks/scan.ts            [임시] 검사 요약 숫자, 캡처 위 오버레이 좌표
│  ├─ store.ts                 화면 상태 + 동작(저장·분배·재검사…) — 웹↔확장 공유
│  ├─ selectors.ts             공통 계산 (심각도 정렬, 팀원 담당 수…)
│  ├─ ui/SeverityChip.tsx      심각도 칩 (ext/Severity) — 웹·확장 공통
│  ├─ assets/                  심각도 아이콘
│  └─ styles/index.css         디자인 토큰 (Figma 색·글꼴)
├─ web/                        ② 협업 웹사이트
│  ├─ layout/                  WebLayout · Navbar(팀 전환) · Header — 모든 페이지 공통 틀
│  ├─ common/                  웹 여러 페이지 공통
│  │   StatusTag(완료됨/진행중/중요/보통) · SiteCapture(검사 시점 캡처)
│  │   OpenInChromeLink · issueHelpers(통계·필터 계산) · useAnnouncer(화면낭독기 알림)
│  ├─ assets/
│  └─ pages/                   페이지 + 그 페이지에서만 쓰는 부품
│     ├─ auth/                 LoginPage
│     ├─ home/                 ProjectHomePage · ProjectEmptyPage · FolderCard · TodoSummaryCard · UrlInspectForm
│     ├─ inspection/           InspectionResultPage · InspectionPreview(문제 위치 미리보기)
│     ├─ issue/                IssueDetailPage · CommentThread · IssueSidePanel · CopyButton
│     ├─ todo/                 TodoPage(탭 틀) · MyTodoTab · TeamTodoTab · UnassignedTodoTab · TodoHandoffModal
│     │                        TodoBits(작은 UI) · todoUtils(계산)
│     ├─ report/               VersionReportPage · VersionRow · VersionIssues
│     ├─ members/              TeamMembersPage · MemberCard · MemberDetail · membersUtils
│     └─ settings/             SettingsPage · SettingControls(스위치·선택)
└─ extension/                  ① 크롬 확장 (나중에 이 폴더 + shared/ 만 옮기면 진짜 확장이 됨)
   ├─ PanelApp.tsx             패널 안 화면 전환 (주소창이 없으므로 상태로 이동)
   ├─ panelNav.ts              화면 이동·재검사·포커스 이동 도우미
   ├─ scanStats.ts             검사 결과 숫자 계산 (02·04·07 공통)
   ├─ buildFix.ts              고른 색 → 개발자 코드 / 디자이너 설명
   ├─ ui/                      ext/ 컴포넌트: Panel Header · Severity · Button · Issue Card
   │                           ContrastOptionGroup(추천 색 선택) · CodeCopy
   ├─ screens/                 01~07 화면 (+ result/ · fix/ 하위 부품)
   │  └─ checklist/            index(v1/v2 스위치) · ChecklistV1Screen · ChecklistV2Screen (임시)
   │     └─ parts/             v1·v2 공통: ProgressBar · Tabs · ItemCard · FixSuggestionPanel · AssigneeChangePanel
   ├─ demo/                    ExtensionDemoPage · BrowserChrome · DemoSite · OverlayMarker
   └─ assets/
```

## 팀 규칙

1. **부품은 쓰는 페이지 폴더 안에 둡니다.** 여러 페이지가 쓰면 `web/common`, 웹·확장이 같이 쓰면 `shared/`.
2. **`web/` ↔ `extension/` 은 서로 import 하지 않습니다.** (ESLint가 막음) 화면 간 이동은 URL 링크로만.
3. **색·글꼴은 `shared/styles/index.css` 토큰**을 먼저 쓰고, 없으면 토큰을 추가합니다.
4. **접근성 서비스이므로 우리 화면부터 기준을 지킵니다.** 의미 있는 태그(button/a/h1/table/label),
   아이콘 버튼 aria-label, 색만으로 구분 금지, 키보드로 모두 조작 가능. 탭·모달·드롭다운은 Radix.
5. **임시 데이터는 `shared/mocks` 에만** 둡니다. 페이지 안에 숫자를 직접 쓰지 않습니다.
6. 파일 이름은 기능이 드러나게: 웹 `기능Page`, 확장 `기능Screen`, 탭 `기능Tab`, 모달 `기능Modal`.

## 백엔드 연결 방법 (예정)

화면은 `useAppState()` / `actions` 로만 데이터를 읽고 바꿉니다.
백엔드가 준비되면 `shared/store.ts` 의 초기값과 `actions` 안을 API 호출로 바꾸고,
`shared/api/types.ts` 를 응답 형태에 맞추면 화면 코드는 그대로 둘 수 있습니다.
(다음 작업: `shared/api/` 에 mock / http 구현을 나눠 스위치 하나로 바꾸도록 정리)

## 미정 · 확인 필요

- 사이드 패널 체크리스트 **v1 / v2** — 팀 결정 후 하나만 남기고 삭제 (`?checklist=v1` 로 비교 가능)
- 디자인 색 중 접근성 대비 기준(4.5:1)에 못 미치는 곳 — 진행중 프로젝트 카드 흰 글자, 로그인 화면 파란 링크, 꺼진 스위치, 강조색 #3086FF 작은 글씨
- 임시 데이터 숫자와 디자인 숫자가 일부 다름 (예: 할 일 탭 카운트)

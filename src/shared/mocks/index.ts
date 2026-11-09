// 디자인에 나온 내용 그대로의 가짜 데이터. 백엔드 연결 시 store.ts 의 초기값만 API로 바꾸면 됩니다.
import type { Comment, Issue, Member, Project, Version } from '@/shared/api/types'

export const CURRENT_USER_ID = 'hyeseung'

export const members: Member[] = [
  { id: 'hyeseung', name: '김혜승', initial: '혜', team: 'design', role: '디자이너', email: 'hyeseung@example.com', assigned: 4, resolved: 12 },
  { id: 'seoyeon', name: '박서연', initial: '서', team: 'design', role: '디자이너', email: 'seoyeon@example.com', lead: true, assigned: 2, resolved: 9 },
  { id: 'yuna', name: '유나', initial: '유', team: 'design', role: '디자이너', email: 'yuna@example.com', assigned: 3, resolved: 5 },
  { id: 'minjun', name: '민준', initial: '민', team: 'frontend', role: '프론트엔드', email: 'minjun@example.com', assigned: 5, resolved: 14 },
  { id: 'hyunwoo', name: '현우', initial: '현', team: 'frontend', role: '프론트엔드', email: 'hyunwoo@example.com', assigned: 3, resolved: 6 },
  { id: 'sohee', name: '소희', initial: '소', team: 'frontend', role: '프론트엔드', email: 'sohee@example.com', assigned: 2, resolved: 8 },
  { id: 'doyun', name: '도윤', initial: '도', team: 'backend', role: '백엔드', email: 'doyun@example.com', assigned: 1, resolved: 3 },
  { id: 'jiwoo', name: '지우', initial: '지', team: 'pm', role: 'PM', email: 'jiwoo@example.com', assigned: 0, resolved: 2 },
]

export const teams = [
  { id: 'a11y', name: 'A11y-Translator', initial: 'A' },
  { id: 'gdgoc', name: 'GDGoC 5th', initial: 'G' },
  { id: 'ours', name: '우리팀 화이팅', initial: '우' },
]

export const projects: Project[] = [
  { id: 'b', name: '프로젝트B', url: 'webA.github.io/A11y', status: 'active', updatedAt: '26.11.11', currentVersion: 11 },
  { id: 'a', name: '프로젝트A', url: 'webA.github.io/A11y', status: 'done', updatedAt: '26.07.09', currentVersion: 10 },
  { id: 'a2', name: '프로젝트A', url: 'webA.github.io/A11y', status: 'done', updatedAt: '26.07.09', currentVersion: 8 },
  { id: 'a3', name: '프로젝트A', url: 'webA.github.io/A11y', status: 'done', updatedAt: '26.07.09', currentVersion: 6 },
]

export const versions: Version[] = [
  { no: 11, date: '2026.11.02', remainingComments: 42, issues: 54, resolved: 12 },
  { no: 10, date: '2026.10.31', remainingComments: 0, issues: 61, resolved: 9 },
  { no: 1, date: '2026.10.31', remainingComments: 0, issues: 80, resolved: 0 },
]

const contrastFix = {
  detail:
    "'자세히 보기' 버튼 글자(#9E9E9E)가 흰 배경 위에서 2.7:1이에요. 기준은 4.5:1이에요. 저시력 사용자나 햇빛 아래에서 보는 사용자가 읽기 어려워요.",
  fixOptions: [
    { color: '#767676', ratio: '4.5 : 1', label: '최소 기준' },
    { color: '#616161', ratio: '6.2 : 1', label: '여유 있게 통과' },
    { color: '#424242', ratio: '10.0 : 1', label: '본문용 추천' },
  ],
  fixCode: '.cta-secondary { color: #616161; }',
}

export const issues: Issue[] = [
  { id: 'i1', no: 1, title: '글자와 배경의 색 대비가 부족해요', impact: '저시력 사용자는 버튼 글자를 읽기 어려워요', category: '색 대비', severity: 'critical', priority: 'high', wcag: 'WCAG 1.4.3', elements: 3, selectors: ['button.cta-secondary', 'p.hero-sub', 'span.footer-note'], page: '/main', comments: 2, status: 'in_progress', team: 'design', assigneeId: 'hyeseung', due: '오늘까지', version: 11, ...contrastFix },
  { id: 'i2', no: 2, title: '이미지에 설명이 없어요', impact: '화면낭독기 사용자는 이미지 내용을 알 수 없어요', category: '대체 텍스트', severity: 'critical', priority: 'high', wcag: 'WCAG 1.1.1', elements: 5, selectors: ['img.hero', 'img.card-1', 'img.card-2', 'img.card-3', 'img.footer-logo'], page: '/main', comments: 0, status: 'review', team: 'frontend', assigneeId: 'minjun', version: 11, fixCode: 'alt="서비스 소개 일러스트"' },
  { id: 'i3', no: 3, title: '키보드로 메뉴를 열 수 없어요', impact: '마우스를 쓰지 않는 사용자는 메뉴에 갈 수 없어요', category: '키보드', severity: 'serious', priority: 'high', wcag: 'WCAG 2.1.1', elements: 2, selectors: ['nav .menu-toggle', 'nav .dropdown'], page: '/main', comments: 1, status: 'in_progress', team: 'frontend', assigneeId: 'minjun', version: 11 },
  { id: 'i4', no: 4, title: '입력칸에 이름표가 없어요', impact: '화면낭독기가 "편집창"이라고만 읽어요', category: '폼 레이블', severity: 'moderate', priority: 'normal', wcag: 'WCAG 1.3.1', elements: 4, selectors: ['input#email', 'input#name', 'input#phone', 'textarea#msg'], page: '/contact', comments: 2, status: 'todo', team: 'design', assigneeId: 'hyeseung', due: '버전 12까지', version: 11 },
  { id: 'i5', no: 5, title: '링크 텍스트가 모호해요', impact: '"여기"만 읽혀서 어디로 가는지 알 수 없어요', category: '링크', severity: 'moderate', priority: 'normal', wcag: 'WCAG 2.4.4', elements: 3, selectors: ['a.more', 'a.here', 'a.link-3'], page: '/pricing', comments: 0, status: 'todo', team: 'design', assigneeId: 'hyeseung', due: '버전 12까지', version: 11 },
  { id: 'i6', no: 6, title: '아이콘 버튼에 이름이 없어요', impact: '화면낭독기가 "버튼"이라고만 읽어요', category: '대체 텍스트', severity: 'serious', priority: 'normal', wcag: 'WCAG 4.1.2', elements: 2, selectors: ['button.icon-search', 'button.icon-close'], page: '/main', comments: 0, status: 'todo', team: 'design', assigneeId: 'hyeseung', due: '버전 13까지', version: 11 },
  { id: 'i7', no: 7, title: '포커스 표시가 보이지 않아요', impact: '키보드 사용자는 지금 위치를 알 수 없어요', category: '키보드', severity: 'serious', priority: 'normal', wcag: 'WCAG 2.4.7', elements: 6, selectors: ['a', 'button'], page: '/main', comments: 4, status: 'resolved', team: 'design', assigneeId: 'hyeseung', version: 11, autoResolved: true },
  { id: 'i8', no: 8, title: '페이지 제목이 중복돼요', impact: '여러 탭을 열면 어느 페이지인지 구분하기 어려워요', category: '문서 구조', severity: 'minor', priority: 'normal', wcag: 'WCAG 2.4.2', elements: 2, selectors: ['title'], page: '/pricing', comments: 0, status: 'unassigned', aiTeam: 'frontend', version: 11 },
  { id: 'i9', no: 9, title: '오류 메시지가 화면낭독기에 안 읽혀요', impact: '입력이 틀려도 화면낭독기 사용자는 알 수 없어요', category: '폼 레이블', severity: 'serious', priority: 'normal', wcag: 'WCAG 4.1.3', elements: 1, selectors: ['.form-error'], page: '/contact', comments: 0, status: 'todo', team: 'backend', assigneeId: 'doyun', version: 11 },
  { id: 'u1', no: 10, title: '버튼 글자 색 대비가 부족해요', impact: '저시력 사용자는 버튼 글자를 읽기 어려워요', category: '색 대비', severity: 'critical', priority: 'high', wcag: 'WCAG 1.4.3', elements: 3, selectors: ['button.subscribe'], page: '/main', comments: 0, status: 'unassigned', aiTeam: 'design', version: 11 },
  { id: 'u2', no: 11, title: '카드 이미지에 설명이 없어요', impact: '화면낭독기 사용자는 이미지 내용을 알 수 없어요', category: '대체 텍스트', severity: 'serious', priority: 'normal', wcag: 'WCAG 1.1.1', elements: 5, selectors: ['img.card'], page: '/main', comments: 0, status: 'unassigned', aiTeam: 'frontend', version: 11 },
  { id: 'u3', no: 12, title: '드롭다운이 키보드로 닫히지 않아요', impact: 'Esc 키로 메뉴를 닫을 수 없어요', category: '키보드', severity: 'serious', priority: 'normal', wcag: 'WCAG 2.1.2', elements: 2, selectors: ['.dropdown'], page: '/main', comments: 0, status: 'unassigned', version: 11 },
  { id: 'u4', no: 13, title: '구독 입력칸에 이름표가 없어요', impact: '화면낭독기가 "편집창"이라고만 읽어요', category: '폼 레이블', severity: 'moderate', priority: 'normal', wcag: 'WCAG 1.3.1', elements: 4, selectors: ['input.subscribe'], page: '/main', comments: 0, status: 'unassigned', version: 11 },
  { id: 'u5', no: 14, title: '"자세히" 링크가 모호해요', impact: '"자세히"만 읽혀서 어디로 가는지 알 수 없어요', category: '링크', severity: 'minor', priority: 'normal', wcag: 'WCAG 2.4.4', elements: 3, selectors: ['a.more'], page: '/main', comments: 0, status: 'unassigned', version: 11 },
]

export const comments: Comment[] = [
  { id: 'c1', issueId: 'i1', authorId: 'hyeseung', body: '보조 버튼만 #616161로 바꿀게요. 브랜드 컬러 영향 없어요.', time: '10분 전', pin: { x: 38, y: 52 } },
  { id: 'c2', issueId: 'i1', authorId: 'minjun', body: '@혜승 확인했어요. 버전 12에 반영할게요.', time: '5분 전' },
  { id: 'c3', issueId: 'i4', authorId: 'jiwoo', body: '@서연 폼 레이블 문구 확인 부탁해요', time: '1시간 전' },
  { id: 'c4', issueId: 'i1', authorId: 'minjun', body: '@서연 #616161로 바꾸면 브랜드 컬러 괜찮을까요?', time: '10분 전' },
]

/** 검사 요약 (확장 02 · 검사 결과) */
export const scanSummary = {
  total: 24,
  scannedAt: '오늘 10:42',
  bySeverity: { critical: 3, serious: 7, moderate: 10, minor: 4 },
  byCategory: [
    { label: '색 대비', count: 9 },
    { label: '대체 텍스트', count: 6 },
    { label: '키보드', count: 5 },
  ],
}

export const memberById = (id?: string) => members.find((m) => m.id === id)

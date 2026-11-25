// 알림 (/notifications) — 피그마에 아직 디자인이 없어, 요청 상세 · 방 화면의 부품(유리 패널 · 역할 칩 · 기록 칩)으로 구성했습니다.
// 내용은 넘겨주기 카드의 "주고받은 기록"에서 만들어져요 (@/data/notificationStore):
//   요청 받음 · 수락 · 날짜 제안 · 확인 필요(전달됨) · 수정 요청 · 막힘 · 확인 완료 · 질문/코멘트
// 줄을 누르면 그 카드로 가고(확인이 필요한 전달은 바로 확인 화면), 읽음으로 바뀝니다. 읽음 표시는 새로고침해도 남아요.
import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { markRead, relativeTime, useNotifications, type Notification } from '@/data/notificationStore'
import type { HistoryKind } from '@/data/requestStore'
import { Page } from '@/layout/Page'
import { RouteChips } from '@/pages/request/requestParts'
import { GhostButton, GlassPanel, PageHeader, Segmented } from '@/ui'
import { useToast } from '@/ui/toast'

type Filter = 'all' | 'unread' | 'blocked'

// 종류 칩의 색 — 요청 상세 "주고받은 기록"의 칩과 같은 값
const PLAIN = 'bg-fill-2 text-ink'
const TONE: Record<HistoryKind, string> = {
  request: PLAIN,
  propose: PLAIN,
  question: PLAIN,
  comment: PLAIN,
  unblock: PLAIN,
  accept: 'bg-role-front-bg text-checkpoint-text',
  deliver: 'bg-fill-3 text-ink',
  redeliver: 'bg-fill-3 text-ink',
  fix: 'bg-fill-3 text-due',
  confirm: 'bg-role-back-bg text-ink',
  block: 'bg-danger/10 text-blocked',
}

const EMPTY: Record<Filter, { title: string; text: string }> = {
  all: { title: '아직 알림이 없어요', text: '요청을 주고받으면 여기에 차례로 쌓여요.' },
  unread: { title: '안 읽은 알림이 없어요', text: '모두 확인했어요.' },
  blocked: { title: '막힌 일이 없어요', text: '누군가 막힘을 표시하면 여기에 먼저 보여요.' },
}

export function NotificationsPage() {
  const toast = useToast()
  const all = useNotifications()
  const [filter, setFilter] = useState<Filter>('all')

  const unread = all.filter((n) => !n.read)
  const blocked = all.filter((n) => n.kind === 'block')
  const list = filter === 'unread' ? unread : filter === 'blocked' ? blocked : all
  const groups = [
    { title: '오늘', items: list.filter((n) => n.today) },
    { title: '이전', items: list.filter((n) => !n.today) },
  ].filter((g) => g.items.length > 0)

  const options = [
    { value: 'all', label: `전체 ${all.length}` },
    { value: 'unread', label: `안 읽음 ${unread.length}` },
    { value: 'blocked', label: `막힘 ${blocked.length}` },
  ] as const satisfies readonly { value: Filter; label: string }[]

  const readAll = () => {
    markRead(unread.map((n) => n.id))
    toast(`알림 ${unread.length}개를 모두 읽음으로 표시했어요`)
  }

  return (
    <Page>
      <PageHeader
        title="알림"
        sub={unread.length > 0 ? `안 읽은 알림이 ${unread.length}개 있어요.` : '새 알림이 없어요.'}
        right={
          <GhostButton onClick={readAll} disabled={unread.length === 0} className="px-3.5! py-2! text-[13px]! disabled:opacity-40 disabled:hover:bg-transparent">
            모두 읽음
          </GhostButton>
        }
      />

      <GlassPanel className="mt-6 flex w-full max-w-[860px] flex-col gap-4 p-[clamp(16px,2.2cqw,24px)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Segmented label="알림 걸러 보기" options={options} value={filter} onChange={setFilter} />
          {/* 걸러 본 결과를 화면낭독기에도 알림 */}
          <p role="status" className="sr-only">
            {list.length > 0 ? `알림 ${list.length}개` : EMPTY[filter].title}
          </p>
        </div>

        {groups.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 px-4 py-12 text-center">
            <p className="text-[15px] font-semibold text-ink">{EMPTY[filter].title}</p>
            <p className="text-[13px] text-muted">{EMPTY[filter].text}</p>
            {filter !== 'all' && all.length > 0 && (
              <button type="button" onClick={() => setFilter('all')} className="mt-2 rounded text-[13px] font-semibold text-ink underline-offset-4 hover:underline">
                전체 알림 보기
              </button>
            )}
          </div>
        ) : (
          groups.map((group) => <Group key={group.title} title={group.title} items={group.items} />)
        )}
      </GlassPanel>
    </Page>
  )
}

function Group({ title, items }: { title: string; items: Notification[] }) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-1.5">
      <h2 id={headingId} className="flex items-center gap-1.5 py-1 leading-normal">
        <span className="text-[13px] font-semibold text-ink">{title}</span>
        <span className="font-mono text-xs font-medium text-muted">
          {items.length}
          <span className="sr-only">개</span>
        </span>
      </h2>
      <ul className="flex flex-col gap-1.5">
        {items.map((n) => (
          <Row key={n.id} item={n} />
        ))}
      </ul>
    </section>
  )
}

function Row({ item }: { item: Notification }) {
  return (
    <li>
      <Link
        to={item.to}
        onClick={() => markRead([item.id])}
        className={`relative flex flex-col gap-1.5 rounded-2xl border px-3.5 py-3 leading-normal transition hover:border-ink/20 hover:bg-fill-2 ${
          item.read ? 'border-line bg-transparent' : 'border-line bg-fill'
        }`}
      >
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          {/* 안 읽음 점 (사이드바 배지와 같은 색) */}
          {!item.read && <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-danger" />}
          <span className="sr-only">{item.read ? '읽음' : '안 읽음'} · </span>
          <RouteChips from={item.fromRole} to={item.toRole} />
          <span className={`rounded-[8.5px] px-[7px] py-0.5 text-[11px] font-semibold whitespace-nowrap ${TONE[item.kind]}`}>{item.label}</span>
          <span className={`min-w-0 text-sm text-ink ${item.read ? 'font-medium' : 'font-semibold'}`}>{item.title}</span>
          <span className="ml-auto shrink-0 font-mono text-[11px] font-medium whitespace-nowrap text-muted">{relativeTime(item)}</span>
        </span>
        <span className={`text-[13px] break-words ${item.read ? 'text-muted' : 'text-ink'}`}>
          <span className="font-semibold">{item.actor}</span> · {item.text}
        </span>
        {item.to.endsWith('/review') && <span className="text-xs font-semibold text-ink">확인하러 가기 ›</span>}
      </Link>
    </li>
  )
}

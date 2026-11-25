// 피그마 "03 디자인 방 · 내추럴" — Figma 미리보기가 붙는 대화 + 오른쪽 "현재 흐름".
import { useState } from 'react'
import titleDot from '@/assets/rooms/title-dot-design.svg'
import { useSoon } from '@/ui/toast'
import { SourceChip } from './RoomAttachments'
import { Link } from 'react-router-dom'
import { REQUEST_ENTRY, RoomFeed, RoomShell } from './RoomShell'
import { FlowGroup, PanelToggle, SidePanel } from './RoomSidePanel'
import { DESIGN_ROOM, type FigmaAttachment } from './roomData'
import { useRoomFeed } from './useRoomFeed'
import { useRoomFlows } from './roomFlows'
import { useRoomHandoff } from './useRoomHandoff'

type View = (typeof DESIGN_ROOM.views)[number]['value']

export function DesignRoomPage() {
  const feed = useRoomFeed(DESIGN_ROOM.feed, 'design')
  const [view, setView] = useState<View>('list')
  const soon = useSoon()
  // 현재 흐름: 넘겨주기 카드 저장소에서 (기획안 §7-3)
  const flows = useRoomFlows('design')
  const handoff = useRoomHandoff('design', feed)

  // "링크/파일 보기": 대화에 올라온 Figma 링크만 모아 보기 (피그마에 이 상태의 그림은 없어 같은 행 모양으로 구성)
  const files = feed.items.flatMap((item) => (item.kind === 'message' ? (item.attachments ?? []).filter((a): a is FigmaAttachment => a.type === 'figma') : []))

  return (
    <RoomShell
      title={DESIGN_ROOM.title}
      count={DESIGN_ROOM.count}
      icon={<img src={titleDot} alt="" className="size-[7px] shrink-0" />}
      // 피그마 방 화면에는 없는 버튼 — 06 요청 보내기 모달로 들어가는 길
      headerExtra={
        <Link to="/requests/new?room=design" className={`ml-auto ${REQUEST_ENTRY}`}>
          요청 보내기
        </Link>
      }
      feed={
        <RoomFeed
          label="디자인 방 대화"
          items={feed.items}
          live={feed.live}
          gapClass="gap-6"
          handoff={handoff.feed}
          composer={{ placeholder: DESIGN_ROOM.placeholder, onSend: (text) => feed.send(text) }}
        />
      }
      side={
        <SidePanel
          title={DESIGN_ROOM.sideTitle}
          footer={<PanelToggle label="현재 흐름 보기 방식" options={DESIGN_ROOM.views} value={view} onChange={setView} />}
        >
          {view === 'list' ? (
            flows.map((group) => <FlowGroup key={group.title} group={group} />)
          ) : (
            <div className="flex w-full flex-col gap-1.5">
              <h3 className="flex items-center gap-1.5 py-1 leading-normal">
                <span className="text-[13px] font-semibold text-ink">링크/파일</span>
                <span className="font-mono text-xs font-medium text-muted">
                  {files.length}
                  <span className="sr-only">개</span>
                </span>
              </h3>
              <ul className="flex flex-col gap-1.5">
                {files.map((file) => (
                  <li key={file.title}>
                    <button
                      type="button"
                      onClick={soon('Figma에서 열기')}
                      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-line bg-fill p-3 text-left leading-normal transition hover:bg-fill-3"
                    >
                      <span className="flex min-w-0 flex-col items-start gap-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <SourceChip className="bg-fill-3">FIGMA</SourceChip>
                          <span className="text-sm font-semibold text-ink">{file.title}</span>
                        </span>
                        <span className="text-[11px] text-muted">{file.path}</span>
                      </span>
                      <span className="shrink-0 text-xs font-semibold whitespace-nowrap text-muted">{file.version}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </SidePanel>
      }
    >
      {handoff.dialog}
    </RoomShell>
  )
}

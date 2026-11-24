// 아직 디자인이 없는 메뉴(알림 · 웹 접근성 검사 등)에 보여 주는 안내 화면.
import { Link } from 'react-router-dom'
import { Page } from '@/layout/Page'
import { GlassPanel, PageHeader } from '@/ui'

export function ComingSoon({ title, note }: { title: string; note?: string }) {
  return (
    <Page>
      <PageHeader title={title} sub="이 화면은 아직 준비 중이에요." />
      <GlassPanel className="mt-8 flex max-w-[520px] flex-col items-start gap-3 p-6">
        <p className="text-sm leading-relaxed text-ink">{note ?? '디자인이 정해지면 이 자리에 화면이 들어옵니다.'}</p>
        <Link to="/board" className="text-sm font-semibold text-summit underline-offset-4 hover:underline">
          메인보드로 가기
        </Link>
      </GlassPanel>
    </Page>
  )
}

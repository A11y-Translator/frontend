// Figma: Component 1 (상태 태그 — 완료됨 / 진행중 / 중요 / 보통)
// 색만으로 구분하지 않도록 아이콘 + 글자를 함께 씁니다.
// 검사·리포트 화면이 같이 씁니다. (todo 화면에도 같은 태그가 있으면 공용 위치로 옮기는 게 좋아요)
import tagSuccess from '@/web/assets/tag-success.svg'
import tagProgress from '@/web/assets/tag-progress.svg'
import tagWarning from '@/web/assets/tag-warning.svg'
import tagCircle from '@/web/assets/tag-circle.svg'
import type { TagKind } from '@/web/common/issueHelpers'

const STYLE: Record<TagKind, { label: string; icon: string; box: string; text: string }> = {
  done: { label: '완료됨', icon: tagSuccess, box: 'border-success bg-[rgb(25_115_75/0.3)]', text: 'text-success' },
  progress: { label: '진행중', icon: tagProgress, box: 'border-[#ff8c18] bg-[rgb(255_141_27/0.3)]', text: 'text-[#9a4c00]' },
  important: { label: '중요', icon: tagWarning, box: 'border-tag-danger-line bg-tag-danger-bg', text: 'text-tag-danger-text' },
  normal: { label: '보통', icon: tagCircle, box: 'border-tag-info-line bg-tag-info-bg', text: 'text-tag-info-text' },
}

export function StatusTag({ kind }: { kind: TagKind }) {
  const s = STYLE[kind]
  return (
    <span
      className={`inline-flex h-[25px] shrink-0 items-center justify-center gap-1 rounded-[19px] border px-2 font-pretendard text-[11px] leading-[1.45] font-medium whitespace-nowrap ${s.box} ${s.text}`}
    >
      <img src={s.icon} alt="" width={14} height={14} />
      {s.label}
    </span>
  )
}

// Figma: ext/Severity (335:7591) — 접근성 이슈 심각도 칩. 웹·확장 공통.
// "색만으로 구분하지 않도록 아이콘 모양 + 텍스트를 함께 사용" (axe impact: critical/serious/moderate/minor)
import type { Severity } from '@/shared/api/types'
import { SEVERITY_LABEL } from '@/shared/api/types'
import sevCritical from '@/shared/assets/severity-critical.svg'
import sevSerious from '@/shared/assets/severity-serious.svg'
import sevModerate from '@/shared/assets/severity-moderate.svg'
import sevMinor from '@/shared/assets/severity-minor.svg'

const STYLE: Record<Severity, { icon: string; cls: string }> = {
  critical: { icon: sevCritical, cls: 'bg-sev-critical text-white' },
  serious: { icon: sevSerious, cls: 'bg-sev-serious text-white' },
  moderate: { icon: sevModerate, cls: 'bg-sev-moderate text-black' },
  minor: { icon: sevMinor, cls: 'bg-sev-minor text-muted' },
}

export function SeverityChip({ severity }: { severity: Severity }) {
  const s = STYLE[severity]
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full py-[3px] pr-2.5 pl-2 font-noto text-xs leading-[1.4] font-bold ${s.cls}`}>
      <img src={s.icon} alt="" width={12} height={12} />
      <span>
        <span className="sr-only">심각도 </span>
        {SEVERITY_LABEL[severity]}
      </span>
    </span>
  )
}

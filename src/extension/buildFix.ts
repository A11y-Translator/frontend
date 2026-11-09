// 이슈 + 고른 색 → 수정값(개발자용 코드 / 디자이너용 문구) 만들기 (03 미리 고쳐보기 · 체크리스트 추천 수정 공통)
import type { Issue } from '@/shared/api/types'

export interface BuiltFix {
  /** 개발자용 (수정안 저장 시 이 값이 저장됨) */
  code: string
  /** 디자이너용 설명 */
  designer: string
  /** "2.7 : 1 → 6.2 : 1" (색 대비 이슈에서 색을 골랐을 때만) */
  ratioChange?: string
  /** 저장 가능한 상태인지 (색 대비 이슈는 색을 골라야 함) */
  ready: boolean
}

export function buildFix(issue: Issue, color?: string): BuiltFix {
  if (issue.fixOptions) {
    const option = issue.fixOptions.find((o) => o.color.toLowerCase() === color?.toLowerCase())
    // 상세 설명에서 원래 색·대상·대비를 읽어옴 (예: '자세히 보기' 버튼 글자(#9E9E9E) … 2.7:1)
    const from = issue.detail?.match(/#[0-9a-f]{6}/i)?.[0]
    const target = issue.detail?.match(/'([^']+)'/)?.[1]
    const fromRatio = issue.detail?.match(/(\d+(?:\.\d+)?):1/)?.[1]
    const base = issue.fixCode ?? `${issue.selectors[0]} { color: #000000; }`
    if (!option) {
      return {
        code: base.replace(/#[0-9a-f]{6}/i, '추천 색을 골라 주세요'),
        designer: '위에서 추천 색을 고르면 전달할 문구가 만들어져요.',
        ready: false,
      }
    }
    return {
      code: base.replace(/#[0-9a-f]{6}/i, option.color),
      designer: `${target ? `'${target}' ` : ''}글자색을 ${from ? `${from} → ` : ''}${option.color}로 바꿔 주세요. (대비 ${option.ratio}, ${option.label})`,
      ratioChange: fromRatio ? `${fromRatio} : 1 → ${option.ratio}` : undefined,
      ready: true,
    }
  }
  return {
    code: issue.fixCode ?? `/* ${issue.wcag} · 대상: ${issue.selectors.join(', ')} */`,
    designer: `${issue.impact}. 대상 요소 ${issue.elements}개(${issue.selectors.join(', ')})를 고쳐 주세요.${issue.fixCode ? ` 예) ${issue.fixCode}` : ''}`,
    ready: true,
  }
}

// 체크리스트 화면 — v1/v2 버전 스위치 (임시: 팀이 결정하면 이 스위치와 안 쓰는 버전 파일을 삭제)
// 기본값은 CHECKLIST_VARIANT, 주소에 ?checklist=v1 또는 ?checklist=v2 가 있으면 그걸로 덮어씀
//   예) /extension?checklist=v1 , /extension/panel?checklist=v1
import ChecklistV1Screen from './ChecklistV1Screen'
import ChecklistV2Screen from './ChecklistV2Screen'

export type ChecklistVariant = 'v1' | 'v2'

export const CHECKLIST_VARIANT: ChecklistVariant = 'v2'

function readVariant(): ChecklistVariant {
  if (typeof window === 'undefined') return CHECKLIST_VARIANT
  const q = new URLSearchParams(window.location.search).get('checklist')
  return q === 'v1' || q === 'v2' ? q : CHECKLIST_VARIANT
}

export default function ChecklistScreen() {
  return readVariant() === 'v1' ? <ChecklistV1Screen /> : <ChecklistV2Screen />
}

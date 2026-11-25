// 서버 값 불러오기 (http 모드에서만). 앱이 시작할 때와 로그인 직후에 모든 저장소를 한 번에 채웁니다.
// 목업 모드에서는 저장소가 localStorage 에서 바로 읽으므로 아무 일도 하지 않아요.
import { isMock } from '@/api/config'
import { hydrateNotifications } from './notificationStore'
import { hydratePlan } from './planStore'
import { hydrateRequests } from './requestStore'
import { hydrateRooms } from './roomStore'
import { getSession, hydrateSession, subscribeSession } from './sessionStore'

export function hydrateAll() {
  if (isMock) return Promise.resolve()
  return Promise.all([hydrateSession(), hydratePlan(), hydrateRequests(), hydrateRooms(), hydrateNotifications()]).then(() => undefined)
}

/** main.tsx 에서 한 번 부름: 로그인돼 있으면 바로, 아니면 로그인하는 순간 불러옴 */
export function startSync() {
  if (isMock) return
  let token = getSession()?.token
  if (token !== undefined) void hydrateAll()
  subscribeSession(() => {
    const next = getSession()?.token
    if (next !== undefined && next !== token) void hydrateAll()
    token = next
  })
}

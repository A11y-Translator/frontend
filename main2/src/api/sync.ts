// 저장소(store) ↔ API 를 잇는 공통 방식. 모든 저장소가 이 두 함수만 씁니다.
//   push : 화면 값은 먼저 바꿔 두고(낙관적) 서버에 보냄 → 실패하면 되돌리고 알림
//   pull : 서버 값을 가져와 저장소에 넣음 (http 모드에서 시작할 때 · 로그인 직후)
// 목업 모드에서는 api 가 localStorage 에 바로 쓰기 때문에 예전과 똑같이 동작해요.
import { isMock } from './config'
import { errorMessage } from './http'

type Listener = (message: string) => void
const listeners = new Set<Listener>()

/** 동기화 오류를 듣기 (ui/toast 의 ToastProvider 가 받아서 알림으로 보여 줌) */
export function onSyncError(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function report(what: string, e: unknown) {
  const message = `${what} 실패 — ${errorMessage(e)}`
  listeners.forEach((l) => l(message))
}

export interface PushOptions<T> {
  /** 실패했을 때 화면 값을 되돌리는 함수 */
  rollback: () => void
  /** 서버가 돌려준 값으로 맞추기 (http 모드에서만 불림) */
  done?: (result: T) => void
}

/** 낙관적 저장. what = 오류 알림에 쓸 이름 ("요청 저장") */
export function push<T>(what: string, call: () => Promise<T>, options: PushOptions<T>) {
  let promise: Promise<T>
  try {
    promise = call()
  } catch (e) {
    promise = Promise.reject(e)
  }
  promise.then(
    (result) => {
      if (!isMock) options.done?.(result)
    },
    (e: unknown) => {
      options.rollback()
      report(what, e)
    },
  )
}

/** 서버 값 불러오기. 실패하면 알리고 지금 값을 그대로 둠 */
export async function pull<T>(what: string, call: () => Promise<T>, apply: (value: T) => void) {
  try {
    apply(await call())
  } catch (e) {
    report(what, e)
  }
}

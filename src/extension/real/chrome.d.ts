// 설치형 확장에서 쓰는 크롬 API 중 필요한 것만 직접 선언 (@types/chrome 의존성을 늘리지 않으려고)
// 공식 문서: https://developer.chrome.com/docs/extensions/reference/api
declare namespace chrome {
  namespace runtime {
    const lastError: { message?: string } | undefined
    const onInstalled: { addListener(cb: () => void): void }
    const onStartup: { addListener(cb: () => void): void }
  }
  namespace tabs {
    interface Tab {
      id?: number
      windowId: number
      url?: string
      title?: string
      status?: string
      active: boolean
    }
    function query(q: { active?: boolean; currentWindow?: boolean; lastFocusedWindow?: boolean; url?: string }): Promise<Tab[]>
    function get(tabId: number): Promise<Tab>
    const onActivated: {
      addListener(cb: (info: { tabId: number; windowId: number }) => void): void
      removeListener(cb: (info: { tabId: number; windowId: number }) => void): void
    }
    const onUpdated: {
      addListener(cb: (tabId: number, change: { status?: string; url?: string; title?: string }, tab: Tab) => void): void
      removeListener(cb: (tabId: number, change: { status?: string; url?: string; title?: string }, tab: Tab) => void): void
    }
  }
  namespace scripting {
    interface InjectionResult<T> {
      result?: T
      frameId: number
    }
    function executeScript<A extends unknown[], R>(details: {
      target: { tabId: number; allFrames?: boolean }
      func: (...args: A) => R
      args?: A
    }): Promise<InjectionResult<Awaited<R>>[]>
    function executeScript(details: { target: { tabId: number; allFrames?: boolean }; files: string[] }): Promise<InjectionResult<unknown>[]>
  }
  namespace sidePanel {
    function open(options: { tabId: number }): Promise<void>
    function setPanelBehavior(behavior: { openPanelOnActionClick: boolean }): Promise<void>
  }
  namespace permissions {
    function contains(p: { origins?: string[]; permissions?: string[] }): Promise<boolean>
    function request(p: { origins?: string[]; permissions?: string[] }): Promise<boolean>
  }
  namespace storage {
    const session: {
      get(keys: string | string[]): Promise<Record<string, unknown>>
      set(items: Record<string, unknown>): Promise<void>
      remove(keys: string | string[]): Promise<void>
    }
  }
}

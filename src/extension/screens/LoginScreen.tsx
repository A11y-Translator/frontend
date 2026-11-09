// 01 · chrome/login (Figma 547:1079)
// 원래 400×600 팝업 디자인 → 사이드 패널 높이에 맞춰 위(안내 카드)·아래(버튼) 로 나눠 배치
import { useId, useState, type FormEvent } from 'react'
import { usePanel, useScreenFocus } from '@/extension/panelNav'

export default function LoginScreen() {
  const { go } = usePanel()
  const titleRef = useScreenFocus<HTMLHeadingElement>()
  const [otherUrl, setOtherUrl] = useState(false)
  const urlId = useId()

  // 프로토타입: 로그인은 생략하고 바로 검사 결과로 이동
  const start = () => go({ name: 'result' })
  const submitUrl = (e: FormEvent) => {
    e.preventDefault()
    start()
  }

  return (
    <div
      className="flex h-full w-full flex-col overflow-y-auto font-noto text-ink-2"
      style={{ backgroundImage: 'linear-gradient(180deg, rgb(106 212 131 / 0.2) 0%, rgb(255 255 255 / 0) 100%)', backgroundColor: 'white' }}
    >
      <div className="flex flex-1 flex-col p-2">
        <section className="flex flex-col gap-2 rounded-xl bg-white px-6 pt-11 pb-8">
          <h1 ref={titleRef} tabIndex={-1} className="text-2xl leading-[34px] font-bold">
            로그인하고 검사해 보세요
          </h1>
          <p className="text-sm leading-[22px] text-muted">
            Google 계정으로 시작하세요.
            <br />
            검사 결과를 팀과 공유할 수 있어요.
          </p>
        </section>

        {otherUrl && (
          <form onSubmit={submitUrl} className="mx-2 mt-4 flex flex-col gap-2 rounded-xl bg-white p-4">
            <label htmlFor={urlId} className="text-sm font-medium">검사할 페이지 주소</label>
            <input
              id={urlId}
              type="url"
              required
              placeholder="https://example.com"
              className="rounded-lg border border-ext-frame px-3 py-2.5 text-sm placeholder:text-muted"
            />
            <button type="submit" className="self-end rounded-full bg-black px-4 py-2 text-sm font-bold text-white">
              이 주소 검사하기
            </button>
          </form>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-center gap-1 px-2 pb-3">
        {/* Figma: 흰 글자 on #6AD483 은 대비 1.9:1 → 접근성 서비스이므로 진한 글자로 바꿔 대비 확보 */}
        <button
          type="button"
          onClick={start}
          className="h-[58px] w-full rounded-[28px] bg-[#6ad483] font-pretendard text-xl font-semibold tracking-[-0.5px] text-ink-2 hover:bg-[#5cc775]"
        >
          현재 페이지 검사하기
        </button>
        <button
          type="button"
          aria-expanded={otherUrl}
          onClick={() => setOtherUrl((v) => !v)}
          className="rounded px-2 font-pretendard text-base leading-[34px] font-semibold text-muted hover:text-ink-2"
        >
          다른 링크 입력하기
        </button>
      </div>
    </div>
  )
}

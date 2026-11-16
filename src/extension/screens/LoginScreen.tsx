// 01 · chrome/login (Figma 758:3483 — 크롬 섹션 확정안, 400×600 팝업)
// 파란 그라데이션 + 안내 문구 + 11 로고 + "Google 로그인하기" / "다른 계정으로 로그인"
import { usePanel, useScreenFocus } from '@/extension/panelNav'
import { PopupFrame, PopupButton } from '@/extension/ui'
import logo11 from '@/extension/assets/logo-11.png'

export default function LoginScreen() {
  const { go } = usePanel()
  const titleRef = useScreenFocus<HTMLHeadingElement>()

  // 프로토타입: 실제 Google 로그인은 생략하고 바로 검사 화면으로 이동
  const login = () => go({ name: 'scan' })

  return (
    <PopupFrame>
      <section className="flex flex-col gap-2 px-6 pt-[88px] text-center">
        <h1 ref={titleRef} tabIndex={-1} className="font-noto text-2xl leading-[34px] font-bold text-[#191b20]">
          로그인하고 검사해 보세요
        </h1>
        <p className="font-noto text-sm leading-[22px] text-[#626873]">
          Google 계정으로 시작하세요.
          <br />
          검사 결과를 팀과 공유할 수 있어요.
        </p>
      </section>

      {/* 로고는 장식 — 화면 이름은 제목이 알려 줌 */}
      <div className="flex flex-1 items-center justify-center pb-[30px]">
        <img src={logo11} alt="" width={123} height={127} className="h-[127px] w-[123px]" />
      </div>

      <div className="flex shrink-0 flex-col items-center px-2 pb-4">
        <PopupButton onClick={login} className="w-full">
          Google 로그인하기
        </PopupButton>
        <button
          type="button"
          onClick={login}
          className="mt-[14px] rounded px-2 text-base leading-[34px] font-semibold text-[#6f6f6f] hover:text-ink-2"
        >
          다른 계정으로 로그인
        </button>
      </div>
    </PopupFrame>
  )
}

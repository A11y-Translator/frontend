// Figma: 00 로그인 · warm (1128:7519) — 사이드바 없이, 왼쪽 둥근 산 사진("Oreum 시작하기") + 오른쪽 종이색 로그인 패널.
// 로그인은 api.auth 를 거칩니다 (@/data/sessionStore). 목업 모드에서는 아무 이메일 · 비밀번호로나 들어가고,
// 구글로 로그인하기는 예시 사용자로 들어가요. 로그인되면 라우터(GuestOnly)가 시작하기(/start)로 보냅니다.
import { useId, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { errorMessage } from '@/api/http'
import { signIn, signInWithGoogle } from '@/data/sessionStore'
import logo from '@/assets/logo-oreum-ink.svg'
import bgMountain from '@/assets/bg-mountain.jpg'
import google from '@/assets/google.svg'
import googleMask from '@/assets/google-mask.svg'
import { useSoon } from '@/ui/toast'

const INPUT =
  'h-12 w-full rounded-xl border border-line bg-surface px-[17px] text-base tracking-[-0.025em] text-ink outline-none placeholder:text-muted focus-visible:border-primary @4xl:h-10 @4xl:text-xs'
const TEXT_LINK = 'py-1 text-[13px] tracking-[-0.006em] text-muted hover:text-ink hover:underline @4xl:py-0 @4xl:text-xs'

const ERROR = 'mt-1.5 text-xs leading-normal font-medium text-blocked'
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function LoginPage() {
  const soon = useSoon()
  const id = useId()
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({})
  const [busy, setBusy] = useState(false)

  // 로그인에 성공하면 세션이 생기고, 라우터가 시작하기로 보냄. 실패하면 문구를 보여 줌
  const run = async (login: () => Promise<void>) => {
    setBusy(true)
    try {
      await login()
    } catch (e) {
      setErrors({ form: errorMessage(e) })
      setBusy(false)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    const next: typeof errors = {}
    if (!email.trim()) next.email = '이메일을 입력해 주세요.'
    else if (!EMAIL.test(email.trim())) next.email = '이메일 형식이 맞지 않아요. 예: name@example.com'
    if (!password) next.password = '비밀번호를 입력해 주세요.'
    setErrors(next)
    // 틀린 첫 칸으로 포커스 (화면낭독기가 오류 문구를 같이 읽어 줌)
    if (next.email) return emailRef.current?.focus()
    if (next.password) return passwordRef.current?.focus()
    void run(() => signIn(email.trim(), password))
  }

  return (
    <div className="flex min-h-full w-full flex-col p-2 @4xl:flex-row @4xl:gap-3 @4xl:p-3">
      {/* 산 사진 + 소개 문구 (사진 아래쪽을 어둡게 해서 글자가 읽히게).
          좁은 화면: 사진 아래쪽에 로그인 패널이 겹쳐 올라오므로 그만큼(40px) 글자를 위로 띄움 */}
      <div className="relative flex min-h-[36dvh] shrink-0 flex-col justify-end overflow-hidden rounded-[28px] px-6 pt-6 pb-[68px] @4xl:min-h-0 @4xl:flex-1 @4xl:rounded-[32px] @4xl:px-[clamp(20px,4cqw,48px)] @4xl:py-[clamp(24px,4cqw,48px)]">
        <img src={bgMountain} alt="" className="absolute inset-0 size-full object-cover" />
        <div aria-hidden className="absolute inset-0 bg-linear-to-b from-[rgb(23_20_18/0)] via-[rgb(23_20_18/0.1)] via-55% to-[rgb(23_20_18/0.72)]" />
        <div className="relative flex flex-col gap-1.5">
          <h1 className="text-[clamp(28px,1.2rem+2.4cqw,48px)] leading-[1.25] font-semibold tracking-[-0.025em] text-white [text-shadow:0_2px_16px_rgb(0_0_0/0.45)]">Oreum 시작하기</h1>
          <p className="max-w-[560px] text-[clamp(14px,0.8rem+0.6cqw,20px)] leading-[1.45] tracking-[-0.025em] text-balance break-keep text-white/80 [text-shadow:0_1px_12px_rgb(0_0_0/0.45)]">
            기획안을 기반으로 원정대의 루트를 생성하고, 소통하도록 돕습니다.
          </p>
        </div>
      </div>

      {/* 로그인 패널 */}
      <section
        aria-label="로그인"
        className="relative -mt-10 flex flex-1 flex-col items-center justify-center rounded-[28px] bg-canvas px-6 py-10 shadow-[0_-12px_32px_rgb(23_20_18/0.28)] @4xl:mt-0 @4xl:w-[min(528px,44%)] @4xl:flex-none @4xl:rounded-[32px] @4xl:py-12 @4xl:shadow-none"
      >
        <div className="flex w-full max-w-[340px] flex-col items-center @4xl:max-w-[258px]">
          <Link to="/board" aria-label="Oreum · 메인보드로 가기" className="rounded">
            <img src={logo} alt="" width={29.58} height={34.11} />
          </Link>

          <form noValidate className="mt-8 flex w-full flex-col items-center gap-6 @4xl:mt-[45px] @4xl:gap-7" onSubmit={submit}>
            <div className="flex w-full flex-col gap-3 @4xl:gap-4">
              <div>
                <label>
                  <span className="sr-only">이메일</span>
                  <input
                    ref={emailRef}
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="이메일"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
                    }}
                    aria-invalid={errors.email ? true : undefined}
                    aria-describedby={errors.email ? `${id}-email` : undefined}
                    className={`${INPUT} ${errors.email ? 'border-blocked!' : ''}`}
                  />
                </label>
                {errors.email && (
                  <p id={`${id}-email`} className={ERROR}>
                    {errors.email}
                  </p>
                )}
              </div>
              <div>
                <label>
                  <span className="sr-only">비밀번호</span>
                  <input
                    ref={passwordRef}
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    placeholder="비밀번호"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
                    }}
                    aria-invalid={errors.password ? true : undefined}
                    aria-describedby={errors.password ? `${id}-password` : undefined}
                    className={`${INPUT} ${errors.password ? 'border-blocked!' : ''}`}
                  />
                </label>
                {errors.password && (
                  <p id={`${id}-password`} className={ERROR}>
                    {errors.password}
                  </p>
                )}
              </div>
            </div>
            <div className="flex w-full flex-col items-center">
              <button
                type="submit"
                disabled={busy}
                aria-busy={busy || undefined}
                className="h-12 w-full rounded-2xl bg-primary text-[15px] font-medium tracking-[-0.006em] text-on-primary hover:brightness-125 disabled:opacity-60 @4xl:h-[34px] @4xl:text-xs @4xl:font-normal"
              >
                {busy ? '로그인하는 중…' : '로그인 하기'}
              </button>
              {/* 서버가 알려 준 오류 (비밀번호가 틀림 · 연결 실패 등) */}
              <p role="alert" className={errors.form ? ERROR : 'sr-only'}>
                {errors.form}
              </p>
            </div>
          </form>

          <p className="mt-[11px] text-base font-medium tracking-[-0.006em] text-muted">or</p>

          <button
            type="button"
            disabled={busy}
            onClick={() => void run(signInWithGoogle)}
            className="mt-[11px] flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface text-[15px] font-medium tracking-[-0.006em] text-ink hover:bg-fill-2 disabled:opacity-60 @4xl:h-[34px] @4xl:text-xs"
          >
            {/* 구글 로고: 피그마와 같이 마스크(글자 G 모양) 안에 색 그림을 넣음 */}
            <span
              aria-hidden
              className="block h-[20.37px] w-[19.96px] shrink-0"
              style={{ maskImage: `url("${googleMask}")`, WebkitMaskImage: `url("${googleMask}")`, maskSize: '100% 100%', WebkitMaskSize: '100% 100%' }}
            >
              <img src={google} alt="" className="block size-full" />
            </span>
            구글로 로그인하기
          </button>

          <ul className="mt-4 flex flex-col items-center gap-1 @4xl:mt-[12px] @4xl:gap-2">
            <li>
              <button type="button" onClick={soon('회사 / 학교 계정 로그인')} className={TEXT_LINK}>
                회사 / 학교 계정으로 로그인 하기
              </button>
            </li>
            <li>
              <button type="button" onClick={soon('비밀번호 재설정')} className={TEXT_LINK}>
                비밀번호 재설정하기
              </button>
            </li>
            <li>
              <button type="button" onClick={soon('회원 가입')} className={TEXT_LINK}>
                회원 가입하기
              </button>
            </li>
          </ul>
        </div>
      </section>
    </div>
  )
}

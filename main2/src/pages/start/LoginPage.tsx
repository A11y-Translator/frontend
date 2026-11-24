// Figma: 시작하기/login (1094:5922) — 산 사진 위 "Oreum 시작하기" + 오른쪽 로그인 패널.
// 로그인은 api.auth 를 거칩니다 (@/data/sessionStore). 목업 모드에서는 아무 이메일 · 비밀번호로나 들어가고,
// 구글로 로그인하기는 예시 사용자로 들어가요. 로그인되면 라우터(GuestOnly)가 시작하기(/start)로 보냅니다.
import { useId, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { errorMessage } from '@/api/http'
import { signIn, signInWithGoogle } from '@/data/sessionStore'
import logo from '@/assets/logo-oreum.svg'
import google from '@/assets/google.svg'
import googleMask from '@/assets/google-mask.svg'
import { useSoon } from '@/ui/toast'

const INPUT =
  'h-10 w-full rounded-xl border border-line bg-fill px-[17px] text-xs tracking-[-0.006em] text-ink outline-none placeholder:text-[#c1c1c1] focus-visible:border-summit'
const TEXT_LINK = 'text-xs tracking-[-0.006em] text-muted hover:text-ink hover:underline'

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
    <div className="flex min-h-full w-full flex-col @4xl:flex-row">
      {/* 소개 문구 */}
      <div className="flex flex-1 flex-col justify-center gap-1.5 px-[clamp(20px,4.3cqw,53px)] py-10">
        <h1 className="text-[clamp(30px,1.2rem+2.4cqw,48px)] leading-tight font-semibold tracking-[-0.02em] text-ink">Oreum 시작하기</h1>
        <p className="max-w-[560px] text-[clamp(15px,0.8rem+0.6cqw,20px)] text-[#c9ccd1] [text-shadow:0_1px_12px_rgb(0_0_0/0.6)]">
          기획안을 기반으로 원정대의 루트를 생성하고, 소통하도록 돕습니다.
        </p>
      </div>

      {/* 로그인 패널 */}
      <section
        aria-label="로그인"
        className="flex shrink-0 flex-col items-center justify-center bg-black/50 px-6 py-12 backdrop-blur-xl @4xl:w-[min(540px,44%)] @4xl:rounded-l-[30px]"
      >
        <div className="flex w-full max-w-[258px] flex-col items-center">
          <Link to="/board" aria-label="Oreum · 메인보드로 가기" className="rounded">
            <img src={logo} alt="" width={30.44} height={34.11} />
          </Link>

          <form noValidate className="mt-[45px] flex w-full flex-col items-center gap-7" onSubmit={submit}>
            <div className="flex w-full flex-col gap-4">
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
                className="h-[34px] w-full rounded-full bg-summit text-xs tracking-[-0.006em] text-on-summit hover:brightness-105 disabled:opacity-60"
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
            className="mt-[11px] flex h-[34px] w-full items-center justify-center gap-2 rounded-xl border border-line bg-fill text-xs font-medium tracking-[-0.006em] text-ink hover:bg-fill-3 disabled:opacity-60"
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

          <ul className="mt-[12px] flex flex-col items-center gap-2">
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

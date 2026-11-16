// Figma: A11Y_LOG_001 (533:7372) — 로그인. WebLayout 없이 단독으로 렌더됩니다.
// 피그마(폼 폭 258px · 글자 12px)는 실제 크기로 보면 작아서, 구조는 그대로 두고 일반 웹 로그인 크기(폭 340px · 입력칸 48px · 글자 15px)로 키웠어요.
// 컴포넌트 btn: login-unavailable(회색) / login-available(검정) — 이메일·비밀번호를 모두 채워야 활성화.
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import brandGoogle from '@/web/assets/brand-google.svg'

const FIELD =
  'h-12 w-full rounded-xl bg-[#f1f1f1] px-4 text-[15px] text-black placeholder:text-subtle'

const MORE_LINKS = ['회사 / 학교 계정으로 로그인 하기', '비밀번호 재설정하기', '회원 가입하기']

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [notice, setNotice] = useState('')
  const available = email.trim() !== '' && password !== ''

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!available) return
    navigate('/')
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-white px-5 py-16 font-pretendard">
      <div className="flex w-full max-w-[340px] flex-col items-center">
        <h1 className="text-center text-[26px] leading-[1.4] font-semibold tracking-[-0.01em] text-black">A11y Translator 시작하기</h1>

        <form onSubmit={onSubmit} className="mt-8 flex w-full flex-col gap-6">
          <div className="flex flex-col gap-3">
            <label className="flex flex-col">
              <span className="sr-only">이메일</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={FIELD}
              />
            </label>
            <label className="flex flex-col">
              <span className="sr-only">비밀번호</span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={FIELD}
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={!available}
            aria-describedby={available ? undefined : 'login-hint'}
            className={`h-12 w-full rounded-xl text-[15px] font-semibold text-white ${
              available ? 'bg-black hover:bg-ink-3' : 'cursor-not-allowed bg-[#80858a]'
            }`}
          >
            로그인 하기
          </button>
          <p id="login-hint" className="sr-only">
            이메일과 비밀번호를 모두 입력하면 로그인할 수 있어요.
          </p>
        </form>

        <p aria-hidden className="mt-5 text-center text-sm font-medium text-[#969696]">
          or
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-black bg-white text-[15px] font-semibold text-black hover:bg-web-chip"
        >
          <img src={brandGoogle} alt="" width={24} height={24} />
          구글로 로그인하기
        </button>

        <ul className="mt-6 flex flex-col items-center gap-2.5">
          {MORE_LINKS.map((label) => (
            <li key={label}>
              <button
                type="button"
                onClick={() => setNotice(`'${label}'는 아직 준비 중이에요.`)}
                className="rounded text-[13px] text-[#175fc2] hover:underline"
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
        <p role="status" className="mt-3 min-h-5 text-center text-[13px] text-muted">
          {notice}
        </p>
      </div>
    </main>
  )
}

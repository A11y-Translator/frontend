import { useEffect, useRef, type ReactNode } from 'react'
import logo from '@/shared/assets/figma/logo.png'
import more from '@/shared/assets/figma/more.svg'
import clock from '@/shared/assets/figma/clock.svg'
import external from '@/shared/assets/figma/external.svg'
import refresh from '@/shared/assets/figma/refresh-blue.svg'
import success from '@/shared/assets/figma/success.svg'
import blocked from '@/shared/assets/figma/blocked.svg'
import done from '@/shared/assets/figma/done.svg'
import now from '@/shared/assets/figma/now.svg'
import wait from '@/shared/assets/figma/wait.svg'
import importantDot from '@/shared/assets/figma/important-dot.svg'
import normalDot from '@/shared/assets/figma/normal-dot.svg'
import './inspection-popup.css'

export type PopupScreen =
  'login' | 'ready' | 'scanning' | 'result' | 'empty' | 'unsupported' | 'error' | 'needAccess'

interface Props {
  screen: PopupScreen
  title?: string
  url?: string
  account?: string
  projects?: { id: string; name: string }[]
  projectId?: string
  onProjectChange?: (id: string) => void
  version?: number
  lastScan?: string
  scannedAt?: string
  total?: number
  important?: number
  categories?: { label: string; count: number; important?: boolean }[]
  progress?: number
  currentStep?: number
  message?: string
  notice?: string
  primaryLabel?: string
  primaryDisabled?: boolean
  primaryHint?: string
  onPrimary: () => void
  onRescan?: () => void
  menu?: ReactNode
}

const steps = [
  '대체 텍스트',
  '색상 대비',
  '키보드 접근',
  '입력폼 레이블',
  'ARIA 속성',
  '제목·랜드마크 구조',
]

/** Figma Chrome extension · 수정안. 실제 확장과 웹 시연에서 같은 화면을 사용한다. */
export function InspectionPopup({
  screen,
  title = '',
  url = '',
  account,
  projects = [],
  projectId,
  onProjectChange,
  version,
  lastScan,
  scannedAt,
  total = 0,
  important = 0,
  categories = [],
  progress,
  currentStep,
  message,
  notice,
  primaryLabel,
  primaryDisabled,
  primaryHint,
  onPrimary,
  onRescan,
  menu,
}: Props) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    heading.current?.focus()
  }, [screen])
  const result = screen === 'result' || screen === 'empty'
  const project = projects.find((p) => p.id === projectId)
  const completed = currentStep
  const labels: Record<PopupScreen, string> = {
    login: 'Google 계정으로 계속하기',
    ready: '이 페이지 검사하기',
    scanning: '검사 취소',
    result: '웹에서 확인하고 고치기',
    empty: '웹에서 결과 보기',
    unsupported: 'A11y 웹 열기',
    error: '다시 시도',
    needAccess: '이 사이트 검사 허용',
  }

  return (
    <div className={`inspection-popup ${screen === 'login' ? 'inspection-popup--login' : ''}`}>
      <header className="inspection-popup__header">
        <div className="inspection-popup__brand">
          <img src={logo} alt="" width="24" height="25" />
          <span>A11y</span>
        </div>
        {screen !== 'login' && (account || menu) && (
          <div className="inspection-popup__account">
            {account && (
              <span className="inspection-popup__avatar" aria-label={`${account} 계정`}>
                {account.slice(0, 1)}
              </span>
            )}
            {menu && (
              <details className="inspection-popup__menu">
                <summary aria-label="더 보기">
                  <img src={more} alt="" width="20" height="20" />
                </summary>
                <div>{menu}</div>
              </details>
            )}
          </div>
        )}
      </header>
      <main
        className={`inspection-popup__body ${screen === 'login' || screen === 'unsupported' ? 'inspection-popup__body--center' : ''}`}
        aria-busy={screen === 'scanning'}
      >
        {screen === 'login' && (
          <section className="inspection-popup__welcome">
            <img src={logo} alt="" width="80" height="83" />
            <h1 ref={heading} tabIndex={-1}>
              로그인하고 검사해 보세요
            </h1>
            <p>검사 결과를 팀과 함께 보고 고칠 수 있어요</p>
          </section>
        )}
        {screen === 'ready' && (
          <>
            <section className="inspection-popup__card">
              <h1 ref={heading} tabIndex={-1} className="inspection-popup__label">
                검사할 페이지
              </h1>
              <div className="inspection-popup__page">
                <span aria-hidden className="inspection-popup__favicon">
                  {title.slice(0, 1).toUpperCase() || 'W'}
                </span>
                <div>
                  <strong>{title || '현재 탭'}</strong>
                  <p title={url}>{url.replace(/^https?:\/\//, '')}</p>
                </div>
              </div>
            </section>
            <section className="inspection-popup__card">
              <label htmlFor="popup-project" className="inspection-popup__label">
                저장할 프로젝트
              </label>
              <select
                id="popup-project"
                value={projectId ?? ''}
                onChange={(e) => onProjectChange?.(e.target.value)}
                disabled={!onProjectChange || !projects.length}
              >
                {projects.length ? (
                  projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))
                ) : (
                  <option value="">프로젝트 연결 전 · 로컬 검사</option>
                )}
              </select>
              <p className="inspection-popup__label">
                {version ? `버전 ${version}로 저장돼요` : '검사 결과는 이 브라우저에만 보관돼요'}
              </p>
            </section>
            {lastScan && (
              <p className="inspection-popup__last">
                <img src={clock} alt="" width="14" height="14" />
                지난 검사 · {lastScan}
              </p>
            )}
          </>
        )}
        {screen === 'scanning' && (
          <section className="inspection-popup__card inspection-popup__progress">
            <div className="inspection-popup__progress-title">
              <div>
                <h1 ref={heading} tabIndex={-1}>
                  검사 중이에요
                </h1>
                <p>페이지를 그대로 두세요</p>
              </div>
              <strong>{progress === undefined ? '…' : `${progress}%`}</strong>
            </div>
            <div
              role="progressbar"
              aria-label="검사 진행률"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              className={`inspection-popup__track ${progress === undefined ? 'inspection-popup__track--busy' : ''}`}
            >
              <span style={{ width: progress === undefined ? '42%' : `${progress}%` }} />
            </div>
            <ul>
              {steps.map((step, index) => (
                <li
                  key={step}
                  className={completed === undefined || index > completed ? 'is-waiting' : ''}
                >
                  <img
                    src={
                      completed === undefined
                        ? wait
                        : index < completed
                          ? done
                          : index === completed
                            ? now
                            : wait
                    }
                    alt={
                      completed === undefined
                        ? '검사 대상'
                        : index < completed
                          ? '완료'
                          : index === completed
                            ? '검사 중'
                            : '대기'
                    }
                    width="18"
                    height="18"
                  />
                  {step}
                </li>
              ))}
            </ul>
            {progress === undefined && (
              <p className="inspection-popup__label">전체 자동 규칙을 검사하고 있어요.</p>
            )}
          </section>
        )}
        {result && (
          <>
            <section className="inspection-popup__card">
              <div className="inspection-popup__result-meta">
                <p>
                  {scannedAt || '방금 검사'}
                  {project ? ` · ${project.name}` : ''}
                  {version ? ` 버전 ${version}` : ''}
                </p>
                {onRescan && (
                  <button type="button" onClick={onRescan}>
                    <img src={refresh} alt="" width="16" height="16" />
                    다시 검사
                  </button>
                )}
              </div>
              {screen === 'empty' ? (
                <h1 ref={heading} tabIndex={-1} className="inspection-popup__empty">
                  <img src={success} alt="" width="40" height="40" />
                  자동 검사에서 이슈를 찾지 못했어요
                </h1>
              ) : (
                <>
                  <h1 ref={heading} tabIndex={-1} className="inspection-popup__total">
                    <strong>{total}</strong>개 이슈를 찾았어요
                  </h1>
                  <div className="inspection-popup__severity-bar">
                    <span style={{ width: `${total ? (important / total) * 100 : 0}%` }} />
                  </div>
                  <div className="inspection-popup__legend">
                    <span>
                      <img src={importantDot} alt="" width="8" height="8" />
                      중요 <b>{important}</b>
                    </span>
                    <span>
                      <img src={normalDot} alt="" width="8" height="8" />
                      보통 <b>{total - important}</b>
                    </span>
                  </div>
                </>
              )}
            </section>
            {screen === 'empty' ? (
              <section className="inspection-popup__info">
                <h2>수동 점검도 해 보세요</h2>
                <p>
                  화면 낭독기 흐름이나 키보드 순서처럼
                  <br />
                  자동으로 확인할 수 없는 항목이 있어요
                </p>
              </section>
            ) : (
              <section className="inspection-popup__card">
                <h2>유형별</h2>
                <ul className="inspection-popup__categories">
                  {categories.slice(0, 4).map((c) => (
                    <li key={c.label}>
                      <span>
                        {c.label} {c.important && <small>중요</small>}
                      </span>
                      <strong>{c.count}개</strong>
                    </li>
                  ))}
                  {categories.length > 4 && (
                    <li>
                      <span className="inspection-popup__label">
                        외 {categories.length - 4}개 유형
                      </span>
                      <strong>{categories.slice(4).reduce((n, c) => n + c.count, 0)}개</strong>
                    </li>
                  )}
                </ul>
              </section>
            )}
          </>
        )}
        {screen === 'unsupported' && (
          <section className="inspection-popup__blocked">
            <span>
              <img src={blocked} alt="" width="32" height="32" />
            </span>
            <h1 ref={heading} tabIndex={-1}>
              이 페이지는 검사할 수 없어요
            </h1>
            <p>
              새 탭이나 Chrome 설정 같은
              <br />
              브라우저 페이지는 검사할 수 없어요
            </p>
          </section>
        )}
        {(screen === 'error' || screen === 'needAccess') && (
          <section className="inspection-popup__card">
            <h1 ref={heading} tabIndex={-1}>
              {screen === 'error' ? '검사하지 못했어요' : '이 사이트에 접근 허용이 필요해요'}
            </h1>
            <p>{message}</p>
          </section>
        )}
        {notice && (
          <p role="status" className="inspection-popup__label">
            {notice}
          </p>
        )}
      </main>
      <footer className="inspection-popup__footer">
        <button
          type="button"
          onClick={onPrimary}
          disabled={primaryDisabled}
          title={primaryHint}
          className={`inspection-popup__primary ${screen === 'scanning' || screen === 'unsupported' ? 'inspection-popup__primary--secondary' : ''}`}
        >
          {primaryLabel ?? labels[screen]}
          {result && <img src={external} alt="" width="16" height="16" />}
        </button>
        {screen === 'login' && (
          <p className="inspection-popup__terms">
            계속하면 이용약관과 개인정보 처리방침에 동의하게 돼요
          </p>
        )}
        {primaryHint && <p className="inspection-popup__terms">{primaryHint}</p>}
      </footer>
    </div>
  )
}

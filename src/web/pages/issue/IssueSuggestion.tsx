import type { Issue } from '@/shared/api/types'
import { CopyButton } from './CopyButton'

export function IssueSuggestion({
  issue,
  codeIsEvidence,
}: {
  issue: Issue
  codeIsEvidence: boolean
}) {
  const options = issue.fixOptions ?? []
  const color = issue.detail?.match(/#[0-9a-f]{6}/i)?.[0]
  const ratio = issue.detail?.match(/(\d+(?:\.\d+)?):1/)?.[1]
  return (
    <div className="prototype-suggestion">
      <h3>{options.length ? '글자색을 제안 색으로 바꾸면 해결' : issue.title}</h3>
      <p>{issue.detail ?? issue.impact}</p>
      {options.length > 0 && (
        <div className="prototype-suggestion-table">
          <div>
            <h4>적용 요소</h4>
            {options.map((option) => (
              <div key={option.color}>{option.label}</div>
            ))}
          </div>
          <div className="prototype-current">
            <h4>현재 상태</h4>
            {options.map((option) => (
              <div key={option.color}>
                {color ? (
                  <>
                    <span className="prototype-color" style={{ background: color }} />
                    {color} {ratio && <em>{ratio} : 1</em>}
                  </>
                ) : (
                  '검사 근거 참고'
                )}
              </div>
            ))}
          </div>
          <span aria-hidden className="prototype-suggestion-arrow">
            →
          </span>
          <div className="prototype-proposed">
            <h4>제안</h4>
            {options.map((option) => (
              <div key={option.color}>
                <span className="prototype-color" style={{ background: option.color }} />
                <b>{option.color}</b>
                <strong>{option.ratio}</strong>
                <CopyButton text={option.color} what={option.color} />
              </div>
            ))}
          </div>
        </div>
      )}
      {issue.savedFix && (
        <div className="prototype-saved-fix">
          <b>저장한 수정안</b>
          <code>{issue.savedFix}</code>
          <CopyButton text={issue.savedFix} what="저장한 수정안" />
        </div>
      )}
      {issue.fixCode && (
        <div className="prototype-saved-fix">
          <b>{codeIsEvidence ? '검사한 요소 HTML' : '개발자에게 전달할 코드'}</b>
          <pre>
            <code>{issue.fixCode}</code>
          </pre>
          <CopyButton text={issue.fixCode} what={codeIsEvidence ? '요소 HTML' : '수정 코드'} />
        </div>
      )}
      {!options.length && !issue.savedFix && (!issue.fixCode || codeIsEvidence) && (
        <p className="prototype-suggestion-note">
          자동 수정안이 없는 항목이에요. 검사 근거와 문제 위치를 확인해 직접 수정해 주세요.
        </p>
      )}
    </div>
  )
}

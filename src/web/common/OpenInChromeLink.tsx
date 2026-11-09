// Header 오른쪽 "크롬에서 열기" — 확장 데모 화면(/extension)으로 가는 단순 링크.
// (Header 컴포넌트 설명: "프로젝트·버전 전환, 검사 상태, 크롬에서 열기")
import { Link } from 'react-router-dom'

export function OpenInChromeLink() {
  return (
    <Link
      to="/extension"
      className="flex shrink-0 items-center rounded-full border border-ext-line bg-white px-4 py-2 font-noto text-sm leading-[1.4] font-bold whitespace-nowrap text-black hover:bg-web-chip"
    >
      크롬에서 열기
    </Link>
  )
}

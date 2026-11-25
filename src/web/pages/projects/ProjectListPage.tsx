// 프로젝트 목록 — 왼쪽 메뉴의 폴더 아이콘. 프로젝트만 모아 보고, 최근 수정순 · 생성일순으로 정렬해요.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppState } from '@/shared/store'
import { useAnnouncer } from '@/web/common/useAnnouncer'
import { LiveToast } from '@/web/common/LiveToast'
import { PROJECT_SORTS, createdLabel, sortProjects, type ProjectSort } from '@/web/common/projectSort'
import { ProjectFolderCard } from '@/web/pages/home/ProjectFolderCard'

const SORT_KEY = 'a11y-translator:project-sort'
const readSort = (): ProjectSort => {
  try {
    const v = localStorage.getItem(SORT_KEY)
    return PROJECT_SORTS.some((s) => s.value === v) ? (v as ProjectSort) : 'recent'
  } catch {
    return 'recent'
  }
}

export default function ProjectListPage() {
  const { projects } = useAppState()
  const [sort, setSort] = useState<ProjectSort>(readSort)
  const [message, announce] = useAnnouncer()
  const list = sortProjects(projects, sort)
  const changeSort = (v: ProjectSort) => {
    setSort(v)
    try {
      localStorage.setItem(SORT_KEY, v)
    } catch {
      /* 저장 못 해도 정렬은 돼요 */
    }
  }
  return (
    <div className="prototype-page">
      <div className="prototype-section-heading">
        <h1 className="text-[28px] font-bold">
          프로젝트 <span className="text-[#8a8f98]">{projects.length}</span>
        </h1>
        <div className="flex items-center gap-2">
          <label className="prototype-select">
            <span className="sr-only">정렬</span>
            <select value={sort} onChange={(e) => changeSort(e.target.value as ProjectSort)}>
              {PROJECT_SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <Link to="/projects/new" className="rounded-xl bg-black px-4 py-2.5 text-sm font-semibold whitespace-nowrap text-white hover:bg-[#333]">
            ＋ 새 프로젝트
          </Link>
        </div>
      </div>
      {list.length ? (
        <ul className="prototype-project-grid prototype-project-grid--all">
          {list.map((p, index) => (
            <ProjectFolderCard key={p.id} project={p} index={index} announce={announce} extra={`${createdLabel(p)} 생성`} />
          ))}
        </ul>
      ) : (
        <Link className="prototype-empty" to="/projects/new">
          ＋ 새 프로젝트 만들기
        </Link>
      )}
      <LiveToast message={message} />
    </div>
  )
}

// 프로젝트 폴더 카드 — 홈(최근 4개)과 프로젝트 목록 화면이 같이 써요
import { Link } from 'react-router-dom'
import type { Project } from '@/shared/api/types'
import { memberById } from '@/shared/mocks'
import { useAppState } from '@/shared/store'
import { ProjectCardMenu } from './ProjectCardMenu'
import folderBack from '@/web/assets/prototype-folder-back.svg'
import folderGlass from '@/web/assets/prototype-folder-glass.svg'
import folderGrayBack from '@/web/assets/prototype-folder-gray-back.svg'
import folderGrayGlass from '@/web/assets/prototype-folder-gray-glass.svg'
import folderHighlight from '@/web/assets/prototype-folder-highlight.svg'

export function ProjectFolderCard({
  project: p,
  index,
  announce,
  extra,
}: {
  project: Project
  /** 짝수·홀수 번째 카드 색을 번갈아 */
  index: number
  announce: (message: string) => void
  /** 카드 아래 한 줄 더 (예: 생성일) */
  extra?: string
}) {
  const state = useAppState()
  const projectIssues = state.inspections[p.id]?.issues ?? state.issues.filter((i) => i.version === p.currentVersion)
  const people = [...new Set(projectIssues.flatMap((i) => (i.assigneeId ? [i.assigneeId] : [])))].slice(0, 2)
  const solved = projectIssues.filter((i) => i.status === 'resolved').length
  const progress = projectIssues.length ? Math.round((solved / projectIssues.length) * 100) : 0
  return (
    <li>
      <Link to={`/projects/${p.id}/inspection`} className="prototype-folder-link">
        <div className="prototype-folder" aria-hidden="true">
          <img className="prototype-folder-back" src={index % 2 === 0 ? folderBack : folderGrayBack} alt="" />
          <span className="prototype-folder-paper" />
          <img className="prototype-folder-front" src={index % 2 === 0 ? folderGlass : folderGrayGlass} alt="" />
          <img className="prototype-folder-front" src={folderHighlight} alt="" />
          <span className="prototype-folder-avatars">
            {people.map((id) => (
              <span key={id}>{memberById(id)?.initial}</span>
            ))}
          </span>
          <span className="prototype-folder-date">{p.updatedAt} 수정</span>
        </div>
        <span className="prototype-folder-label">
          <b>{p.name}</b>
          <small>{p.status === 'active' ? '진행중' : '완료됨'}</small>
        </span>
        {/* 자세한 진행도(3D 산)는 프로젝트 화면에서 */}
        <span className="mt-1 flex flex-wrap gap-x-2 text-xs text-[#626873]">
          <span className="whitespace-nowrap">
            {projectIssues.length ? `이슈 ${solved}/${projectIssues.length} 해결 · ${progress}%` : '검사 전'}
          </span>
          {extra && <span className="whitespace-nowrap">{extra}</span>}
        </span>
      </Link>
      <div className="prototype-folder-menu">
        <ProjectCardMenu project={p} versions={state.inspectionHistory[p.id]?.length ?? 0} announce={announce} />
      </div>
    </li>
  )
}

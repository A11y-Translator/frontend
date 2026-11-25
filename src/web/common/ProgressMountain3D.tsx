// 프로젝트 진행도 — 입체 등고선 산 (three.js 로 그 자리에서 그림, 이미지 파일 아님)
// Oreum(오름)의 "프로젝트 루트" 산 모양을 접근성 프로젝트에 맞게 옮긴 것.
//  - 산 높이 = 해결률: 바닥(0%)에서 정상(100%)까지 산길(루트)을 따라 올라가요
//  - 지나온 길은 파란 실선, 남은 길은 회색 점선
//  - 버전마다 그때의 해결률 위치에 핀(v1, v2 …), 지금 위치에는 깃발
//  - 마우스/터치로 끌면 돌려 볼 수 있어요 (확대·이동은 꺼 둠)
// 화면낭독기에는 그림 대신 요약 문장(role="img" + aria-label)으로 알려 줘요.
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export interface ProgressMilestone {
  /** 핀 글자 (예: v3) */
  label: string
  /** 그때의 해결률 0~100 */
  percent: number
}

interface Props {
  /** 지금 해결률 0~100 */
  percent: number
  /** 지난 버전들의 해결률 (오래된 것 → 최근 순) */
  milestones?: ProgressMilestone[]
  /** 프로젝트마다 산 모양이 조금씩 다르게 (프로젝트 id 등 아무 글자) */
  seedKey?: string
  /** 화면낭독기용 요약 */
  label: string
  className?: string
}

const LEVELS = 22
const SEGMENTS = 140
const HEIGHT = 1.15
const RADIUS = 1.6
const COLOR = { contour: 0xbfc5ce, body: 0xffffff, done: 0x1d4ed8, todo: 0x6b7280 }

/** 문자열 → 숫자 씨앗 (프로젝트 id 로 산 모양 고정) */
function seedOf(text: string) {
  let h = 0
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) % 997
  return h / 10
}

function buildMountain(seed: number) {
  const k = seed * 1.7
  const radiusAt = (t: number, theta: number) => {
    const u = 1 - t
    const profile = 0.85 * Math.pow(u, 1.1) + 0.15 * u
    const bump =
      1 +
      0.09 * Math.sin(3 * theta + 1.3 + 2.5 * t + k) +
      0.05 * Math.sin(5 * theta + 2.1 - 3 * t + k * 2.3) +
      0.025 * Math.sin(11 * theta + 6 * t + k * 0.7)
    return RADIUS * profile * bump
  }
  const surfacePoint = (t: number, theta: number, lift = 0) => {
    const r = radiusAt(t, theta) + lift
    const y = t * HEIGHT + (1 - t) * t * 0.05 * Math.sin(4 * theta + 9 * t + k)
    return new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta))
  }
  /** 산길: 높이 t 에서의 방향 — 정면(90°) 둘레를 지그재그로 오르며, 위로 갈수록 폭이 좁아져요 */
  const routeAngle = (t: number) => ((90 + 48 * Math.sin(t * Math.PI * 2.4 + 0.6) * (1 - 0.75 * t)) * Math.PI) / 180
  const routePoint = (t: number) => surfacePoint(t, routeAngle(t), 0.012)
  return { surfacePoint, routePoint }
}

export function ProgressMountain3D({ percent, milestones = [], seedKey = '', label, className = '' }: Props) {
  const seed = seedOf(seedKey)
  const wrapRef = useRef<HTMLDivElement>(null)
  const pinRefs = useRef<(HTMLSpanElement | null)[]>([])
  const [failed, setFailed] = useState(false)
  const p = Math.max(0, Math.min(100, percent)) / 100
  // 핀: 지난 버전들 + 지금 위치 + 정상
  const pins = [
    ...milestones.map((m) => ({ kind: 'milestone' as const, text: m.label, t: Math.max(0, Math.min(1, m.percent / 100)) })),
    { kind: 'now' as const, text: `지금 ${Math.round(p * 100)}%`, t: p },
    { kind: 'summit' as const, text: '정상 100%', t: 1 },
  ]
  const pinKey = pins.map((x) => `${x.kind}${x.t}`).join('|')

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      setFailed(true)
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.domElement.setAttribute('aria-hidden', 'true')
    renderer.domElement.style.display = 'block'
    wrap.prepend(renderer.domElement)

    const scene = new THREE.Scene()
    const disposables: { dispose: () => void }[] = []
    const keep = <T extends { dispose: () => void }>(x: T) => (disposables.push(x), x)
    const { surfacePoint, routePoint } = buildMountain(seed)

    // 등고선
    const contourMat = keep(new THREE.LineBasicMaterial({ color: COLOR.contour }))
    for (let i = 0; i < LEVELS; i++) {
      const t = i / LEVELS
      const pts: THREE.Vector3[] = []
      for (let s = 0; s < SEGMENTS; s++) pts.push(surfacePoint(t, (s / SEGMENTS) * Math.PI * 2))
      scene.add(new THREE.LineLoop(keep(new THREE.BufferGeometry().setFromPoints(pts)), contourMat))
    }
    // 가림 면 (산 뒤편 선이 비치지 않게 흰 몸통)
    const positions: number[] = []
    const index: number[] = []
    for (let i = 0; i <= LEVELS; i++) {
      for (let s = 0; s < SEGMENTS; s++) {
        const v = surfacePoint(i / LEVELS, (s / SEGMENTS) * Math.PI * 2, -0.006)
        positions.push(v.x, v.y, v.z)
      }
    }
    for (let i = 0; i < LEVELS; i++) {
      for (let s = 0; s < SEGMENTS; s++) {
        const a = i * SEGMENTS + s
        const b = i * SEGMENTS + ((s + 1) % SEGMENTS)
        const c = (i + 1) * SEGMENTS + s
        const d = (i + 1) * SEGMENTS + ((s + 1) % SEGMENTS)
        index.push(a, c, b, b, c, d)
      }
    }
    const bodyGeo = keep(new THREE.BufferGeometry())
    bodyGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    bodyGeo.setIndex(index)
    const bodyMat = keep(
      new THREE.MeshBasicMaterial({ color: COLOR.body, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }),
    )
    scene.add(new THREE.Mesh(bodyGeo, bodyMat))

    // 산길: 지나온 길(실선) · 남은 길(점선)
    const sample = (from: number, to: number) => {
      const n = Math.max(2, Math.round((to - from) * 160))
      return Array.from({ length: n + 1 }, (_, i) => routePoint(from + ((to - from) * i) / n))
    }
    if (p > 0) {
      const doneGeo = keep(new THREE.BufferGeometry().setFromPoints(sample(0, p)))
      scene.add(new THREE.Line(doneGeo, keep(new THREE.LineBasicMaterial({ color: COLOR.done, linewidth: 2 }))))
    }
    if (p < 1) {
      const todoGeo = keep(new THREE.BufferGeometry().setFromPoints(sample(p, 1)))
      const todo = new THREE.Line(todoGeo, keep(new THREE.LineDashedMaterial({ color: COLOR.todo, dashSize: 0.06, gapSize: 0.04 })))
      todo.computeLineDistances()
      scene.add(todo)
    }

    // 카메라 · 돌려 보기
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50)
    const target = new THREE.Vector3(0, HEIGHT * 0.36, 0)
    const dist = 4.7
    const tilt = (22 * Math.PI) / 180
    const az = (90 * Math.PI) / 180
    camera.position.set(Math.cos(az) * Math.cos(tilt) * dist, target.y + Math.sin(tilt) * dist, Math.sin(az) * Math.cos(tilt) * dist)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.copy(target)
    controls.enableZoom = false
    controls.enablePan = false
    controls.minPolarAngle = Math.PI * 0.25
    controls.maxPolarAngle = Math.PI * 0.47
    controls.update()

    const pinPoints = pins.map((x) => routePoint(x.t).add(new THREE.Vector3(0, 0.02, 0)))
    const v = new THREE.Vector3()
    const render = () => {
      renderer.render(scene, camera)
      const w = wrap.clientWidth
      const h = wrap.clientHeight
      pinPoints.forEach((pt, i) => {
        const el = pinRefs.current[i]
        if (!el) return
        v.copy(pt).project(camera)
        el.style.transform = `translate(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px)`
      })
    }
    const resize = () => {
      const w = wrap.clientWidth
      const h = wrap.clientHeight
      if (!w || !h) return
      renderer.setSize(w, h, false)
      renderer.domElement.style.width = `${w}px`
      renderer.domElement.style.height = `${h}px`
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      render()
    }
    controls.addEventListener('change', render)
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    resize()

    return () => {
      ro.disconnect()
      controls.dispose()
      disposables.forEach((d) => d.dispose())
      renderer.dispose()
      renderer.domElement.remove()
    }
    // pins 는 pinKey 로 비교 (매 렌더 새 배열이라)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, p, pinKey])

  return (
    <div role="img" aria-label={label} className={`relative overflow-hidden ${className}`}>
      <div ref={wrapRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />
      {failed ? (
        <p className="absolute inset-0 flex items-center justify-center text-sm text-[#626873]">{label}</p>
      ) : (
        pins.map((x, i) => (
          <span
            key={`${x.kind}-${i}`}
            ref={(el) => {
              pinRefs.current[i] = el
            }}
            aria-hidden
            className="pointer-events-none absolute top-0 left-0"
          >
            <span
              className={`absolute bottom-1.5 left-0 -translate-x-1/2 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap shadow-sm ${
                x.kind === 'now'
                  ? 'bg-[#1d4ed8] text-white'
                  : x.kind === 'summit'
                    ? 'bg-black text-white'
                    : 'border border-[#d5d9df] bg-white text-[#3b3f46]'
              }`}
            >
              {x.kind === 'summit' ? '⛳ ' : x.kind === 'now' ? '⚑ ' : ''}
              {x.text}
            </span>
            <span
              className={`absolute -top-1 -left-1 size-2 rounded-full ring-2 ring-white ${x.kind === 'now' ? 'bg-[#1d4ed8]' : x.kind === 'summit' ? 'bg-black' : 'bg-[#9aa1ab]'}`}
            />
          </span>
        ))
      )}
    </div>
  )
}

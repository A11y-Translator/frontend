// 추천 루트의 "입체 등고선 산" — three.js 로 그 자리에서 그립니다 (이미지 파일 아님).
// Figma: Route / Mountain (1018:1382) "등고선 산 + 출발→정상 루트(점선)" 를 3D 로 옮긴 것.
//
// 그리는 순서
//  1) radiusAt(t, θ): 높이 t(0=바닥, 1=정상)와 방향 θ 에서 산의 반지름을 주는 "수식" → 산 모양
//  2) 등고선: 높이를 levels 단계로 나눠, 단계마다 한 바퀴 도는 닫힌 선
//  3) 가림 면: 같은 모양의 어두운 면을 안쪽에 깔아 산 뒤편 선이 비쳐 보이지 않게
//  4) 루트: 체크포인트 위치(stops)를 부드럽게 이어 산 표면 위에 흰 점선
//  5) 핀: 3D 좌표 → 화면 좌표로 바꿔 HTML 버튼을 얹음 (글자가 또렷하고 키보드·화면낭독기로도 쓸 수 있게)
//  6) OrbitControls: 평소에는 루트가 보이는 방향으로 멈춰 있고, 마우스/터치로 끌면 그때만 돌아가요
//
// 루트는 "데이터"로 정해집니다 → AI 가 추천한 체크포인트 목록이 바뀌면 산 위 루트·핀도 자동으로 바뀌어요.
//   <Mountain3D stops={makeRouteStops(체크포인트 목록)} shape={{ seed: 프로젝트마다 다른 숫자 }} … />
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import iconFlag from '@/assets/icon-flag.svg'
import pinFoot from '@/assets/pin-foot.svg'
import contoursSvg from '@/assets/mountain-contours.svg'
import routeSvg from '@/assets/mountain-route.svg'

/* ─────────────────────────────────────────────────────────────────────────────
 * ✏️ 실습 구역 — 숫자만 바꿔 저장하면 화면이 바로 바뀝니다 (npm run dev 켜 둔 상태에서)
 * ───────────────────────────────────────────────────────────────────────────── */
export interface MountainShape {
  /** 등고선 개수 (많을수록 촘촘) */
  levels: number
  /** 산 높이 */
  height: number
  /** 바닥 반지름 */
  radius: number
  /** 울퉁불퉁한 정도 (0 = 매끈한 원뿔, 1 = 기본, 2 = 거칠게) */
  bumpiness: number
  /** 봉우리 뾰족함 (클수록 위가 가늘고 아래가 넓음) */
  sharpness: number
  /** 산 모양을 바꾸는 씨앗 숫자 — 숫자가 다르면 굴곡이 다른 산이 돼요 (프로젝트마다 다른 산) */
  seed: number
}

export const DEFAULT_SHAPE: MountainShape = {
  levels: 26,
  height: 1.15,
  radius: 1.6,
  bumpiness: 1,
  sharpness: 1.1,
  seed: 0,
}

export const VIEW = {
  /** 처음 바라보는 방향(도). 90 = 정면 (루트가 보이는 쪽) */
  startAngle: 96,
  /** 내려다보는 각도(도). 클수록 위에서 봄 */
  tilt: 21,
  /** 자동 회전 속도. 0 = 멈춰 있고 끌 때만 돌아감 (기본). 1.2 로 바꾸면 약 50초에 한 바퀴 저절로 돕니다 */
  autoRotateSpeed: 0,
}
/* ───────────────────────────────────────────────────────────────────────────── */

/** 산 위의 한 지점: t = 높이(0 바닥 ~ 1 정상), angle = 위에서 봤을 때 방향(도, 90 = 정면) */
export interface RouteStop {
  id: string
  t: number
  angle: number
}

/**
 * 체크포인트 목록 → 산 위 위치를 자동으로 정합니다. (AI 추천 결과가 바뀌어도 그대로 넣으면 됨)
 *  - 개수: 몇 개든 가능 (피그마 메모 기준 최대 8개 권장)
 *  - weight: 그 구간이 얼마나 긴지(예: 예상 일수). 길수록 다음 체크포인트가 더 높이 떨어져 찍혀요. 없으면 균등.
 *  - 좌우로 지그재그(산길)하며 올라가고, 항상 정면에서 다 보이도록 앞쪽 면에만 놓습니다.
 * 결과: [출발('start'), …체크포인트(id 그대로), 정상('summit')]
 */
export function makeRouteStops(checkpoints: readonly { id: string; weight?: number }[]): RouteStop[] {
  const weights = [...checkpoints.map((c) => Math.max(0.2, c.weight ?? 1)), 1] // 마지막 1 = 마지막 체크포인트 → 정상
  const total = weights.reduce((a, b) => a + b, 0)
  const stops: RouteStop[] = [{ id: 'start', t: 0, angle: 158 }]
  let acc = 0
  checkpoints.forEach((c, i) => {
    acc += weights[i]
    const t = Math.min(0.9, (acc / total) * 0.98)
    const side = i % 2 === 0 ? 1 : -1 // 오른쪽·왼쪽 번갈아
    const spread = 36 - 20 * t // 위로 갈수록 좁게
    stops.push({ id: c.id, t, angle: 88 - side * spread })
  })
  stops.push({ id: 'summit', t: 1, angle: 80 })
  return stops
}

const SEGMENTS = 160 // 한 바퀴를 몇 개의 점으로 그릴지
const COLOR = { contour: 0xe9e9e4, ring: 0x9fc3d3, route: 0xffffff, body: 0x1d1f22 }
const rad = (deg: number) => (deg * Math.PI) / 180

function buildScene(shape: MountainShape, stops: readonly RouteStop[]) {
  const scene = new THREE.Scene()
  const L = shape.levels
  const disposables: { dispose: () => void }[] = []
  const keep = <T extends { dispose: () => void }>(x: T) => (disposables.push(x), x)
  const k = shape.seed * 1.7 // 씨앗 → 굴곡의 위상(시작 위치)을 밀어 다른 모양으로

  /** 1) 산 모양 수식: 높이 t, 방향 θ(라디안) → 반지름 */
  const radiusAt = (t: number, theta: number) => {
    const u = 1 - t
    const profile = 0.85 * Math.pow(u, shape.sharpness) + 0.15 * u // 위로 갈수록 좁아짐
    const b = shape.bumpiness
    const bump =
      1 +
      b *
        (0.09 * Math.sin(3 * theta + 1.3 + 2.5 * t + k) +
          0.05 * Math.sin(5 * theta + 2.1 - 3 * t + k * 2.3) +
          0.025 * Math.sin(11 * theta + 6 * t + k * 0.7))
    return shape.radius * profile * bump
  }
  /** 산 표면 위의 한 점 (lift: 표면에서 살짝 띄우기) */
  const surfacePoint = (t: number, theta: number, lift = 0) => {
    const r = radiusAt(t, theta) + lift
    const y = t * shape.height + (1 - t) * t * 0.05 * shape.bumpiness * Math.sin(4 * theta + 9 * t + k)
    return new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta))
  }

  // 2) 등고선
  const contourMat = keep(new THREE.LineBasicMaterial({ color: COLOR.contour, transparent: true, opacity: 0.62 }))
  for (let i = 0; i < L; i++) {
    const t = i / L
    const pts: THREE.Vector3[] = []
    for (let s = 0; s < SEGMENTS; s++) pts.push(surfacePoint(t, (s / SEGMENTS) * Math.PI * 2))
    scene.add(new THREE.LineLoop(keep(new THREE.BufferGeometry().setFromPoints(pts)), contourMat))
  }

  // 3) 가림 면 (등고선과 같은 격자를 삼각형으로 이어 만든 어두운 산 몸통)
  const positions: number[] = []
  const index: number[] = []
  for (let i = 0; i <= L; i++) {
    const t = i / L
    for (let s = 0; s < SEGMENTS; s++) {
      const p = surfacePoint(t, (s / SEGMENTS) * Math.PI * 2, -0.004)
      positions.push(p.x, p.y, p.z)
    }
  }
  for (let i = 0; i < L; i++) {
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

  // 바닥 고리(하늘색) + 눈금
  const ringR = shape.radius * 1.2
  const ringPts: THREE.Vector3[] = []
  for (let s = 0; s < SEGMENTS; s++) {
    const a = (s / SEGMENTS) * Math.PI * 2
    ringPts.push(new THREE.Vector3(ringR * Math.cos(a), 0, ringR * Math.sin(a)))
  }
  scene.add(
    new THREE.LineLoop(
      keep(new THREE.BufferGeometry().setFromPoints(ringPts)),
      keep(new THREE.LineBasicMaterial({ color: COLOR.ring, transparent: true, opacity: 0.8 })),
    ),
  )
  const tickPts: THREE.Vector3[] = []
  for (let s = 0; s < 72; s++) {
    const a = (s / 72) * Math.PI * 2
    const long = s % 6 === 0
    const r1 = ringR * 1.035
    const r2 = ringR * (long ? 1.09 : 1.06)
    tickPts.push(new THREE.Vector3(r1 * Math.cos(a), 0, r1 * Math.sin(a)), new THREE.Vector3(r2 * Math.cos(a), 0, r2 * Math.sin(a)))
  }
  scene.add(
    new THREE.LineSegments(
      keep(new THREE.BufferGeometry().setFromPoints(tickPts)),
      keep(new THREE.LineBasicMaterial({ color: COLOR.contour, transparent: true, opacity: 0.45 })),
    ),
  )

  // 4) 루트 점선: (방향, 높이) 를 부드럽게 이은 뒤 산 표면에 올림
  if (stops.length >= 2) {
    const curve = new THREE.CatmullRomCurve3(
      stops.map((s) => new THREE.Vector3(rad(s.angle), s.t, 0)),
      false,
      'centripetal',
    )
    const routePts = curve.getPoints(Math.max(120, stops.length * 50)).map((p) => surfacePoint(Math.min(1, Math.max(0, p.y)), p.x, 0.012))
    const route = new THREE.Line(
      keep(new THREE.BufferGeometry().setFromPoints(routePts)),
      keep(new THREE.LineDashedMaterial({ color: COLOR.route, dashSize: 0.05, gapSize: 0.035 })),
    )
    route.computeLineDistances()
    scene.add(route)
  }

  // 5) 핀이 꽂힐 자리와, 그 자리에서 바깥을 향하는 방향(뒤편에 있는지 판단용)
  const anchors = stops.map((s) => {
    const theta = rad(s.angle)
    return {
      id: s.id,
      position: surfacePoint(s.t, theta, 0.012),
      outward: new THREE.Vector3(Math.cos(theta), 0.55, Math.sin(theta)).normalize(),
      top: s.t >= 0.97,
    }
  })

  return { scene, anchors, dispose: () => disposables.forEach((d) => d.dispose()) }
}

export interface PinInfo {
  /** stops 의 id 와 같아야 그 자리에 꽂혀요 ('start' · 체크포인트 id · 'summit') */
  id: string
  /** 핀 머리에 보일 글자 (정상은 깃발 아이콘) */
  label: string
  /** 화면낭독기용 이름 */
  name: string
  /** 핀 옆 말풍선 */
  callout?: { strong?: string; text: string }
}

interface Props {
  /** 루트 위 지점들 (makeRouteStops 로 만들거나 직접 지정) */
  stops: readonly RouteStop[]
  pins: PinInfo[]
  /** 산 모양 (일부만 줘도 됨) */
  shape?: Partial<MountainShape>
  selected?: string | null
  onSelect?: (id: string) => void
  className?: string
}

export function Mountain3D({ stops, pins, shape, selected, onSelect, className = '' }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pinRefs = useRef(new Map<string, HTMLElement>())
  const resetRef = useRef<() => void>(() => {})
  const [failed, setFailed] = useState(false)
  /** 사용자가 돌려서 처음 방향에서 벗어났는지 → "처음 방향으로" 버튼 표시 */
  const [turned, setTurned] = useState(false)

  // 모양·루트 데이터가 실제로 바뀔 때만 다시 그리도록 글자열 열쇠로 비교
  const sceneKey = JSON.stringify([shape ?? null, stops])
  const { full, stopList } = useMemo(
    () => {
      const [sh, st] = JSON.parse(sceneKey) as [Partial<MountainShape> | null, RouteStop[]]
      return { full: { ...DEFAULT_SHAPE, ...sh }, stopList: st }
    },
    [sceneKey],
  )

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    } catch {
      setFailed(true) // WebGL 을 못 쓰는 환경 → 피그마의 평면 그림으로 대신
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)

    const { scene, anchors, dispose } = buildScene(full, stopList)
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
    const target = new THREE.Vector3(0, full.height * 0.38, 0)

    // 6) 회전 조작 — 끌 때만 돌아감
    const controls = new OrbitControls(camera, canvas)
    controls.target.copy(target)
    controls.enableZoom = false
    controls.enablePan = false
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minPolarAngle = rad(90 - VIEW.tilt - 14)
    controls.maxPolarAngle = rad(90 - VIEW.tilt + 9)
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    controls.autoRotate = VIEW.autoRotateSpeed > 0 && !reducedMotion
    controls.autoRotateSpeed = VIEW.autoRotateSpeed

    let dist = 6
    // 카메라를 처음 방향(루트가 보이는 쪽)에 놓기
    const home = () => {
      const az = rad(VIEW.startAngle)
      const el = rad(VIEW.tilt)
      camera.position.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az)).multiplyScalar(dist).add(target)
      controls.update()
      setTurned(false)
    }
    resetRef.current = home
    const onStart = () => setTurned(true)
    controls.addEventListener('start', onStart)

    // 컨테이너 크기에 맞춰 산 전체가 들어오도록 카메라 거리 조절
    const resize = () => {
      const w = wrap.clientWidth
      const h = wrap.clientHeight
      if (!w || !h) return
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      const vHalf = rad(camera.fov / 2)
      const hHalf = Math.atan(Math.tan(vHalf) * camera.aspect)
      const needW = (full.radius * 1.36) / Math.tan(hHalf)
      // 세로: 산 높이 절반 + 핀 길이 + 기울어진 바닥 고리가 차지하는 만큼
      const needH = (full.height * 0.5 + 0.3 + full.radius * 1.25 * Math.sin(rad(VIEW.tilt))) / Math.tan(vHalf)
      dist = Math.max(needW, needH) * 1.1
      controls.minDistance = dist
      controls.maxDistance = dist
      camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    resize()
    home()

    const v = new THREE.Vector3()
    const toCam = new THREE.Vector3()
    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      controls.update()
      renderer.render(scene, camera)
      // 핀: 3D 좌표 → 화면 좌표
      const w = wrap.clientWidth
      const h = wrap.clientHeight
      for (const a of anchors) {
        const elPin = pinRefs.current.get(a.id)
        if (!elPin) continue
        v.copy(a.position).project(camera)
        const x = (v.x * 0.5 + 0.5) * w
        const y = (-v.y * 0.5 + 0.5) * h
        elPin.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, calc(-100% + 2.4px))`
        // 산 뒤편에 있으면 흐리게
        toCam.copy(camera.position).sub(a.position).normalize()
        const front = a.top || a.outward.dot(toCam) > -0.05
        elPin.style.opacity = front ? '1' : '0.28'
        elPin.style.zIndex = String(1000 - Math.round(v.z * 1000))
      }
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      controls.removeEventListener('start', onStart)
      controls.dispose()
      dispose()
      renderer.dispose()
    }
  }, [full, stopList])

  if (failed) {
    return (
      <div className={`relative ${className}`}>
        <div role="img" aria-label="등고선으로 그린 산과, 출발에서 정상까지 이어지는 점선 루트" className="absolute inset-0 flex items-center justify-center">
          <div className="relative aspect-[729.6/422.4] w-full max-w-[730px]">
            <img src={contoursSvg} alt="" className="absolute inset-0 size-full" />
            <img src={routeSvg} alt="" className="absolute inset-0 size-full" />
          </div>
        </div>
      </div>
    )
  }

  const known = new Set(stopList.map((s) => s.id))

  return (
    <div ref={wrapRef} role="group" aria-label="루트 지도: 등고선 산 위에 출발부터 정상까지 체크포인트가 표시돼 있어요. 끌어서 돌려 볼 수 있어요." className={`relative overflow-hidden ${className}`}>
      <canvas ref={canvasRef} aria-hidden className="absolute inset-0 size-full cursor-grab touch-pan-y active:cursor-grabbing" />

      {/* 핀 (HTML). 위치는 매 프레임 위 tick() 에서 옮깁니다 */}
      {pins
        .filter((pin) => known.has(pin.id))
        .map((pin) => {
          const isStart = pin.id === 'start'
          const isSummit = pin.id === 'summit'
          const on = selected === pin.id
          return (
            <div
              key={pin.id}
              ref={(el) => {
                if (el) pinRefs.current.set(pin.id, el)
                else pinRefs.current.delete(pin.id)
              }}
              className="pointer-events-none absolute top-0 left-0 flex flex-col items-center transition-opacity duration-300 will-change-transform"
            >
              <button
                type="button"
                onClick={() => onSelect?.(pin.id)}
                aria-label={pin.name}
                aria-pressed={on}
                className={`pointer-events-auto flex h-[28.8px] min-w-[28.8px] items-center justify-center rounded-full text-on-light transition-shadow ${
                  isStart ? 'bg-pin-now px-2 text-[11.5px] font-bold' : isSummit ? 'border-2 border-surface bg-summit' : 'bg-checkpoint font-mono text-[10.5px] font-medium'
                } ${on ? 'shadow-[0_0_0_3px_rgb(214_227_111/0.55)]' : ''}`}
              >
                {isSummit ? <img src={iconFlag} alt="" width={13.44} height={13.44} /> : pin.label}
              </button>
              <span aria-hidden className="h-[38.4px] w-[1.92px] bg-contour" />
              <img src={pinFoot} alt="" width={9.6} height={4.8} />
              {pin.callout && (
                <span className="absolute top-0 left-full ml-1.5 flex items-center gap-2 rounded-[14px] border border-line bg-surface px-2.5 py-1.5 leading-none whitespace-nowrap">
                  {pin.callout.strong && <span className="text-[11.5px] font-bold text-ink">{pin.callout.strong}</span>}
                  <span className={pin.callout.strong ? 'font-mono text-[10.5px] font-medium text-muted' : 'text-[11.5px] font-medium text-muted'}>{pin.callout.text}</span>
                </span>
              )}
            </div>
          )
        })}

      {/* 안내 / 돌린 뒤에는 처음 방향(루트가 보이는 쪽)으로 되돌리기 */}
      {turned ? (
        <button
          type="button"
          onClick={() => resetRef.current()}
          className="absolute right-4 bottom-4 z-[2000] rounded-full border border-line bg-surface/80 px-3 py-1.5 text-xs font-medium text-ink backdrop-blur hover:bg-fill-3"
        >
          처음 방향으로
        </button>
      ) : (
        <p aria-hidden className="pointer-events-none absolute right-4 bottom-4 z-[2000] rounded-full px-3 py-1.5 text-xs font-medium text-muted">
          끌어서 돌려 보기
        </p>
      )}
    </div>
  )
}

import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls, useGLTF } from '@react-three/drei'
import { STEPS, STEP_INDEX, type Step } from '../data/steps'

export type ViewMode = 'navod' | 'drevo'

const MODEL_URL = `${import.meta.env.BASE_URL}models/herold.glb`
const DUR = 0.9 // délka příletu jednoho dílu (s)
const GROUND_Y = -0.328 // terén pod patkami plošiny (viz blender/build_herold.py)

// Rámy jsou v krocích 1–4 rozložené od sebe, v kroku 5 se spojí.
const RELEASE: Record<string, string> = { rear: 's5a', sideL: 's5a', sideR: 's5a', front: 's5b' }

/** Blender (mm, Z nahoru) → three.js (m, Y nahoru) */
const toThree = (x: number, y: number, z: number) => new THREE.Vector3(x / 1000, z / 1000, -y / 1000)

const PALETTE = {
  navod: {
    bg: '#f4eee2', ground: '#e9e1d1', wood: '#fbf7ee', hi: '#f6c443', deck: '#d6d0c5', floor: '#e7ddca',
    steel: '#c7cace', rubber: '#3a3a3a', glass: '#cfe6f1', hole: '#151515', logo: '#2f7d4a',
    edge: '#1f1b16', edgeOpacity: 0.85,
  },
  drevo: {
    bg: '#e6ecef', ground: '#a7b78d', wood: '#d2a46a', hi: '#ffd23a', deck: '#56504a', floor: '#9b7552',
    steel: '#9ea4aa', rubber: '#1d1d1d', glass: '#bcdcea', hole: '#151515', logo: '#2f7d4a',
    edge: '#3a2815', edgeOpacity: 0.28,
  },
} as const

type Kind = 'wood' | 'deck' | 'floor' | 'steel' | 'rubber' | 'glass' | 'hole' | 'logo'
const HIGHLIGHT = new Set<Kind>(['wood', 'rubber', 'steel', 'logo'])

type Item = {
  mesh: THREE.Mesh
  edges?: THREE.LineSegments
  base: THREE.Vector3
  from: THREE.Vector3
  ex: THREE.Vector3
  step: number
  until: number
  release: number
  kind: Kind
  part: number
  label: string
  delay: number
}

/** poloha dílu po doběhnutí animace v daném kroku */
const finalPos = (it: Item, stepIdx: number) => {
  const pos = it.base.clone()
  if (it.release >= 0 && stepIdx < it.release) pos.add(it.ex)
  return pos
}
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const easeOut = (p: number) => 1 - Math.pow(1 - p, 3)
const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2)

function useItems() {
  const gltf = useGLTF(MODEL_URL)
  return useMemo(() => {
    const items: Item[] = []
    gltf.scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      const u = mesh.userData
      const kind = (u.kind ?? 'wood') as Kind
      let edges = mesh.children.find((c) => (c as THREE.LineSegments).isLineSegments) as THREE.LineSegments | undefined
      if (!edges && kind !== 'hole' && kind !== 'glass') {
        edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 28))
        edges.raycast = () => {}
        mesh.add(edges)
      }
      mesh.castShadow = kind !== 'glass'
      mesh.receiveShadow = true
      // model z useGLTF je sdílený a animace mění pozici – původní polohu si uložíme jen jednou
      if (!u.basePos) u.basePos = mesh.position.clone()
      items.push({
        mesh,
        edges,
        base: (u.basePos as THREE.Vector3).clone(),
        from: toThree(u.fx ?? 0, u.fy ?? 0, u.fz ?? 0),
        ex: toThree(u.ex ?? 0, u.ey ?? 0, u.ez ?? 0),
        step: STEP_INDEX.get(u.step) ?? 0,
        until: u.until ? (STEP_INDEX.get(u.until) ?? -1) : -1,
        release: u.grp && RELEASE[u.grp] ? (STEP_INDEX.get(RELEASE[u.grp]) ?? -1) : -1,
        kind,
        part: u.part ?? 0,
        label: u.label ?? mesh.name,
        delay: 0,
      })
    })
    // pořadí příletu v rámci kroku: odspodu nahoru, zleva doprava
    const byStep = new Map<number, Item[]>()
    for (const it of items) byStep.set(it.step, [...(byStep.get(it.step) ?? []), it])
    for (const list of byStep.values()) {
      list.sort((a, b) => a.base.y - b.base.y || a.base.x - b.base.x || a.base.z - b.base.z)
      const stagger = Math.min(0.14, 2.2 / list.length)
      list.forEach((it, i) => (it.delay = 0.25 + i * stagger))
    }
    return { scene: gltf.scene, items }
  }, [gltf])
}

type ShedProps = { stepIdx: number; mode: ViewMode; paused: boolean; slow: boolean; replay: number; onReady?: () => void }
export type SceneProps = ShedProps & { camKey: number }

function Shed({ stepIdx, mode, paused, slow, replay, onReady }: ShedProps) {
  const { scene, items } = useItems()
  useEffect(() => onReady?.(), [onReady])
  const clock = useRef(0)
  const tmp = useMemo(() => new THREE.Vector3(), [])

  const mats = useMemo(() => {
    const p = PALETTE[mode]
    const std = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) =>
      new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...extra })
    return {
      wood: std(p.wood),
      hi: std(p.hi, { emissive: new THREE.Color(p.hi), emissiveIntensity: mode === 'navod' ? 0.12 : 0.4 }),
      deck: std(p.deck),
      floor: std(p.floor),
      steel: std(p.steel, { metalness: 0.6, roughness: 0.4 }),
      rubber: std(p.rubber),
      glass: std(p.glass, { transparent: true, opacity: 0.45, roughness: 0.1 }),
      hole: std(p.hole),
      logo: std(p.logo),
      edge: new THREE.LineBasicMaterial({ color: p.edge, transparent: true, opacity: p.edgeOpacity }),
      edgeHi: new THREE.LineBasicMaterial({ color: '#000000', transparent: true, opacity: Math.min(1, p.edgeOpacity + 0.2) }),
    }
  }, [mode])

  useEffect(() => {
    const last = STEPS.length - 1
    for (const it of items) {
      const current = it.step === stepIdx && stepIdx !== last && HIGHLIGHT.has(it.kind)
      it.mesh.material = current ? mats.hi : mats[it.kind]
      if (it.edges) it.edges.material = current ? mats.edgeHi : mats.edge
    }
  }, [items, mats, stepIdx])

  useEffect(() => {
    clock.current = 0
  }, [stepIdx, replay])

  useFrame((_, dt) => {
    if (!paused) clock.current += Math.min(dt, 0.1) / (slow ? 2.5 : 1)
    const t = clock.current
    for (const it of items) {
      const visible = it.step <= stepIdx && (it.until < 0 || stepIdx < it.until)
      it.mesh.visible = visible
      if (!visible) continue
      tmp.copy(it.base)
      if (it.release >= 0) {
        let k = 0
        if (stepIdx < it.release) k = 1
        else if (stepIdx === it.release) k = 1 - easeInOut(clamp01((t - 0.3) / 1.8))
        tmp.addScaledVector(it.ex, k)
      }
      if (it.step === stepIdx) tmp.addScaledVector(it.from, 1 - easeOut(clamp01((t - it.delay) / DUR)))
      it.mesh.position.copy(tmp)
    }
  })

  // popisky čísel pozic u dílů aktuálního kroku (jeden na každé číslo)
  const labels = useMemo(() => {
    const seen = new Set<number>()
    const out: { part: number; pos: THREE.Vector3; delay: number; title: string }[] = []
    const target = toThree(...STEPS[stepIdx].camera.target)
    const reps = items
      .filter((it) => it.step === stepIdx && it.part > 0 && stepIdx !== STEPS.length - 1)
      .sort((a, b) => finalPos(a, stepIdx).distanceTo(target) - finalPos(b, stepIdx).distanceTo(target))
    for (const it of reps) {
      if (seen.has(it.part)) continue
      seen.add(it.part)
      const pos = finalPos(it, stepIdx)
      out.push({ part: it.part, pos, delay: it.delay + DUR, title: it.label })
    }
    return out
  }, [items, stepIdx])

  return (
    <>
      <primitive object={scene} />
      {labels.map((l) => (
        <Html key={`${stepIdx}-${replay}-${l.part}`} position={l.pos} center zIndexRange={[20, 0]}>
          <div
            className="part-badge"
            title={l.title}
            style={{ animationDelay: `${l.delay * (slow ? 2.5 : 1)}s`, animationPlayState: paused ? 'paused' : 'running' }}
          >
            {l.part}
          </div>
        </Html>
      ))}
    </>
  )
}

function CameraRig({ step, reset }: { step: Step; reset: string }) {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const controls = useThree((s) => s.controls) as unknown as {
    target: THREE.Vector3
    update: () => void
    addEventListener: (e: string, f: () => void) => void
    removeEventListener: (e: string, f: () => void) => void
  } | null
  const goal = useRef<{ pos: THREE.Vector3; target: THREE.Vector3 } | null>(null)

  useEffect(() => {
    const target = toThree(...step.camera.target)
    const pos = toThree(...step.camera.pos)
    const aspect = size.width / Math.max(1, size.height)
    const k = aspect < 1.25 ? Math.min(2.1, 1.25 / aspect) : 1
    pos.sub(target).multiplyScalar(k).add(target)
    goal.current = { pos, target }
  }, [step, size.width, size.height, reset])

  useEffect(() => {
    if (!controls) return
    const stop = () => (goal.current = null)
    controls.addEventListener('start', stop)
    return () => controls.removeEventListener('start', stop)
  }, [controls])

  useFrame((_, dt) => {
    if (!goal.current || !controls) return
    const a = 1 - Math.exp(-Math.min(dt, 0.1) * 3.2)
    camera.position.lerp(goal.current.pos, a)
    controls.target.lerp(goal.current.target, a)
    controls.update()
    if (camera.position.distanceTo(goal.current.pos) < 0.005 && controls.target.distanceTo(goal.current.target) < 0.005)
      goal.current = null
  })
  return null
}

// popisky stran domku na zemi, aby bylo vždy jasné, kde je předek s dveřmi
const COMPASS: [string, number, number][] = [
  ['PŘEDEK · DVEŘE', 1635, -2500],
  ['ZADNÍ STĚNA', 1635, 4500],
  ['LEVÁ STRANA', -2300, 1105],
  ['PRAVÁ STRANA', 5570, 1105],
]

function Compass() {
  return (
    <>
      {COMPASS.map(([text, x, y]) => (
        <Html key={text} position={toThree(x, y, GROUND_Y * 1000)} center zIndexRange={[10, 0]}>
          <div className="compass">{text}</div>
        </Html>
      ))}
    </>
  )
}

export default function ShedScene(props: SceneProps) {
  const step = STEPS[props.stepIdx]
  const p = PALETTE[props.mode]
  const initial = toThree(...step.camera.pos)
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ fov: 35, near: 0.05, far: 200, position: initial.toArray() }}>
      <color attach="background" args={[p.bg]} />
      <hemisphereLight args={['#ffffff', '#b9ad97', props.mode === 'navod' ? 1.6 : 1.1]} />
      <directionalLight
        position={[-5, 10, 7]}
        intensity={props.mode === 'navod' ? 1.5 : 2.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-bias={-0.0004}
      />
      <mesh rotation-x={-Math.PI / 2} position={[1.6, GROUND_Y - 0.001, -1.1]} receiveShadow>
        <circleGeometry args={[40, 64]} />
        <meshStandardMaterial color={p.ground} roughness={1} />
      </mesh>
      <Suspense fallback={<Html center className="loading-3d">Načítám 3D model…</Html>}>
        <Shed {...props} />
      </Suspense>
      <OrbitControls makeDefault enableDamping dampingFactor={0.12} maxPolarAngle={Math.PI / 2.02} minDistance={0.4} maxDistance={40} zoomSpeed={1.4} />
      <Compass />
      <CameraRig step={step} reset={`${props.replay}-${props.camKey}`} />
    </Canvas>
  )
}

useGLTF.preload(MODEL_URL)

import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Classic cube colors (one face accented gold to stay on-brand).
const FACE_COLORS = {
  px: '#ff3b30', // right  — red
  nx: '#ff7a00', // left   — orange
  py: '#f5f5f5', // up     — white
  ny: '#e8b84b', // down   — gold (brand accent)
  pz: '#00b341', // front  — green
  nz: '#2d6cff', // back   — blue
}

const SP = 1.04 // spacing between cubies
const TURN_DURATION = 0.46 // seconds per face turn
const TURN_GAP = 0.12 // idle beat between turns

const STICKER_TF = {
  px: { pos: [0.5, 0, 0], rot: [0, Math.PI / 2, 0] },
  nx: { pos: [-0.5, 0, 0], rot: [0, -Math.PI / 2, 0] },
  py: { pos: [0, 0.5, 0], rot: [-Math.PI / 2, 0, 0] },
  ny: { pos: [0, -0.5, 0], rot: [Math.PI / 2, 0, 0] },
  pz: { pos: [0, 0, 0.5], rot: [0, 0, 0] },
  nz: { pos: [0, 0, -0.5], rot: [0, Math.PI, 0] },
}

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
const randInt = (n) => Math.floor(Math.random() * n)

// Build the 27 cubies once, with stickers baked onto their outer faces. Colors
// travel with each cubie as it turns — exactly like a real cube.
function buildCube() {
  const root = new THREE.Group()
  const disposables = []

  const boxGeo = new THREE.BoxGeometry(0.98, 0.98, 0.98)
  const stickerGeo = new THREE.PlaneGeometry(0.84, 0.84)
  disposables.push(boxGeo, stickerGeo)

  const baseMat = new THREE.MeshStandardMaterial({ color: '#0a0a0a', roughness: 0.6, metalness: 0.3 })
  disposables.push(baseMat)
  const stickerMats = {}
  for (const [face, color] of Object.entries(FACE_COLORS)) {
    stickerMats[face] = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.28,
      roughness: 0.35,
      metalness: 0.2,
    })
    disposables.push(stickerMats[face])
  }

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        if (x === 0 && y === 0 && z === 0) continue
        const cubie = new THREE.Group()
        cubie.position.set(x * SP, y * SP, z * SP)
        cubie.userData.pos = { x, y, z }
        cubie.add(new THREE.Mesh(boxGeo, baseMat))

        const faces = []
        if (x === 1) faces.push('px')
        if (x === -1) faces.push('nx')
        if (y === 1) faces.push('py')
        if (y === -1) faces.push('ny')
        if (z === 1) faces.push('pz')
        if (z === -1) faces.push('nz')
        for (const f of faces) {
          const s = new THREE.Mesh(stickerGeo, stickerMats[f])
          s.position.set(...STICKER_TF[f].pos)
          s.rotation.set(...STICKER_TF[f].rot)
          cubie.add(s)
        }
        root.add(cubie)
      }
    }
  }
  return { root, disposables }
}

function RubiksCube() {
  const { root, pivot, disposables } = useMemo(() => {
    const built = buildCube()
    return { root: built.root, pivot: new THREE.Group(), disposables: built.disposables }
  }, [])

  // Imperative turn state machine (driven in useFrame — no per-frame React renders).
  const move = useRef(null)
  const gapUntil = useRef(0)
  const axisVec = useMemo(
    () => ({ x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) }),
    [],
  )

  useEffect(() => {
    return () => disposables.forEach((d) => d.dispose())
  }, [disposables])

  useFrame((state, delta) => {
    const now = state.clock.elapsedTime

    if (!move.current) {
      if (now < gapUntil.current) return
      // Pick a face turn: an axis, an outer layer, a direction.
      const axisKey = ['x', 'y', 'z'][randInt(3)]
      const layer = [-1, 1][randInt(2)]
      const dir = [1, -1][randInt(2)]
      const axis = axisVec[axisKey]

      pivot.quaternion.identity()
      pivot.position.set(0, 0, 0)
      root.add(pivot)
      // Re-parent the layer's cubies onto the pivot (preserving world transform).
      for (const c of [...root.children]) {
        if (c === pivot) continue
        if (Math.round(c.userData.pos[axisKey]) === layer) pivot.attach(c)
      }
      move.current = { axis, axisKey, dir, t: 0 }
    }

    const m = move.current
    m.t = Math.min(1, m.t + delta / TURN_DURATION)
    pivot.quaternion.setFromAxisAngle(m.axis, m.dir * (Math.PI / 2) * easeInOut(m.t))

    if (m.t >= 1) {
      // Bake the turn back into each cubie's stored grid position + orientation.
      for (const c of [...pivot.children]) {
        root.attach(c)
        const v = new THREE.Vector3(c.userData.pos.x, c.userData.pos.y, c.userData.pos.z)
        v.applyAxisAngle(m.axis, m.dir * (Math.PI / 2))
        const p = { x: Math.round(v.x), y: Math.round(v.y), z: Math.round(v.z) }
        c.userData.pos = p
        c.position.set(p.x * SP, p.y * SP, p.z * SP) // snap to grid, kill float drift
      }
      root.remove(pivot)
      move.current = null
      gapUntil.current = now + TURN_GAP
    }
  })

  return <primitive object={root} />
}

// Slow auto-spin + gentle parallax toward the cursor.
function Rig({ children }) {
  const ref = useRef()
  const spin = useRef(0)
  useFrame((state, delta) => {
    if (!ref.current) return
    spin.current += delta * 0.18
    ref.current.rotation.y = spin.current + state.pointer.x * 0.4
    ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, 0.5 - state.pointer.y * 0.25, 0.06)
  })
  return <group ref={ref}>{children}</group>
}

export default function HeroScene() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0.4, 7.4], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 8, 6]} intensity={1.7} />
      <pointLight position={[-6, 3, 4]} intensity={45} color="#e8b84b" distance={20} />
      <pointLight position={[6, -2, 5]} intensity={28} color="#5e8bff" distance={20} />
      <Rig>
        <RubiksCube />
      </Rig>
    </Canvas>
  )
}

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { LDrawLoader } from 'three/examples/jsm/loaders/LDrawLoader.js'
import { LDrawConditionalLineMaterial } from 'three/examples/jsm/materials/LDrawConditionalLineMaterial.js'
import './field-test.css'

function Scene({ lightsOn, onReady, onError }) {
  const mount = useRef(null)
  const lights = useRef(null)

  useEffect(() => {
    const root = mount.current
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#10100e')
    scene.fog = new THREE.Fog('#10100e', 11, 30)
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
    camera.position.set(7.6, 4.2, 8.5)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.12
    root.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(0, 1.2, 0)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.minDistance = 5
    controls.maxDistance = 15
    controls.maxPolarAngle = Math.PI / 2.05

    const ambient = new THREE.HemisphereLight('#fff2d0', '#111111', 1.1)
    scene.add(ambient)
    const key = new THREE.DirectionalLight('#ffd59a', 4.6)
    key.position.set(-5, 9, 5)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    key.shadow.camera.left = -7; key.shadow.camera.right = 7; key.shadow.camera.top = 7; key.shadow.camera.bottom = -7
    scene.add(key)
    const rim = new THREE.DirectionalLight('#77a9c9', 5)
    rim.position.set(6, 5, -6)
    scene.add(rim)
    lights.current = { ambient, key, rim }

    const floor = new THREE.Mesh(new THREE.CircleGeometry(18, 96), new THREE.MeshStandardMaterial({ color: '#25241f', roughness: 0.94, metalness: 0.05 }))
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.12
    floor.receiveShadow = true
    scene.add(floor)
    const halo = new THREE.Mesh(new THREE.CircleGeometry(8, 64), new THREE.MeshBasicMaterial({ color: '#a87843', transparent: true, opacity: 0.055 }))
    halo.rotation.x = -Math.PI / 2
    halo.position.y = -0.1
    scene.add(halo)

    const dust = new THREE.BufferGeometry()
    const positions = new Float32Array(240)
    for (let i = 0; i < positions.length; i += 3) { positions[i] = (Math.random() - 0.5) * 14; positions[i + 1] = Math.random() * 4; positions[i + 2] = (Math.random() - 0.5) * 12 }
    dust.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    scene.add(new THREE.Points(dust, new THREE.PointsMaterial({ color: '#d9bd8e', size: 0.025, transparent: true, opacity: 0.32 })))

    let model
    const loader = new LDrawLoader()
    loader.setConditionalLineMaterial(LDrawConditionalLineMaterial)
    loader.setPath('/')
    loader.setPartsLibraryPath('https://library.ldraw.org/library/official/')
    loader.load('42081-1.mpd', (object) => {
      model = object
      model.rotation.x = Math.PI
      model.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true } })
      const box = new THREE.Box3().setFromObject(model)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())
      model.position.sub(center)
      model.position.y += size.y / 2
      const scale = 4.4 / Math.max(size.x, size.y, size.z)
      model.scale.setScalar(scale)
      scene.add(model)
      onReady()
    }, undefined, onError)

    const resize = () => { const { clientWidth: w, clientHeight: h } = root; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h, false) }
    resize(); window.addEventListener('resize', resize)
    let frame = 0
    const animate = () => { frame = requestAnimationFrame(animate); if (model) model.rotation.y += 0.0015; controls.update(); renderer.render(scene, camera) }
    animate()
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); controls.dispose(); renderer.dispose(); root.removeChild(renderer.domElement) }
  }, [onReady, onError])

  useEffect(() => { if (lights.current) Object.values(lights.current).forEach((light) => { light.intensity = lightsOn ? (light === lights.current.ambient ? 1.1 : light === lights.current.key ? 4.6 : 5) : 0.15 }) }, [lightsOn])
  return <div className="field-test-canvas" ref={mount} />
}

export default function FieldTestPage() {
  const [lightsOn, setLightsOn] = useState(true)
  const [status, setStatus] = useState('PARSING MODEL')
  const [resetKey, setResetKey] = useState(0)
  return <main className="field-test-page">
    <Scene key={resetKey} lightsOn={lightsOn} onReady={() => setStatus('LIVE / READY')} onError={() => setStatus('MODEL LOAD ERROR')} />
    <div className="field-test-vignette" />
    <header className="field-test-header"><p className="eyebrow">VOLVO CE / DIGITAL LAB</p><h1>Night shift<br /><em>field test</em></h1><p className="dek">A working study of 42081 — framed in light, shadow, and motion.</p></header>
    <div className="field-test-meta"><span>01</span><span>CONSTRUCTION / 2019</span><span className="status"><i />{status}</span></div>
    <aside className="field-test-panel"><p className="eyebrow">MODEL / 42081-1</p><h2>Rough terrain<br />loader</h2><dl><div><dt>SCENE</dt><dd>01 / 03</dd></div><div><dt>MATERIAL</dt><dd>PHYSICAL / PBR</dd></div><div><dt>LIGHTING</dt><dd>{lightsOn ? 'NIGHT SHIFT' : 'LOW POWER'}</dd></div></dl><div className="field-test-actions"><button onClick={() => setLightsOn((value) => !value)}>{lightsOn ? 'Dim lights' : 'Bring up lights'}</button><button onClick={() => { setResetKey((value) => value + 1); setStatus('PARSING MODEL') }}>Reset view</button></div></aside>
    <p className="field-test-hint">DRAG TO ORBIT &nbsp;·&nbsp; SCROLL TO ZOOM</p>
  </main>
}

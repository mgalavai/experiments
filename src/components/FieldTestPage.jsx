import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import './field-test.css'

function Scene({ lightsOn, exploded, resetVersion, onReady, onError }) {
  const mount = useRef(null)
  const lights = useRef(null)
  const renderScene = useRef(null)
  const view = useRef(null)
  const explosion = useRef(null)

  useEffect(() => {
    const root = mount.current
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#10100e')
    scene.fog = new THREE.Fog('#10100e', 11, 30)
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
    camera.position.set(7.6, 4.2, 8.5)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.35))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.12
    root.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(0, 1.2, 0)
    controls.enableDamping = false
    controls.minDistance = 5
    controls.maxDistance = 15
    controls.maxPolarAngle = Math.PI / 2.05

    const ambient = new THREE.HemisphereLight('#fff2d0', '#111111', 1.1)
    scene.add(ambient)
    const key = new THREE.DirectionalLight('#ffd59a', 4.6)
    key.position.set(-5, 9, 5)
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
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

    const render = () => renderer.render(scene, camera)
    renderScene.current = render
    view.current = { camera, controls, render }
    controls.addEventListener('change', render)

    let model
    let animationFrame = 0
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
    loader.load('/42081-1.glb', (gltf) => {
      model = gltf.scene
      model.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true } })
      scene.add(model)
      model.updateMatrixWorld(true)
      const modelCenter = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3())
      const parts = []
      model.traverse((child) => {
        const isPhysicalPart = child.userData.type === 'Part' || child.userData.type === 'Unofficial_Part'
        if (!isPhysicalPart || !child.parent) return
        let ancestor = child.parent
        while (ancestor && ancestor !== model) {
          if (ancestor.userData.type === 'Part' || ancestor.userData.type === 'Unofficial_Part') return
          ancestor = ancestor.parent
        }
        const partBounds = new THREE.Box3().setFromObject(child)
        const partCenter = partBounds.getCenter(new THREE.Vector3())
        const direction = partCenter.sub(modelCenter)
        direction.y += Math.max(0.25, direction.length() * 0.14)
        direction.normalize()
        const offset = direction.multiplyScalar(1.35)
        const minimumExplodedY = floor.position.y + 0.04
        if (partBounds.min.y + offset.y < minimumExplodedY) {
          offset.y += minimumExplodedY - (partBounds.min.y + offset.y)
        }
        const worldOrigin = child.getWorldPosition(new THREE.Vector3())
        const target = child.parent.worldToLocal(worldOrigin.add(offset))
        parts.push({ node: child, origin: child.position.clone(), target })
      })
      explosion.current = { parts, renderer, render, getFrame: () => animationFrame, setFrame: (frame) => { animationFrame = frame } }
      render()
      renderer.shadowMap.autoUpdate = false
      onReady()
    }, undefined, onError)

    const resize = () => { const { clientWidth: w, clientHeight: h } = root; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h, false); render() }
    resize(); window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      controls.removeEventListener('change', render)
      controls.dispose()
      cancelAnimationFrame(animationFrame)
      scene.traverse((child) => {
        child.geometry?.dispose()
        if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose())
        else child.material?.dispose()
      })
      renderer.dispose()
      renderScene.current = null
      view.current = null
      explosion.current = null
      root.removeChild(renderer.domElement)
    }
  }, [onReady, onError])

  useEffect(() => {
    if (!lights.current) return
    Object.values(lights.current).forEach((light) => { light.intensity = lightsOn ? (light === lights.current.ambient ? 1.1 : light === lights.current.key ? 4.6 : 5) : 0.15 })
    renderScene.current?.()
  }, [lightsOn])

  useEffect(() => {
    const state = explosion.current
    if (!state) return
    cancelAnimationFrame(state.getFrame())
    const start = performance.now()
    const starts = state.parts.map(({ node }) => node.position.clone())
    const duration = 620
    const animateExplosion = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      state.parts.forEach((part, index) => part.node.position.lerpVectors(starts[index], exploded ? part.target : part.origin, eased))
      state.render()
      if (progress < 1) state.setFrame(requestAnimationFrame(animateExplosion))
      else {
        state.renderer.shadowMap.needsUpdate = true
        state.render()
      }
    }
    state.setFrame(requestAnimationFrame(animateExplosion))
    return () => cancelAnimationFrame(state.getFrame())
  }, [exploded])

  useEffect(() => {
    if (!view.current || resetVersion === 0) return
    view.current.camera.position.set(7.6, 4.2, 8.5)
    view.current.controls.target.set(0, 1.2, 0)
    view.current.controls.update()
    view.current.render()
  }, [resetVersion])

  return <div className="field-test-canvas" ref={mount} />
}

export default function FieldTestPage() {
  const [lightsOn, setLightsOn] = useState(true)
  const [exploded, setExploded] = useState(false)
  const [status, setStatus] = useState('LOADING MODEL')
  const [resetVersion, setResetVersion] = useState(0)
  const handleReady = useCallback(() => setStatus('LIVE / READY'), [])
  const handleError = useCallback(() => setStatus('MODEL LOAD ERROR'), [])
  return <main className="field-test-page">
    <Scene lightsOn={lightsOn} exploded={exploded} resetVersion={resetVersion} onReady={handleReady} onError={handleError} />
    <div className="field-test-vignette" />
    <header className="field-test-header"><p className="eyebrow">VOLVO CE / DIGITAL LAB</p><h1>Night shift<br /><em>field test</em></h1><p className="dek">A working study of 42081 — framed in light, shadow, and motion.</p></header>
    <div className="field-test-meta"><span>01</span><span>CONSTRUCTION / 2019</span><span className="status"><i />{status}</span></div>
    <aside className="field-test-panel"><p className="eyebrow">MODEL / 42081-1</p><h2>Rough terrain<br />loader</h2><dl><div><dt>SCENE</dt><dd>01 / 03</dd></div><div><dt>MATERIAL</dt><dd>PHYSICAL / PBR</dd></div><div><dt>LIGHTING</dt><dd>{lightsOn ? 'NIGHT SHIFT' : 'LOW POWER'}</dd></div></dl><div className="field-test-actions"><button onClick={() => setExploded((value) => !value)}>{exploded ? 'Assemble' : 'Explode'}</button><button onClick={() => setLightsOn((value) => !value)}>{lightsOn ? 'Dim lights' : 'Bring up lights'}</button><button onClick={() => setResetVersion((value) => value + 1)}>Reset view</button></div></aside>
    <p className="field-test-hint">DRAG TO ORBIT &nbsp;·&nbsp; SCROLL TO ZOOM</p>
  </main>
}

import { useEffect, useRef, useState } from 'react'
import { TearRenderer } from './reality-tear/TearRenderer'
import { cameraPoint, pinchRatio, HandGrips } from './reality-tear/gesture'
import './reality-tear/reality-tear.css'

function Icon({ name }) {
  const paths = {
    camera: <><rect x="3" y="6" width="18" height="14" rx="3" /><path d="m8 6 2-3h4l2 3" /><circle cx="12" cy="13" r="4" /></>,
    flip: <><path d="M20 8a8 8 0 0 0-14-2L3 9m0-6v6h6M4 16a8 8 0 0 0 14 2l3-3m0 6v-6h-6" /></>,
    reset: <><path d="M3 10a9 9 0 1 1 1 7M3 4v6h6" /></>,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  }
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

// Lets go of the sheet with both hands and forgets them.
function releaseHands(r) {
  r.grips.reset(); r.hands = []
  for (const slot of [0, 1]) r.engine.release(`hand-${slot}`)
}

export default function RealityTearPage() {
  const canvas = useRef(null)
  const video = useRef(null)
  const markers = useRef([])
  const runtime = useRef(null)
  const [mode, setMode] = useState('intro')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [fatal, setFatal] = useState(false)
  const [facing, setFacing] = useState('user')

  useEffect(() => {
    let engine
    try { engine = new TearRenderer(canvas.current) } catch {
      setFatal(true)
      setError('This browser could not start the 3D effect. Try Safari or Chrome with graphics acceleration enabled.')
      return
    }
    const r = {
      engine, grips: new HandGrips(), mode: 'intro', generation: 0,
      stream: null, worker: null, workerReady: false, busy: false,
      hands: [], pointers: new Map(), mirror: true, lastFrame: 0, lastDetect: 0,
    }
    runtime.current = r
    const resize = () => engine.resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas.current)
    const frame = now => {
      const delta = Math.min((now - (r.lastFrame || now)) / 1000, .05)
      r.lastFrame = now
      if (r.mode === 'intro') engine.playIntro(now / 1000)
      // Each pinching hand holds the sheet where its fingertips meet.
      r.hands = r.grips.advance(delta)
      const w = canvas.current.clientWidth, h = canvas.current.clientHeight
      if (r.mode === 'live') {
        for (const slot of [0, 1]) {
          const key = `hand-${slot}`
          const hand = r.hands.find(p => p.slot === slot)
          if (hand?.pinched) {
            if (engine.isHeld(key)) engine.moveGrab(key, hand.x * w, hand.y * h)
            else engine.grab(key, hand.x * w, hand.y * h)
          } else if (engine.isHeld(key)) engine.release(key)
        }
      }
      engine.render(now / 1000, delta)
      for (const slot of [0, 1]) {
        const el = markers.current[slot]
        if (!el) continue
        const hand = r.hands.find(p => p.slot === slot)
        el.style.opacity = hand && r.mode === 'live' ? '1' : '0'
        if (!hand) continue
        el.style.transform = `translate(${hand.x * w}px, ${hand.y * h}px)`
        el.dataset.pinched = hand.pinched
      }
      if (r.workerReady && !r.busy && r.mode === 'live' && now - r.lastDetect > 65 && video.current?.readyState >= 2) {
        r.busy = true; r.lastDetect = now
        const generation = r.generation
        const v = video.current
        createImageBitmap(v, { resizeWidth: Math.round(v.videoWidth * Math.min(1, 640 / Math.max(v.videoWidth, v.videoHeight))), resizeHeight: Math.round(v.videoHeight * Math.min(1, 640 / Math.max(v.videoWidth, v.videoHeight))) })
          .then(bitmap => {
            if (r.generation !== generation || !r.worker) { bitmap.close(); return }
            r.worker.postMessage({ type: 'frame', frame: bitmap, time: now }, [bitmap])
          }).catch(() => {
            if (r.generation === generation) {
              r.busy = false; r.workerReady = false; releaseHands(r)
              setStatus('Hand tracking unavailable. Drag the screen to tear.')
            }
          })
      }
      if (r.busy && now - r.lastDetect > 6000) {
        r.workerReady = false; r.busy = false; releaseHands(r); r.worker?.terminate(); r.worker = null
        setStatus('Hand tracking stopped. Drag the screen, or restart the camera.')
      }
      r.raf = requestAnimationFrame(frame)
    }
    r.raf = requestAnimationFrame(frame)
    const pause = () => {
      if (document.hidden && r.stream) {
        stopResources(r)
        r.mode = 'intro'; engine.setVideo(null, false)
        setMode('intro'); setLoading(false); setStatus(''); setError('Camera paused. Start it again when you’re ready.')
      }
    }
    document.addEventListener('visibilitychange', pause)
    return () => {
      stopResources(r); cancelAnimationFrame(r.raf)
      observer.disconnect(); document.removeEventListener('visibilitychange', pause)
      engine.dispose(); runtime.current = null
    }
  }, [])

  function stopResources(r) {
    r.generation++
    r.stream?.getTracks().forEach(track => { track.onended = null; track.stop() })
    r.stream = null; r.worker?.terminate(); r.worker = null
    clearTimeout(r.loadTimer)
    r.workerReady = false; r.busy = false; r.pointers.clear()
    releaseHands(r)
  }

  async function startCamera(nextFacing = facing) {
    const r = runtime.current
    if (!r) return
    stopResources(r)
    r.engine.setVideo(null, false)
    const generation = r.generation
    setLoading(true); setError(''); setStatus('Opening camera…')
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw new Error('Open this page over HTTPS to use the camera.')
      const portrait = window.innerHeight > window.innerWidth
      const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: {
        facingMode: { ideal: nextFacing }, width: { ideal: portrait ? 720 : 1280 }, height: { ideal: portrait ? 1280 : 720 }, aspectRatio: { ideal: window.innerWidth / window.innerHeight }, frameRate: { ideal: 30, max: 30 },
      } })
      if (r.generation !== generation) { stream.getTracks().forEach(t => t.stop()); return }
      r.stream = stream
      const actualFacing = stream.getVideoTracks()[0].getSettings().facingMode || nextFacing
      r.mirror = actualFacing === 'user'; setFacing(actualFacing)
      video.current.srcObject = stream
      await video.current.play()
      if (r.generation !== generation) return
      r.engine.setVideo(video.current, r.mirror)
      r.mode = 'live'; r.engine.reset(); releaseHands(r); setMode('live'); setLoading(false)
      setStatus('Loading hand tracking… You can already drag to tear.')
      stream.getVideoTracks()[0].onended = () => {
        stopResources(r); r.mode = 'intro'; r.engine.setVideo(null, false)
        setMode('intro'); setError('Camera disconnected. Reconnect it and try again.')
      }
      try {
        r.worker = new Worker('/hand-tracking/worker.js')
        const trackingFailed = () => {
          if (r.generation !== generation) return
          clearTimeout(r.loadTimer); r.workerReady = false; r.busy = false; releaseHands(r)
          r.worker?.terminate(); r.worker = null
          setStatus('Hand tracking unavailable. Drag the screen, or restart the camera.')
        }
        r.worker.onerror = trackingFailed
        r.loadTimer = setTimeout(trackingFailed, 45000)
        r.worker.onmessage = ({ data }) => {
          if (r.generation !== generation) return
          if (data.type === 'ready') {
            clearTimeout(r.loadTimer); r.workerReady = true
            setStatus('Pinch your thumb and index finger to grab reality.')
          } else if (data.type === 'hands') {
            r.busy = false
            const aspect = canvas.current.clientWidth / canvas.current.clientHeight
            r.grips.detect(data.landmarks.map(hand => {
              const p = { x: (hand[4].x + hand[8].x) / 2, y: (hand[4].y + hand[8].y) / 2 }
              return { ...cameraPoint(p, video.current.videoWidth / video.current.videoHeight, aspect, r.mirror), ratio: pinchRatio(hand) }
            }))
            if (!r.pointers.size) {
              const held = r.grips.advance(0).filter(p => p.pinched).length
              setStatus(held ? (r.engine.torn > 0 ? 'Keep pulling. Let go to leave it open.' : 'Pull to stretch it. Pull harder to tear.')
                : r.engine.torn > 0 ? 'Reality is open. Pinch again to tear further.'
                : data.landmarks.length ? 'Pinch your thumb and index finger to grab reality.' : 'Show your hands to the camera.')
            }
          } else if (data.type === 'error') trackingFailed()
        }
        r.worker.postMessage({ type: 'init', base: `${location.origin}/hand-tracking` })
      } catch { setStatus('Hand tracking unavailable. Drag the screen to tear.') }
    } catch (e) {
      if (r.generation !== generation) return
      stopResources(r); r.mode = 'intro'; r.engine.setVideo(null, false)
      setMode('intro'); setLoading(false); setStatus('')
      const messages = {
        NotAllowedError: 'Camera access was declined. Allow it in your browser settings, then try again, or use the preview.',
        NotFoundError: 'No camera found. You can still try the touch preview.',
        NotReadableError: 'The camera is busy. Close other camera apps and try again.',
      }
      setError(messages[e.name] || e.message || 'Could not start the camera. Please try again.')
    }
  }

  function preview() {
    const r = runtime.current
    if (!r) return
    stopResources(r); r.engine.reset(); r.mode = 'preview'; r.engine.setVideo(null, false)
    setMode('preview'); setLoading(false); setError(''); setStatus('Drag to pull the surface. Pull hard to tear it; shift-drag cuts.')
  }

  function reset() {
    const r = runtime.current
    if (!r) return
    r.engine.reset(); r.pointers.clear()
    setStatus(r.mode === 'preview' ? 'Drag to pull the surface. Pull hard to tear it; shift-drag cuts.' : 'Pinch to grab reality, then pull it apart.')
  }

  function stop() {
    const r = runtime.current
    if (!r) return
    stopResources(r); r.mode = 'intro'; r.engine.setVideo(null, false)
    if (video.current) video.current.srcObject = null
    setMode('intro'); setLoading(false); setError(''); setStatus('')
  }

  // A drag holds the sheet where it starts; a shift- or right-drag cuts it.
  function pointerPoint(e) {
    const box = canvas.current.getBoundingClientRect()
    return { x: e.clientX - box.left, y: e.clientY - box.top }
  }

  function pointerDown(e) {
    const r = runtime.current
    if (!r || r.mode === 'intro') return
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = pointerPoint(e)
    const cutting = e.button === 2 || e.shiftKey
    r.pointers.set(e.pointerId, { ...p, cutting })
    if (!cutting) r.engine.grab(`pointer-${e.pointerId}`, p.x, p.y)
  }

  function pointerMove(e) {
    const r = runtime.current
    const pointer = r?.pointers.get(e.pointerId)
    if (!pointer) return
    const p = pointerPoint(e)
    if (pointer.cutting) r.engine.cut(pointer.x, pointer.y, p.x, p.y)
    else r.engine.moveGrab(`pointer-${e.pointerId}`, p.x, p.y)
    r.pointers.set(e.pointerId, { ...p, cutting: pointer.cutting })
    setStatus(pointer.cutting ? 'Cutting.' : r.engine.torn > 0 ? 'Keep pulling. Let go to leave it open.' : 'Pull harder to tear it.')
  }

  function pointerUp(e) {
    const r = runtime.current
    if (!r?.pointers.has(e.pointerId)) return
    r.pointers.delete(e.pointerId)
    r.engine.release(`pointer-${e.pointerId}`)
    if (r.engine.torn > 0) setStatus('Reality is open. Drag again to tear further.')
  }

  return <main className={`reality-tear reality-tear--${mode}`}>
    <video ref={video} muted playsInline autoPlay className="rt-video" aria-hidden="true" />
    <canvas ref={canvas} className="rt-canvas" aria-label="Interactive reality tear. Drag to pull the surface apart." onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onContextMenu={e => e.preventDefault()} />
    <div className="rt-vignette" />
    <header className="rt-header">
      <a href="/" className="rt-wordmark" aria-label="Back to experiments"><span className="rt-symbol">⸬</span> REALITY<span className="rt-wordmark-light"> / TEAR</span></a>
      <span className="rt-mode"><i />{mode === 'live' ? 'CAMERA LIVE' : mode === 'preview' ? 'TOUCH PREVIEW' : 'AN EXPERIMENT'}</span>
    </header>
    {mode === 'intro' ? <>
      <section className="rt-intro">
        <p className="rt-eyebrow">THERE’S SOMETHING UNDERNEATH.</p>
        <h1>Reality is<br /><em>paper thin.</em></h1>
        <p className="rt-description">Grab it with your hands.<br />Pull it apart. See what’s behind.</p>
      </section>
      <div className="rt-start">
        {error && <p className="rt-error" role="alert">{error}</p>}
        <button className="rt-primary" onClick={() => startCamera()} disabled={loading || fatal}><Icon name="camera" /><span>{loading ? 'Opening camera…' : 'Open your camera'}</span><Icon name="arrow" /></button>
        <button className="rt-preview-button" onClick={preview} disabled={fatal}>Try it with touch first <span>↗</span></button>
        <p className="rt-privacy">Your camera stays on your device.</p>
      </div>
      <footer className="rt-intro-footer"><span>01 / BREAK THE SURFACE</span><span>PINCH → PULL → REVEAL</span></footer>
    </> : <>
      {[0, 1].map(i => <div key={i} ref={el => { markers.current[i] = el }} className="rt-grip" aria-hidden="true"><span /><i /></div>)}
      <div className="rt-live-footer">
        <p className="rt-instruction" role="status">{status}</p>
        {mode === 'live' && <p className="rt-tip">Prop up your phone to free both hands. Touch works too.</p>}
        <div className="rt-controls">
          <button onClick={reset}><Icon name="reset" /><span>Reset</span></button>
          {mode === 'live' ? <button onClick={() => startCamera(facing === 'user' ? 'environment' : 'user')} disabled={loading}><Icon name="flip" /><span>{loading ? 'Switching…' : 'Flip camera'}</span></button> : <button onClick={() => startCamera()} disabled={loading}><Icon name="camera" /><span>{loading ? 'Opening…' : 'Use camera'}</span></button>}
          <button onClick={stop}><Icon name="close" /><span>{mode === 'live' ? 'Stop' : 'Exit'}</span></button>
        </div>
      </div>
    </>}
  </main>
}

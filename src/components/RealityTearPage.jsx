import { useEffect, useRef, useState } from 'react'
import { TearRenderer } from './reality-tear/TearRenderer'
import { cameraPoint, pinchRatio, TearGesture, clamp } from './reality-tear/gesture'
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
      engine, gesture: new TearGesture(), mode: 'intro', generation: 0,
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
      let target = r.gesture.width, center = r.gesture.center
      if (r.mode === 'intro') {
        target = .24 + Math.sin(now / 2200) * .035
        center = { x: .66, y: .46 }
      }
      engine.render(now / 1000, delta, target, center)
      r.hands.forEach((point, i) => {
        const el = markers.current[i]
        if (!el) return
        el.style.transform = `translate(${point.x * canvas.current.clientWidth}px, ${point.y * canvas.current.clientHeight}px)`
        el.dataset.pinched = point.pinched
        el.style.opacity = r.mode === 'live' ? '1' : '0'
      })
      for (let i = r.hands.length; i < 2; i++) if (markers.current[i]) markers.current[i].style.opacity = '0'
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
              r.busy = false; r.workerReady = false; r.hands = []; r.gesture.release()
              setStatus('Hand tracking unavailable. Drag the screen to tear.')
            }
          })
      }
      if (r.busy && now - r.lastDetect > 6000) {
        r.workerReady = false; r.busy = false; r.hands = []; r.gesture.release(); r.worker?.terminate(); r.worker = null
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
    r.workerReady = false; r.busy = false; r.hands = []; r.pointers.clear()
    r.gesture.release()
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
      r.mode = 'live'; r.gesture.reset(); setMode('live'); setLoading(false)
      setStatus('Loading hand tracking… You can already drag to tear.')
      stream.getVideoTracks()[0].onended = () => {
        stopResources(r); r.mode = 'intro'; r.engine.setVideo(null, false)
        setMode('intro'); setError('Camera disconnected. Reconnect it and try again.')
      }
      try {
        r.worker = new Worker('/hand-tracking/worker.js')
        const trackingFailed = () => {
          if (r.generation !== generation) return
          clearTimeout(r.loadTimer); r.workerReady = false; r.busy = false; r.hands = []; r.gesture.release()
          r.worker?.terminate(); r.worker = null
          setStatus('Hand tracking unavailable. Drag the screen, or restart the camera.')
        }
        r.worker.onerror = trackingFailed
        r.loadTimer = setTimeout(trackingFailed, 45000)
        r.worker.onmessage = ({ data }) => {
          if (r.generation !== generation) return
          if (data.type === 'ready') {
            clearTimeout(r.loadTimer); r.workerReady = true
            setStatus('Show both hands. Pinch your thumbs and index fingers.')
          } else if (data.type === 'hands') {
            r.busy = false
            const aspect = canvas.current.clientWidth / canvas.current.clientHeight
            const points = data.landmarks.map(hand => {
              const p = { x: (hand[4].x + hand[8].x) / 2, y: (hand[4].y + hand[8].y) / 2 }
              return { ...cameraPoint(p, video.current.videoWidth / video.current.videoHeight, aspect, r.mirror), ratio: pinchRatio(hand) }
            }).sort((a, b) => a.x - b.x).map((p, i) => ({ ...p, pinched: p.ratio < (r.hands[i]?.pinched ? .58 : .4) }))
            r.hands = points
            if (!r.pointers.size) {
              const grabbed = r.gesture.update(points)
              setStatus(grabbed ? 'Pull your hands apart.' : r.gesture.width > .02 ? 'Reality is open. Pinch again to pull further.' : points.length < 2 ? 'Show both hands. Pinch your thumbs and index fingers.' : 'Pinch with both hands, then pull apart.')
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
    stopResources(r); r.gesture.reset(); r.mode = 'preview'; r.engine.setVideo(null, false)
    setMode('preview'); setLoading(false); setError(''); setStatus('Drag anywhere to pull the surface apart.')
  }

  function reset() {
    const r = runtime.current
    if (!r) return
    r.gesture.reset(); r.pointers.clear()
    setStatus(r.mode === 'preview' ? 'Drag anywhere to pull the surface apart.' : 'Show both hands. Pinch, then pull apart.')
  }

  function stop() {
    const r = runtime.current
    if (!r) return
    stopResources(r); r.mode = 'intro'; r.engine.setVideo(null, false)
    if (video.current) video.current.srcObject = null
    setMode('intro'); setLoading(false); setError(''); setStatus('')
  }

  function pointerDown(e) {
    const r = runtime.current
    if (!r || r.mode === 'intro' || r.pointers.size >= 2) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const point = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight }
    if (!r.pointers.size) {
      r.gesture.release()
      r.dragOrigin = point; r.dragWidth = r.gesture.width
      if (r.gesture.width < .01) r.gesture.center = { x: clamp(point.x, .2, .8), y: clamp(point.y, .2, .8) }
    }
    r.pointers.set(e.pointerId, { ...point, pinched: true })
    if (r.pointers.size === 2) r.gesture.update([...r.pointers.values()])
  }

  function pointerMove(e) {
    const r = runtime.current
    if (!r?.pointers.has(e.pointerId)) return
    const p = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight, pinched: true }
    r.pointers.set(e.pointerId, p)
    if (r.pointers.size === 2) r.gesture.update([...r.pointers.values()])
    else r.gesture.width = Math.max(r.gesture.width, clamp(r.dragWidth + Math.hypot(p.x - r.dragOrigin.x, (p.y - r.dragOrigin.y) * .6) * 1.65, 0, .86))
    setStatus('Keep pulling. Release to leave the tear open.')
  }

  function pointerUp(e) {
    const r = runtime.current
    if (!r?.pointers.has(e.pointerId)) return
    r.pointers.delete(e.pointerId); r.gesture.release()
    if (r.pointers.size) {
      r.dragOrigin = [...r.pointers.values()][0]; r.dragWidth = r.gesture.width
    }
    setStatus('Reality is open. Drag again to pull further.')
  }

  return <main className={`reality-tear reality-tear--${mode}`}>
    <video ref={video} muted playsInline autoPlay className="rt-video" aria-hidden="true" />
    <canvas ref={canvas} className="rt-canvas" aria-label="Interactive reality tear. Drag to open the surface." onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} />
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

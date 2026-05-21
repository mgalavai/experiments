import { useCallback, useEffect, useRef, useState } from 'react'
import './window-shake.css'

const FRAME_THICKNESS = 18
const WINDOW_CONFIGS = [
  {
    id: 'console',
    title: 'Physics Console',
    subtitle: 'Impulse stream',
    x: 88,
    y: 92,
    width: 286,
    height: 188,
    vx: 58,
    vy: 24,
    hue: 'amber',
  },
  {
    id: 'graph',
    title: 'Collision Scope',
    subtitle: 'X/Y response',
    x: 514,
    y: 78,
    width: 336,
    height: 226,
    vx: -46,
    vy: 38,
    hue: 'cyan',
  },
  {
    id: 'memo',
    title: 'Pinned Note',
    subtitle: 'Drag me',
    x: 334,
    y: 346,
    width: 244,
    height: 164,
    vx: 36,
    vy: -30,
    hue: 'rose',
  },
]
const INITIAL_METRICS = {
  impacts: 0,
  energy: 32,
  shake: 0,
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function makeBody(config) {
  return {
    ...config,
    rotation: 0,
    spin: 0,
  }
}

function getSimulationBounds(desktop) {
  if (!desktop) {
    return {
      width: 980,
      height: 620,
      left: 0,
      top: 0,
    }
  }

  const rect = desktop.getBoundingClientRect()
  return {
    width: rect.width,
    height: rect.height,
    left: rect.left,
    top: rect.top,
  }
}

function WindowPanel({ body, nodeRef, onPointerDown }) {
  return (
    <article
      ref={nodeRef}
      className={`shake-window shake-window--${body.hue}`}
      style={{
        '--panel-width': `${body.width}px`,
        '--panel-height': `${body.height}px`,
      }}
      onPointerDown={(event) => onPointerDown(event, body.id)}
    >
      <header className="shake-window__bar">
        <div className="shake-window__lights" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div>
          <h2>{body.title}</h2>
          <p>{body.subtitle}</p>
        </div>
      </header>
      <div className="shake-window__body">
        {body.id === 'console' ? (
          <div className="shake-console" aria-hidden="true">
            <span>rigid.body.applyImpulse(vec2.random())</span>
            <span>viewport.restitution = 0.82</span>
            <span>shake.decay *= deltaTime</span>
            <span>status: delightfully unstable</span>
          </div>
        ) : null}
        {body.id === 'graph' ? (
          <div className="shake-scope" aria-hidden="true">
            {Array.from({ length: 28 }).map((_, index) => (
              <span key={index} style={{ '--bar-height': `${28 + ((index * 19) % 68)}%` }} />
            ))}
          </div>
        ) : null}
        {body.id === 'memo' ? (
          <div className="shake-note">
            <span>Impact budget</span>
            <strong>Shake until the desktop answers back.</strong>
          </div>
        ) : null}
      </div>
    </article>
  )
}

export default function WindowShakePage() {
  const desktopRef = useRef(null)
  const frameRef = useRef(null)
  const bodyRefs = useRef({})
  const bodiesRef = useRef(WINDOW_CONFIGS.map(makeBody))
  const dragRef = useRef(null)
  const lastTimeRef = useRef(0)
  const metricsRef = useRef(INITIAL_METRICS)
  const [metrics, setMetrics] = useState(INITIAL_METRICS)
  const [isGravityEnabled, setIsGravityEnabled] = useState(true)
  const [isSlowMotion, setIsSlowMotion] = useState(false)

  const syncMetrics = useCallback(() => {
    setMetrics({ ...metricsRef.current })
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 })
  }, [])

  const applyShake = useCallback((strength = 22) => {
    metricsRef.current.shake = Math.min(100, metricsRef.current.shake + strength)
    bodiesRef.current.forEach((body, index) => {
      const direction = index % 2 === 0 ? 1 : -1
      body.vx += direction * (160 + strength * 5)
      body.vy -= 90 + strength * 3
      body.spin += direction * (58 + strength)
    })
    syncMetrics()
  }, [syncMetrics])

  const resetExperiment = useCallback(() => {
    bodiesRef.current = WINDOW_CONFIGS.map(makeBody)
    dragRef.current = null
    metricsRef.current = INITIAL_METRICS
    syncMetrics()
  }, [syncMetrics])

  const handlePointerDown = useCallback((event, bodyId) => {
    const desktop = desktopRef.current
    if (!desktop) return

    const body = bodiesRef.current.find((item) => item.id === bodyId)
    if (!body) return

    const bounds = getSimulationBounds(desktop)

    dragRef.current = {
      id: bodyId,
      offsetX: event.clientX - bounds.left - body.x,
      offsetY: event.clientY - bounds.top - body.y,
      lastX: body.x,
      lastY: body.y,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }, [])

  useEffect(() => {
    const onPointerMove = (event) => {
      const drag = dragRef.current
      const desktop = desktopRef.current
      if (!drag || !desktop) return

      const body = bodiesRef.current.find((item) => item.id === drag.id)
      if (!body) return

      const bounds = getSimulationBounds(desktop)
      const maxX = Math.max(FRAME_THICKNESS, bounds.width - body.width - FRAME_THICKNESS)
      const maxY = Math.max(FRAME_THICKNESS, bounds.height - body.height - FRAME_THICKNESS)
      const nextX = clamp(event.clientX - bounds.left - drag.offsetX, FRAME_THICKNESS, maxX)
      const nextY = clamp(event.clientY - bounds.top - drag.offsetY, FRAME_THICKNESS, maxY)

      body.vx = (nextX - drag.lastX) * 12
      body.vy = (nextY - drag.lastY) * 12
      body.x = nextX
      body.y = nextY
      body.spin = body.vx * 0.04
      drag.lastX = nextX
      drag.lastY = nextY
      metricsRef.current.shake = Math.min(100, metricsRef.current.shake + 0.8)
    }

    const onPointerUp = () => {
      dragRef.current = null
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    }
  }, [])

  useEffect(() => {
    let frameId
    let metricFrame = 0

    const tick = (time) => {
      const previousTime = lastTimeRef.current || time
      lastTimeRef.current = time
      const timeScale = isSlowMotion ? 0.35 : 1
      const dt = Math.min((time - previousTime) / 1000, 0.035) * timeScale
      const gravity = isGravityEnabled ? 360 : 0
      const bodies = bodiesRef.current
      const bounds = getSimulationBounds(desktopRef.current)
      let impactThisFrame = false

      bodies.forEach((body) => {
        const isDragging = dragRef.current?.id === body.id

        if (!isDragging) {
          body.vy += gravity * dt
          body.x += body.vx * dt
          body.y += body.vy * dt
          body.rotation += body.spin * dt
          body.vx *= 0.992
          body.vy *= 0.992
          body.spin *= 0.986
        }

        const maxX = Math.max(FRAME_THICKNESS, bounds.width - FRAME_THICKNESS - body.width)
        const maxY = Math.max(FRAME_THICKNESS, bounds.height - FRAME_THICKNESS - body.height)

        if (body.x < FRAME_THICKNESS || body.x > maxX) {
          body.x = clamp(body.x, FRAME_THICKNESS, maxX)
          body.vx *= -0.82
          body.spin += body.vy * 0.08
          impactThisFrame = true
        }

        if (body.y < FRAME_THICKNESS || body.y > maxY) {
          body.y = clamp(body.y, FRAME_THICKNESS, maxY)
          body.vy *= -0.78
          body.spin -= body.vx * 0.06
          impactThisFrame = true
        }
      })

      for (let leftIndex = 0; leftIndex < bodies.length; leftIndex += 1) {
        for (let rightIndex = leftIndex + 1; rightIndex < bodies.length; rightIndex += 1) {
          const left = bodies[leftIndex]
          const right = bodies[rightIndex]
          const overlapX = Math.min(left.x + left.width, right.x + right.width) - Math.max(left.x, right.x)
          const overlapY = Math.min(left.y + left.height, right.y + right.height) - Math.max(left.y, right.y)

          if (overlapX > 0 && overlapY > 0) {
            const pushX = overlapX / 2 + 0.5
            const pushY = overlapY / 2 + 0.5

            if (overlapX < overlapY) {
              const direction = left.x < right.x ? -1 : 1
              left.x += direction * pushX
              right.x -= direction * pushX
              const leftVelocity = left.vx
              left.vx = right.vx * 0.84
              right.vx = leftVelocity * 0.84
            } else {
              const direction = left.y < right.y ? -1 : 1
              left.y += direction * pushY
              right.y -= direction * pushY
              const leftVelocity = left.vy
              left.vy = right.vy * 0.8
              right.vy = leftVelocity * 0.8
            }

            left.spin -= 32
            right.spin += 32
            impactThisFrame = true
          }
        }
      }

      if (impactThisFrame) {
        metricsRef.current.impacts += 1
        metricsRef.current.shake = Math.min(100, metricsRef.current.shake + 7)
      }

      metricsRef.current.shake *= 0.94
      metricsRef.current.energy = Math.round(
        bodies.reduce((total, body) => total + Math.abs(body.vx) + Math.abs(body.vy), 0) / 16,
      )

      bodies.forEach((body) => {
        const node = bodyRefs.current[body.id]
        if (node) {
          node.style.transform = `translate3d(${body.x}px, ${body.y}px, 0) rotate(${body.rotation}deg)`
        }
      })

      if (frameRef.current) {
        const shake = metricsRef.current.shake
        const wobbleX = Math.sin(time * 0.032) * shake * 0.09
        const wobbleY = Math.cos(time * 0.041) * shake * 0.06
        frameRef.current.style.transform = `translate3d(${wobbleX}px, ${wobbleY}px, 0)`
        frameRef.current.style.setProperty('--shake-level', `${Math.round(shake)}%`)
      }

      metricFrame += 1
      if (metricFrame % 8 === 0) syncMetrics()
      frameId = window.requestAnimationFrame(tick)
    }

    frameId = window.requestAnimationFrame(tick)
    return () => {
      window.cancelAnimationFrame(frameId)
      lastTimeRef.current = 0
    }
  }, [isGravityEnabled, isSlowMotion, syncMetrics])

  return (
    <main className="window-shake-page">
      <section className="shake-lab" aria-label="Physics engine window shake experiment">
        <div className="shake-panel">
          <div className="shake-kicker">Experiment 05</div>
          <h1>Physics Engine Window Shake</h1>
          <p>
            Desktop panels behave like small rigid bodies: drag one, let it collide, or punch the system with an impulse and watch the chrome rattle.
          </p>
          <div className="shake-controls" aria-label="Experiment controls">
            <button type="button" onClick={() => applyShake(30)}>
              Shake
            </button>
            <button type="button" aria-pressed={isGravityEnabled} onClick={() => setIsGravityEnabled((value) => !value)}>
              Gravity
            </button>
            <button type="button" aria-pressed={isSlowMotion} onClick={() => setIsSlowMotion((value) => !value)}>
              Slow
            </button>
            <button type="button" onClick={resetExperiment}>
              Reset
            </button>
          </div>
          <div className="shake-readout" aria-label="Simulation metrics">
            <span>
              <strong>{metrics.impacts}</strong>
              impacts
            </span>
            <span>
              <strong>{metrics.energy}</strong>
              energy
            </span>
            <span>
              <strong>{Math.round(metrics.shake)}</strong>
              shake
            </span>
          </div>
        </div>

        <div className="shake-desktop" ref={desktopRef}>
          <div className="shake-desktop__frame" ref={frameRef}>
            <div className="shake-wallpaper" aria-hidden="true" />
            <div className="shake-frame-label">bounded viewport / restitution 0.82 / drag enabled</div>
            {WINDOW_CONFIGS.map((body) => (
              <WindowPanel
                key={body.id}
                body={body}
                nodeRef={(node) => {
                  bodyRefs.current[body.id] = node
                }}
                onPointerDown={handlePointerDown}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

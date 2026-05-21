import { useCallback, useEffect, useRef } from 'react'
import './window-shake.css'

const FRAME_THICKNESS = 18
const WINDOW_MOTION_GAIN = 34
const WINDOW_MOTION_THRESHOLD = 0.65
const GRAVITY = 390
const BALL_CONFIGS = [
  { id: 'violet-a', x: 138, y: 142, radius: 39, vx: 54, vy: 12, color: '#3814a5', glow: '#7758ff' },
  { id: 'teal-a', x: 238, y: 170, radius: 42, vx: -34, vy: 18, color: '#007f80', glow: '#34e6de' },
  { id: 'red-a', x: 314, y: 178, radius: 40, vx: 28, vy: -16, color: '#8e0505', glow: '#ff4b38' },
  { id: 'green-a', x: 405, y: 210, radius: 35, vx: -42, vy: 20, color: '#0b8d20', glow: '#58ff45' },
  { id: 'orange-a', x: 105, y: 258, radius: 48, vx: 18, vy: -22, color: '#d8400c', glow: '#ffaf54' },
  { id: 'yellow-a', x: 210, y: 270, radius: 49, vx: -18, vy: 26, color: '#9b7701', glow: '#fff25a' },
  { id: 'red-b', x: 320, y: 292, radius: 42, vx: 22, vy: 18, color: '#b50808', glow: '#ff6861' },
  { id: 'lime-a', x: 432, y: 304, radius: 47, vx: -22, vy: 14, color: '#9ab306', glow: '#fbff52' },
  { id: 'cyan-a', x: 540, y: 304, radius: 43, vx: 24, vy: -18, color: '#00a9a8', glow: '#72ffff' },
  { id: 'green-b', x: 640, y: 302, radius: 46, vx: -38, vy: 12, color: '#009038', glow: '#58ff8d' },
  { id: 'green-c', x: 144, y: 400, radius: 43, vx: 34, vy: -14, color: '#0a9914', glow: '#72ff55' },
  { id: 'magenta-a', x: 235, y: 412, radius: 45, vx: -28, vy: 12, color: '#8f009f', glow: '#ff75fa' },
  { id: 'blue-a', x: 336, y: 420, radius: 48, vx: 24, vy: -20, color: '#0732a6', glow: '#3d83ff' },
  { id: 'amber-a', x: 446, y: 414, radius: 44, vx: -14, vy: 16, color: '#a56f00', glow: '#ffd24f' },
  { id: 'teal-b', x: 552, y: 420, radius: 47, vx: 16, vy: -12, color: '#008b86', glow: '#65fff6' },
  { id: 'violet-b', x: 658, y: 422, radius: 49, vx: -20, vy: 14, color: '#2410a3', glow: '#6748ff' },
  { id: 'pink-a', x: 116, y: 518, radius: 44, vx: 22, vy: -10, color: '#de14a5', glow: '#ff9bf5' },
  { id: 'copper-a', x: 218, y: 538, radius: 43, vx: -16, vy: 8, color: '#a94912', glow: '#ffc07c' },
  { id: 'blue-b', x: 326, y: 534, radius: 47, vx: 18, vy: -8, color: '#003ea8', glow: '#57a9ff' },
  { id: 'green-d', x: 436, y: 538, radius: 45, vx: -20, vy: 10, color: '#00894a', glow: '#5dffa5' },
  { id: 'green-e', x: 542, y: 534, radius: 46, vx: 18, vy: -8, color: '#029056', glow: '#68ffb5' },
]

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function makeBall(config) {
  return {
    ...config,
    spin: 0,
    rotation: 0,
  }
}

function getSimulationBounds(stage) {
  if (!stage) {
    return {
      width: 980,
      height: 620,
      left: 0,
      top: 0,
    }
  }

  const rect = stage.getBoundingClientRect()
  return {
    width: rect.width,
    height: rect.height,
    left: rect.left,
    top: rect.top,
  }
}

function getBrowserWindowPosition() {
  return {
    x: window.screenX ?? window.screenLeft ?? 0,
    y: window.screenY ?? window.screenTop ?? 0,
  }
}

function Ball({ ball, nodeRef, onPointerDown }) {
  return (
    <button
      ref={nodeRef}
      type="button"
      className="shake-ball"
      style={{
        '--ball-size': `${ball.radius * 2}px`,
        '--ball-color': ball.color,
        '--ball-glow': ball.glow,
      }}
      aria-label="Physics ball"
      onPointerDown={(event) => onPointerDown(event, ball.id)}
    />
  )
}

export default function WindowShakePage() {
  const stageRef = useRef(null)
  const boxRef = useRef(null)
  const ballRefs = useRef({})
  const ballsRef = useRef(BALL_CONFIGS.map(makeBall))
  const dragRef = useRef(null)
  const lastTimeRef = useRef(0)
  const windowPositionRef = useRef(null)
  const motionRef = useRef(0)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 })
  }, [])

  const applyWindowImpulse = useCallback((deltaX, deltaY, strength) => {
    motionRef.current = Math.min(100, motionRef.current + strength)
    ballsRef.current.forEach((ball, index) => {
      const direction = index % 2 === 0 ? 1 : -1
      ball.vx -= deltaX * WINDOW_MOTION_GAIN
      ball.vy -= deltaY * WINDOW_MOTION_GAIN
      ball.spin += direction * strength * 10 + deltaX * 5
    })
  }, [])

  const handlePointerDown = useCallback((event, ballId) => {
    const stage = stageRef.current
    if (!stage) return

    const ball = ballsRef.current.find((item) => item.id === ballId)
    if (!ball) return

    const bounds = getSimulationBounds(stage)
    dragRef.current = {
      id: ballId,
      offsetX: event.clientX - bounds.left - ball.x,
      offsetY: event.clientY - bounds.top - ball.y,
      lastX: ball.x,
      lastY: ball.y,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }, [])

  useEffect(() => {
    const onPointerMove = (event) => {
      const drag = dragRef.current
      const stage = stageRef.current
      if (!drag || !stage) return

      const ball = ballsRef.current.find((item) => item.id === drag.id)
      if (!ball) return

      const bounds = getSimulationBounds(stage)
      const nextX = clamp(event.clientX - bounds.left - drag.offsetX, FRAME_THICKNESS + ball.radius, bounds.width - FRAME_THICKNESS - ball.radius)
      const nextY = clamp(event.clientY - bounds.top - drag.offsetY, FRAME_THICKNESS + ball.radius, bounds.height - FRAME_THICKNESS - ball.radius)

      ball.vx = (nextX - drag.lastX) * 12
      ball.vy = (nextY - drag.lastY) * 12
      ball.spin = ball.vx * 0.08
      ball.x = nextX
      ball.y = nextY
      drag.lastX = nextX
      drag.lastY = nextY
      motionRef.current = Math.min(100, motionRef.current + 1.2)
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

    const tick = (time) => {
      const previousTime = lastTimeRef.current || time
      lastTimeRef.current = time
      const dt = Math.min((time - previousTime) / 1000, 0.035)
      const balls = ballsRef.current
      const bounds = getSimulationBounds(stageRef.current)
      const currentWindowPosition = getBrowserWindowPosition()
      let impactThisFrame = false

      if (!windowPositionRef.current) {
        windowPositionRef.current = currentWindowPosition
      }

      const windowDeltaX = currentWindowPosition.x - windowPositionRef.current.x
      const windowDeltaY = currentWindowPosition.y - windowPositionRef.current.y
      const windowMotion = Math.hypot(windowDeltaX, windowDeltaY)
      windowPositionRef.current = currentWindowPosition

      if (windowMotion > WINDOW_MOTION_THRESHOLD) {
        applyWindowImpulse(windowDeltaX, windowDeltaY, Math.min(54, windowMotion * 1.6))
      }

      balls.forEach((ball) => {
        const isDragging = dragRef.current?.id === ball.id

        if (!isDragging) {
          ball.vy += GRAVITY * dt
          ball.x += ball.vx * dt
          ball.y += ball.vy * dt
          ball.rotation += ball.spin * dt
          ball.vx *= 0.991
          ball.vy *= 0.991
          ball.spin *= 0.987
        }

        const minX = FRAME_THICKNESS + ball.radius
        const maxX = Math.max(minX, bounds.width - FRAME_THICKNESS - ball.radius)
        const minY = FRAME_THICKNESS + ball.radius
        const maxY = Math.max(minY, bounds.height - FRAME_THICKNESS - ball.radius)

        if (ball.x < minX || ball.x > maxX) {
          ball.x = clamp(ball.x, minX, maxX)
          ball.vx *= -0.84
          ball.spin -= ball.vy * 0.05
          impactThisFrame = true
        }

        if (ball.y < minY || ball.y > maxY) {
          ball.y = clamp(ball.y, minY, maxY)
          ball.vy *= -0.78
          ball.spin += ball.vx * 0.05
          impactThisFrame = true
        }
      })

      for (let leftIndex = 0; leftIndex < balls.length; leftIndex += 1) {
        for (let rightIndex = leftIndex + 1; rightIndex < balls.length; rightIndex += 1) {
          const left = balls[leftIndex]
          const right = balls[rightIndex]
          const dx = right.x - left.x
          const dy = right.y - left.y
          const distance = Math.hypot(dx, dy) || 1
          const minDistance = left.radius + right.radius

          if (distance < minDistance) {
            const nx = dx / distance
            const ny = dy / distance
            const overlap = (minDistance - distance) / 2
            left.x -= nx * overlap
            left.y -= ny * overlap
            right.x += nx * overlap
            right.y += ny * overlap

            const relativeVelocityX = right.vx - left.vx
            const relativeVelocityY = right.vy - left.vy
            const velocityAlongNormal = relativeVelocityX * nx + relativeVelocityY * ny

            if (velocityAlongNormal < 0) {
              const impulse = -(1.68 * velocityAlongNormal) / 2
              const impulseX = impulse * nx
              const impulseY = impulse * ny
              left.vx -= impulseX
              left.vy -= impulseY
              right.vx += impulseX
              right.vy += impulseY
              left.spin -= impulse * 0.8
              right.spin += impulse * 0.8
            }

            impactThisFrame = true
          }
        }
      }

      if (impactThisFrame) {
        motionRef.current = Math.min(100, motionRef.current + 5)
      }

      motionRef.current *= 0.94

      balls.forEach((ball) => {
        const node = ballRefs.current[ball.id]
        if (node) {
          node.style.transform = `translate3d(${ball.x - ball.radius}px, ${ball.y - ball.radius}px, 0) rotate(${ball.rotation}deg)`
        }
      })

      if (boxRef.current) {
        const motion = motionRef.current
        const wobbleX = Math.sin(time * 0.032) * motion * 0.055
        const wobbleY = Math.cos(time * 0.041) * motion * 0.04
        boxRef.current.style.transform = `translate3d(${wobbleX}px, ${wobbleY}px, 0)`
        boxRef.current.style.setProperty('--shake-level', `${Math.round(motion)}%`)
      }

      frameId = window.requestAnimationFrame(tick)
    }

    frameId = window.requestAnimationFrame(tick)
    return () => {
      window.cancelAnimationFrame(frameId)
      lastTimeRef.current = 0
    }
  }, [applyWindowImpulse])

  return (
    <main className="window-shake-page">
      <section className="shake-lab" aria-label="Physics engine window shake experiment">
        <div className="shake-panel">
          <div className="shake-kicker">Experiment 05</div>
          <h1>Physics Engine Window Shake</h1>
          <p>Grab the actual browser window and shake it. The balls lag behind the moving viewport, collide, and pile up inside the box.</p>
        </div>

        <div className="shake-desktop" ref={stageRef}>
          <div className="shake-desktop__frame" ref={boxRef}>
            <div className="shake-wallpaper" aria-hidden="true" />
            {BALL_CONFIGS.map((ball) => (
              <Ball
                key={ball.id}
                ball={ball}
                nodeRef={(node) => {
                  ballRefs.current[ball.id] = node
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

import { useEffect, useRef, useState } from 'react'
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useSpring,
  useTransform,
} from 'motion/react'

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const createHistory = (size, x, y) =>
  Array.from({ length: size }, () => ({
    x,
    y,
  }))

const controls = [
  { key: 'stiffness', label: 'Stiffness', min: 40, max: 220, step: 1 },
  { key: 'damping', label: 'Damping', min: 8, max: 36, step: 1 },
  { key: 'mass', label: 'Mass', min: 0.3, max: 1.8, step: 0.05 },
  { key: 'idleRange', label: 'Idle Range', min: 0.08, max: 0.34, step: 0.01 },
  { key: 'spokeStretch', label: 'Spoke Stretch', min: 0.6, max: 1.8, step: 0.05 },
  { key: 'trailLength', label: 'Trail Length', min: 8, max: 30, step: 1 },
]

function ReactiveNodePage() {
  const stageRef = useRef(null)
  const pointerActiveRef = useRef(false)
  const previousRef = useRef({
    x: 480,
    y: 360,
    speed: 0,
  })
  const [controlsState, setControlsState] = useState({
    stiffness: 120,
    damping: 18,
    mass: 0.75,
    idleRange: 0.18,
    spokeStretch: 1,
    trailLength: 18,
  })

  const pointerX = useMotionValue(480)
  const pointerY = useMotionValue(360)
  const pulseTarget = useMotionValue(0.52)
  const rippleTarget = useMotionValue(0.28)

  const x = useSpring(pointerX, {
    stiffness: controlsState.stiffness,
    damping: controlsState.damping,
    mass: controlsState.mass,
  })
  const y = useSpring(pointerY, {
    stiffness: controlsState.stiffness,
    damping: controlsState.damping,
    mass: controlsState.mass,
  })
  const pulse = useSpring(pulseTarget, {
    stiffness: 220,
    damping: 18,
    mass: 0.48,
  })
  const ripple = useSpring(rippleTarget, {
    stiffness: 140,
    damping: 22,
    mass: 0.75,
  })

  const haloRadius = useTransform(() => 88 + pulse.get() * 22 + ripple.get() * 18)
  const ringRadius = useTransform(() => 126 + ripple.get() * 36)
  const coreScale = useTransform(() => 0.94 + pulse.get() * 0.08)
  const MotionMain = motion.main
  const MotionHeader = motion.header
  const MotionSection = motion.section
  const MotionSpan = motion.span
  const MotionDiv = motion.div

  const [scene, setScene] = useState(() => ({
    width: 960,
    height: 720,
    x: 480,
    y: 360,
    pulse: 0.52,
    ripple: 0.28,
    drift: 0,
    speed: 0,
    trail: createHistory(18, 480, 360),
  }))

  useEffect(() => {
    const stage = stageRef.current

    if (!stage) {
      return undefined
    }

    const resize = () => {
      const { width, height } = stage.getBoundingClientRect()
      const centerX = width * 0.5
      const centerY = height * 0.5

      setScene((current) => ({
        ...current,
        width,
        height,
        x: clamp(current.x, 0, width),
        y: clamp(current.y, 0, height),
        trail: current.trail.map((point) => ({
          x: clamp(point.x, 0, width),
          y: clamp(point.y, 0, height),
        })),
      }))

      if (!pointerActiveRef.current) {
        pointerX.set(centerX)
        pointerY.set(centerY)
      }
    }

    const updatePointer = (event) => {
      const rect = stage.getBoundingClientRect()

      pointerActiveRef.current = true
      pointerX.set(event.clientX - rect.left)
      pointerY.set(event.clientY - rect.top)
      pulseTarget.set(1.08)
    }

    const handleLeave = () => {
      pointerActiveRef.current = false
      pulseTarget.set(0.5)
    }

    resize()
    stage.addEventListener('pointermove', updatePointer)
    stage.addEventListener('pointerdown', updatePointer)
    stage.addEventListener('pointerleave', handleLeave)
    window.addEventListener('resize', resize)

    return () => {
      stage.removeEventListener('pointermove', updatePointer)
      stage.removeEventListener('pointerdown', updatePointer)
      stage.removeEventListener('pointerleave', handleLeave)
      window.removeEventListener('resize', resize)
    }
  }, [pointerX, pointerY, pulseTarget])

  useAnimationFrame((time, delta) => {
    const seconds = time / 1000
    const dt = Math.max(delta / 1000, 1 / 120)
    const { width, height } = scene

    if (!pointerActiveRef.current) {
      const idleX =
        width * 0.5 + Math.cos(seconds * 0.78) * width * controlsState.idleRange
      const idleY =
        height * 0.52 + Math.sin(seconds * 1.18) * height * (controlsState.idleRange + 0.04)

      pointerX.set(idleX)
      pointerY.set(idleY)
      pulseTarget.set(0.46 + Math.sin(seconds * 2.3) * 0.08)
    }

    const currentX = x.get()
    const currentY = y.get()
    const velocity = Math.hypot(
      (currentX - previousRef.current.x) / dt,
      (currentY - previousRef.current.y) / dt,
    )
    const speed = previousRef.current.speed + (velocity - previousRef.current.speed) * 0.14
    const nextRipple = pointerActiveRef.current
      ? clamp(speed / 520, 0.2, 1.9)
      : 0.24 + Math.sin(seconds * 1.6) * 0.05

    rippleTarget.set(nextRipple)

    previousRef.current = {
      x: currentX,
      y: currentY,
      speed,
    }

      setScene((current) => {
      const trail = [...current.trail]
      trail.unshift({ x: currentX, y: currentY })
      trail.pop()

      return {
        ...current,
        x: currentX,
        y: currentY,
        pulse: pulse.get(),
        ripple: ripple.get(),
        speed,
        drift: seconds,
        trail,
      }
      })
  })

  const handleControlChange = (key, value) => {
    if (key === 'trailLength') {
      setScene((current) => {
        const trail = [...current.trail]

        while (trail.length < value) {
          trail.push(trail[trail.length - 1] ?? { x: current.x, y: current.y })
        }

        return {
          ...current,
          trail: trail.slice(0, value),
        }
      })
    }

    setControlsState((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const {
    width,
    height,
    x: currentX,
    y: currentY,
    pulse: pulseValue,
    ripple: rippleValue,
    speed,
    drift,
    trail,
  } = scene
  const dotOffsetX = (currentX - width * 0.5) * -0.025
  const dotOffsetY = (currentY - height * 0.5) * -0.025
  const spokeCount = 14
  const spokes = Array.from({ length: spokeCount }, (_, index) => {
    const angle = (Math.PI * 2 * index) / spokeCount + drift * 0.24
    const spring =
      (72 +
      Math.sin(drift * 2 + index * 0.85) * 16 +
      clamp(speed / 32, 0, 30) +
      pulseValue * 14) *
      controlsState.spokeStretch
    const inner = 19 + Math.cos(drift * 1.55 + index * 0.9) * 3
    const bend = 14 + Math.sin(drift * 2.1 + index * 1.2) * 9
    const bendX = currentX + Math.cos(angle) * (inner + bend)
    const bendY = currentY + Math.sin(angle) * (inner + bend)
    const endX = currentX + Math.cos(angle) * spring
    const endY = currentY + Math.sin(angle) * spring

    return {
      bendX,
      bendY,
      endX,
      endY,
      opacity: 0.34 + ((index + 3) % 5) * 0.1,
    }
  })

  return (
    <MotionMain
      className="reactive-node-page"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <MotionHeader
        className="reactive-node-header"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="reactive-node-kicker">Motion study / spring field</p>
        <h1>Reactive Node</h1>
        <p className="reactive-node-copy">
          A soft, elastic recreation of the reference clip. Move the cursor and the node
          chases it with Motion springs, breathing spokes, and a controlled rebound.
        </p>
      </MotionHeader>

      <MotionSection
        className="reactive-node-shell"
        initial={{ opacity: 0, scale: 0.985 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.18, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="reactive-node-hud" aria-hidden="true">
          <MotionSpan whileHover={{ y: -2 }}>motion.dev</MotionSpan>
          <MotionSpan whileHover={{ y: -2 }}>ghost trail</MotionSpan>
          <MotionSpan whileHover={{ y: -2 }}>cursor guided</MotionSpan>
        </div>

        <div className="reactive-node-stage" ref={stageRef}>
          <MotionDiv
            className="reactive-node-grid"
            style={{
              backgroundPosition: `${dotOffsetX}px ${dotOffsetY}px`,
            }}
          />

          <svg
            className="reactive-node-svg"
            viewBox={`0 0 ${Math.max(width, 1)} ${Math.max(height, 1)}`}
            preserveAspectRatio="none"
            aria-label="Reactive spring node animation"
            role="img"
          >
            <defs>
              <radialGradient id="reactive-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.92)" />
                <stop offset="35%" stopColor="rgba(182,228,255,0.65)" />
                <stop offset="100%" stopColor="rgba(182,228,255,0)" />
              </radialGradient>
              <filter id="reactive-blur" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="10" />
              </filter>
              <filter id="reactive-sharp-glow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="2.8" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {trail.slice(0, -1).map((point, index) => {
              const nextPoint = trail[index + 1]

              return (
                <line
                  key={`trail-${index}`}
                  x1={point.x}
                  y1={point.y}
                  x2={nextPoint.x}
                  y2={nextPoint.y}
                  stroke="rgba(188, 230, 255, 0.18)"
                  strokeWidth={Math.max(0.5, 4.4 - index * 0.22)}
                  strokeLinecap="round"
                />
              )
            })}

            <motion.circle
              cx={x}
              cy={y}
              r={haloRadius}
              fill="url(#reactive-glow)"
              filter="url(#reactive-blur)"
              opacity={0.9}
            />
            <motion.circle
              cx={x}
              cy={y}
              r={ringRadius}
              fill="none"
              stroke="rgba(175, 224, 255, 0.08)"
              strokeWidth="1.5"
            />

            {spokes.map((spoke, index) => (
              <path
                key={`spoke-${index}`}
                d={`M ${currentX} ${currentY} Q ${spoke.bendX} ${spoke.bendY} ${spoke.endX} ${spoke.endY}`}
                fill="none"
                stroke={`rgba(255, 255, 255, ${spoke.opacity})`}
                strokeWidth={index % 3 === 0 ? 2.6 : 1.55}
                strokeLinecap="round"
                filter="url(#reactive-sharp-glow)"
              />
            ))}

            {spokes.map((spoke, index) => (
              <circle
                key={`tip-${index}`}
                cx={spoke.endX}
                cy={spoke.endY}
                r={index % 4 === 0 ? 3.1 : 2.1}
                fill="rgba(255,255,255,0.85)"
                opacity={0.72}
              />
            ))}
          </svg>

          <MotionDiv
            className="reactive-node-core"
            style={{
              left: currentX,
              top: currentY,
              scale: coreScale,
            }}
          >
            <span />
          </MotionDiv>

          <div className="reactive-node-readout">
            <div>
              <span>velocity</span>
              <strong>{speed.toFixed(1)}</strong>
            </div>
            <div>
              <span>pulse</span>
              <strong>{(pulseValue * 100).toFixed(0)}%</strong>
            </div>
            <div>
              <span>tension</span>
              <strong>{(rippleValue * 100).toFixed(0)}%</strong>
            </div>
          </div>

          <aside className="reactive-node-controls">
            <div className="reactive-node-controls-head">
              <span>Live tuning</span>
              <strong>Important parameters</strong>
            </div>
            {controls.map((control) => (
              <label key={control.key} className="reactive-node-control">
                <div>
                  <span>{control.label}</span>
                  <strong>
                    {Number.isInteger(control.step)
                      ? controlsState[control.key].toFixed(0)
                      : controlsState[control.key].toFixed(2)}
                  </strong>
                </div>
                <input
                  type="range"
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  value={controlsState[control.key]}
                  onChange={(event) =>
                    handleControlChange(control.key, Number(event.target.value))
                  }
                />
              </label>
            ))}
          </aside>
        </div>
      </MotionSection>
    </MotionMain>
  )
}

export default ReactiveNodePage

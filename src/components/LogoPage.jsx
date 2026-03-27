import { useRef, useState, useEffect, useCallback } from 'react'
import './logo.css'

/* ── Floyd-Steinberg error-diffusion dithering ── */
function ditherImage(imageData, width, height, opts) {
  const {
    threshold = 128,
    invert = false,
    scale = 0.2,
    contrast = 0,
    gamma = 1.0,
    errorStrength = 1.0,
    serpentine = true,
    cornerRadius = 0,
  } = opts

  // Down-sample
  const sw = Math.max(4, Math.round(width * scale))
  const sh = Math.max(4, Math.round(height * scale))

  const offscreen = document.createElement('canvas')
  offscreen.width = sw
  offscreen.height = sh
  const ctx = offscreen.getContext('2d')

  // Draw source image scaled down
  const src = document.createElement('canvas')
  src.width = width
  src.height = height
  const srcCtx = src.getContext('2d')
  srcCtx.putImageData(imageData, 0, 0)
  ctx.drawImage(src, 0, 0, sw, sh)

  const scaled = ctx.getImageData(0, 0, sw, sh)
  const px = scaled.data

  // Convert to luminance float array
  const lum = new Float32Array(sw * sh)
  for (let i = 0; i < sw * sh; i++) {
    const r = px[i * 4]
    const g = px[i * 4 + 1]
    const b = px[i * 4 + 2]
    const a = px[i * 4 + 3] / 255
    let l = (0.299 * r + 0.587 * g + 0.114 * b) * a + 255 * (1 - a)

    // Contrast
    if (contrast !== 0) {
      const f = (259 * (contrast + 255)) / (255 * (259 - contrast))
      l = f * (l - 128) + 128
    }

    // Gamma
    if (gamma !== 1.0) {
      l = 255 * Math.pow(l / 255, 1 / gamma)
    }

    lum[i] = Math.max(0, Math.min(255, l))
  }

  // Rounded-rect mask
  const rPx = (cornerRadius / 100) * Math.min(sw, sh) * 0.5
  function insideRoundedRect(x, y) {
    if (rPx <= 0) return true
    // Inside the inner cross (no rounding needed)
    const inH = x >= rPx && x <= sw - 1 - rPx
    const inV = y >= rPx && y <= sh - 1 - rPx
    if (inH && inV) return true   // center rect
    if (inH) return y >= 0 && y < sh  // horizontal band (top/bottom edges, no corners)
    if (inV) return x >= 0 && x < sw  // vertical band (left/right edges, no corners)
    // Corner zone — check arc
    const cx = x < rPx ? rPx : sw - 1 - rPx
    const cy = y < rPx ? rPx : sh - 1 - rPx
    const dx = x - cx, dy = y - cy
    return dx * dx + dy * dy <= rPx * rPx
  }

  // Floyd-Steinberg
  const dots = []
  for (let y = 0; y < sh; y++) {
    const leftToRight = serpentine ? y % 2 === 0 : true
    const xStart = leftToRight ? 0 : sw - 1
    const xEnd = leftToRight ? sw : -1
    const xStep = leftToRight ? 1 : -1

    for (let x = xStart; x !== xEnd; x += xStep) {
      const idx = y * sw + x
      if (!insideRoundedRect(x, y)) continue

      const oldVal = lum[idx]
      const newVal = oldVal < threshold ? 0 : 255
      const err = (oldVal - newVal) * errorStrength

      lum[idx] = newVal

      const isDot = invert ? newVal === 255 : newVal === 0
      if (isDot) {
        dots.push({ x: x / sw, y: y / sh })
      }

      // Diffuse error
      if (leftToRight) {
        if (x + 1 < sw) lum[idx + 1] += err * 7 / 16
        if (y + 1 < sh) {
          if (x - 1 >= 0) lum[idx + sw - 1] += err * 3 / 16
          lum[idx + sw] += err * 5 / 16
          if (x + 1 < sw) lum[idx + sw + 1] += err * 1 / 16
        }
      } else {
        if (x - 1 >= 0) lum[idx - 1] += err * 7 / 16
        if (y + 1 < sh) {
          if (x + 1 < sw) lum[idx + sw + 1] += err * 3 / 16
          lum[idx + sw] += err * 5 / 16
          if (x - 1 >= 0) lum[idx + sw - 1] += err * 1 / 16
        }
      }
    }
  }

  return { dots, gridWidth: sw, gridHeight: sh }
}

/* ── Collapsible section ── */
function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="logo-section">
      <button className="logo-section__toggle" onClick={() => setOpen(!open)}>
        <span className="logo-section__chevron" data-open={open}>›</span>
        <span>{title}</span>
      </button>
      {open && <div className="logo-section__body">{children}</div>}
    </div>
  )
}

/* ── Slider control ── */
function Slider({ label, value, onChange, min = 0, max = 100, step = 1, suffix = '' }) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="logo-slider">
      <div className="logo-slider__header">
        <span className="logo-slider__label">{label}</span>
        <span className="logo-slider__value">{typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(2)) : value}{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ '--pct': `${pct}%` }}
      />
    </div>
  )
}

/* ── Main component ── */
export default function LogoPage() {
  const canvasRef = useRef(null)
  const animFrameRef = useRef(null)
  const mouseRef = useRef({ x: -9999, y: -9999, prevX: -9999, prevY: -9999, vx: 0, vy: 0, active: false })
  const dotsRef = useRef([])       // { restX, restY, curX, curY, vx, vy }
  const imgDataRef = useRef(null)
  const imgSizeRef = useRef({ w: 0, h: 0 })

  const [hasImage, setHasImage] = useState(false)
  const [imageVersion, setImageVersion] = useState(0)
  const [dotCount, setDotCount] = useState(0)
  const [gridInfo, setGridInfo] = useState('')

  // Controls
  const [threshold, setThreshold] = useState(101)
  const [invert, setInvert] = useState(false)
  const [scale, setScale] = useState(0.5)
  const [contrast, setContrast] = useState(0)
  const [gamma, setGamma] = useState(1.03)
  const [errorStrength, setErrorStrength] = useState(1.0)
  const [serpentine, setSerpentine] = useState(true)
  const [cornerRadius, setCornerRadius] = useState(20)
  const [renderScale, setRenderScale] = useState(1)
  const [cursorRadius, setCursorRadius] = useState(80)
  const [pushStrength, setPushStrength] = useState(60)
  const [dotSize, setDotSize] = useState(1.6)
  const [canvasSize, setCanvasSize] = useState(850)
  const [explodeStrength, setExplodeStrength] = useState(40)

  // Process uploaded image into dots
  const processDither = useCallback(() => {
    if (!imgDataRef.current) return

    const { w, h } = imgSizeRef.current
    const result = ditherImage(imgDataRef.current, w, h, {
      threshold,
      invert,
      scale,
      contrast,
      gamma,
      errorStrength,
      serpentine,
      cornerRadius,
    })

    const canvasSz = canvasSize
    const margin = 40
    const drawSize = canvasSz - margin * 2
    const aspect = w / h
    const drawW = aspect >= 1 ? drawSize : drawSize * aspect
    const drawH = aspect >= 1 ? drawSize / aspect : drawSize
    const offX = (canvasSz - drawW) / 2
    const offY = (canvasSz - drawH) / 2

    const newDots = result.dots.map((d) => {
      const px = offX + d.x * drawW
      const py = offY + d.y * drawH
      return { restX: px, restY: py, curX: px, curY: py, vx: 0, vy: 0 }
    })

    dotsRef.current = newDots
    setDotCount(newDots.length)
    setGridInfo(`${result.gridWidth}×${result.gridHeight}`)
  }, [threshold, invert, scale, contrast, gamma, errorStrength, serpentine, cornerRadius, canvasSize, imageVersion])

  // Re-process when settings change
  useEffect(() => {
    processDither()
  }, [processDither])

  // Core image loader — accepts an Image element
  const loadImage = useCallback((img) => {
    const c = document.createElement('canvas')
    c.width = img.width
    c.height = img.height
    const ctx = c.getContext('2d')
    ctx.drawImage(img, 0, 0)
    imgDataRef.current = ctx.getImageData(0, 0, img.width, img.height)
    imgSizeRef.current = { w: img.width, h: img.height }
    setHasImage(true)
    setImageVersion((v) => v + 1)
  }, [])

  // Load default image on mount
  useEffect(() => {
    const img = new Image()
    img.onload = () => loadImage(img)
    img.src = '/press-release_18-october-2019_volvo-ce-see-sales-dip-in-q3_hero.jpg'
  }, [loadImage])

  // Handle image upload
  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => loadImage(img)
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }, [loadImage])

  // Drop zone
  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer?.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  // Canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const size = canvasSize
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = size + 'px'
    canvas.style.height = size + 'px'
    ctx.scale(dpr, dpr)

    function animate() {
      ctx.clearRect(0, 0, size, size)

      const dots = dotsRef.current
      const mouse = mouseRef.current
      const R = cursorRadius
      const strength = pushStrength

      // Spring physics constants
      const springK = 0.08    // spring stiffness (pull toward rest)
      const damping = 0.82    // velocity decay per frame
      const mouseInfluence = 0.3 // how much mouse velocity adds to push

      for (let i = 0; i < dots.length; i++) {
        const d = dots[i]

        // Spring force toward rest position
        const springFx = (d.restX - d.curX) * springK
        const springFy = (d.restY - d.curY) * springK

        // Push force from cursor
        let pushFx = 0
        let pushFy = 0

        if (mouse.active) {
          const dx = d.curX - mouse.x
          const dy = d.curY - mouse.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < R && dist > 0.1) {
            const t = 1 - dist / R            // 1 at center, 0 at edge
            const smoothT = t * t * (3 - 2 * t) // smoothstep falloff — strong but visible across full radius
            const force = smoothT * strength * 0.15
            const nx = dx / dist
            const ny = dy / dist
            pushFx = nx * force
            pushFy = ny * force

            // Add mouse velocity as momentum transfer
            pushFx += mouse.vx * mouseInfluence * smoothT
            pushFy += mouse.vy * mouseInfluence * smoothT
          }
        }

        // Apply forces to velocity
        d.vx += springFx + pushFx
        d.vy += springFy + pushFy

        // Damping
        d.vx *= damping
        d.vy *= damping

        // Integrate position
        d.curX += d.vx
        d.curY += d.vy
      }

      // Draw all dots with stretch based on displacement
      const r = dotSize * renderScale
      ctx.fillStyle = '#000'
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i]
        const sx = d.curX * renderScale + (size * (1 - renderScale)) / 2
        const sy = d.curY * renderScale + (size * (1 - renderScale)) / 2

        // Calculate displacement for stretch effect
        const dispX = d.curX - d.restX
        const dispY = d.curY - d.restY
        const dispMag = Math.sqrt(dispX * dispX + dispY * dispY)

        if (dispMag > 0.5) {
          // Stretch dot into ellipse along displacement direction
          const angle = Math.atan2(dispY, dispX)
          const stretch = Math.min(1 + dispMag * 0.02, 2.5) // cap stretch at 2.5x
          const squeeze = 1 / Math.sqrt(stretch)             // preserve area

          ctx.save()
          ctx.translate(sx, sy)
          ctx.rotate(angle)
          ctx.scale(stretch, squeeze)
          ctx.beginPath()
          ctx.arc(0, 0, r, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        } else {
          ctx.beginPath()
          ctx.arc(sx, sy, r, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Draw cursor ring
      if (mouse.active) {
        const mx = mouse.x * renderScale + (size * (1 - renderScale)) / 2
        const my = mouse.y * renderScale + (size * (1 - renderScale)) / 2
        const ringR = cursorRadius * renderScale

        ctx.beginPath()
        ctx.arc(mx, my, ringR, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(110, 110, 255, 0.25)'
        ctx.lineWidth = 1.5
        ctx.stroke()

        // Inner soft glow
        const grad = ctx.createRadialGradient(mx, my, 0, mx, my, ringR)
        grad.addColorStop(0, 'rgba(110, 110, 255, 0.04)')
        grad.addColorStop(0.7, 'rgba(110, 110, 255, 0.02)')
        grad.addColorStop(1, 'rgba(110, 110, 255, 0)')
        ctx.beginPath()
        ctx.arc(mx, my, ringR, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
      }

      animFrameRef.current = requestAnimationFrame(animate)
    }

    animFrameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [renderScale, cursorRadius, pushStrength, dotSize, canvasSize])

  // Mouse tracking on canvas
  const handleMouseMove = useCallback((e) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const newX = ((e.clientX - rect.left) - (canvasSize * (1 - renderScale)) / 2) / renderScale
    const newY = ((e.clientY - rect.top) - (canvasSize * (1 - renderScale)) / 2) / renderScale

    // Track mouse velocity for momentum transfer
    const m = mouseRef.current
    if (m.active) {
      m.vx = (newX - m.x) * 0.5
      m.vy = (newY - m.y) * 0.5
    }
    m.x = newX
    m.y = newY
    m.active = true
  }, [renderScale, canvasSize])

  const handleMouseLeave = useCallback(() => {
    mouseRef.current.active = false
  }, [])

  // Click to explode
  const handleClick = useCallback((e) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const clickX = ((e.clientX - rect.left) - (canvasSize * (1 - renderScale)) / 2) / renderScale
    const clickY = ((e.clientY - rect.top) - (canvasSize * (1 - renderScale)) / 2) / renderScale

    const dots = dotsRef.current
    const blastRadius = cursorRadius * 3
    const str = explodeStrength

    for (let i = 0; i < dots.length; i++) {
      const d = dots[i]
      const dx = d.curX - clickX
      const dy = d.curY - clickY
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < blastRadius && dist > 0.1) {
        const t = 1 - dist / blastRadius
        const force = t * t * str  // quadratic falloff
        const nx = dx / dist
        const ny = dy / dist
        // Add random scatter for organic feel
        const scatter = 0.3
        d.vx += nx * force + (Math.random() - 0.5) * force * scatter
        d.vy += ny * force + (Math.random() - 0.5) * force * scatter
      }
    }
  }, [canvasSize, renderScale, cursorRadius, explodeStrength])

  // Export dots as JSON
  const exportJSON = useCallback(() => {
    const data = dotsRef.current.map((d) => ({ x: d.restX, y: d.restY }))
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'dither-dots.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  // Copy dots as JS
  const copyJS = useCallback(() => {
    const data = dotsRef.current.map((d) => `{x:${d.restX.toFixed(2)},y:${d.restY.toFixed(2)}}`)
    navigator.clipboard.writeText(`const dots = [\n  ${data.join(',\n  ')}\n]`)
  }, [])

  return (
    <div className="logo-page">
      <aside className="logo-sidebar">
        <h1 className="logo-title">Dither Tool</h1>

        {/* Upload zone */}
        <label
          className="logo-upload"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFile(e.target.files?.[0])}
            hidden
          />
          {hasImage ? (
            <span className="logo-upload__loaded">
              <span className="logo-upload__size">{imgSizeRef.current.w}×{imgSizeRef.current.h}</span>
              <span className="logo-upload__change">Change image</span>
            </span>
          ) : (
            <span className="logo-upload__empty">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3v10M3 8h10" />
              </svg>
              <span>Drop image or click to browse</span>
            </span>
          )}
        </label>

        {/* Algorithm */}
        <Section title="Algorithm">
          <div className="logo-algo-label">Floyd-Steinberg</div>
          <Slider label="Luminance Threshold" value={threshold} onChange={setThreshold} min={0} max={255} />
          <label className="logo-checkbox">
            <input type="checkbox" checked={invert} onChange={(e) => setInvert(e.target.checked)} />
            <span>Invert</span>
          </label>
        </Section>

        {/* Main Settings */}
        <Section title="Main Settings">
          <Slider label="Scale" value={Math.round(scale * 100)} onChange={(v) => setScale(v / 100)} min={5} max={100} suffix="%" />
          <Slider label="Contrast" value={contrast} onChange={setContrast} min={-255} max={255} />
          <Slider label="Midtones (Gamma)" value={gamma} onChange={setGamma} min={0.2} max={5} step={0.01} />
        </Section>

        {/* Error Diffusion */}
        <Section title={`Error Strength: ${Math.round(errorStrength * 100)}%`}>
          <Slider label="" value={errorStrength} onChange={setErrorStrength} min={0} max={1.5} step={0.01} />
          <label className="logo-checkbox">
            <input type="checkbox" checked={serpentine} onChange={(e) => setSerpentine(e.target.checked)} />
            <span>Serpentine</span>
          </label>
        </Section>

        {/* Shape */}
        <Section title="Shape">
          <Slider label="Corner Radius" value={cornerRadius} onChange={setCornerRadius} min={0} max={50} suffix="%" />
        </Section>

        {/* Interaction */}
        <Section title="Interaction">
          <Slider label="Cursor Radius" value={cursorRadius} onChange={setCursorRadius} min={20} max={200} suffix="px" />
          <Slider label="Push Strength" value={pushStrength} onChange={setPushStrength} min={10} max={200} />
          <Slider label="Explode Strength" value={explodeStrength} onChange={setExplodeStrength} min={5} max={120} />
          <Slider label="Dot Size" value={dotSize} onChange={setDotSize} min={0.3} max={4} step={0.1} />
        </Section>

        {/* Render */}
        <Section title="Render">
          <Slider label="Render Scale" value={renderScale} onChange={setRenderScale} min={0.1} max={1} step={0.01} />
          <Slider label="Canvas Size" value={canvasSize} onChange={(v) => setCanvasSize(Math.round(v))} min={200} max={1200} step={50} suffix="px" />
        </Section>

        {/* Export */}
        <div className="logo-export-row">
          <button className="logo-btn" onClick={exportJSON}>Export JSON</button>
          <button className="logo-btn" onClick={copyJS}>Copy JS Code</button>
        </div>

        <div className="logo-dot-count">{dotCount.toLocaleString()} dots at {gridInfo}</div>
      </aside>

      {/* Canvas area */}
      <main className="logo-canvas-area">
        <div className="logo-canvas-label">LIVE RENDER ({canvasSize}×{canvasSize})</div>
        <canvas
          ref={canvasRef}
          className="logo-canvas"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        />
      </main>
    </div>
  )
}

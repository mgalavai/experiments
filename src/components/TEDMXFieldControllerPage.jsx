import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const DOT_COUNT = 36
const ENCODERS = [
  { id: 1, label: 'Pan', color: 'blue', size: 42, socket: 64 },
  { id: 2, label: 'Tilt', color: 'ochre', size: 42, socket: 64 },
  { id: 3, label: 'Dimmer', color: 'grey', size: 42, socket: 64 },
  { id: 4, label: 'FX Rate', color: 'orange', size: 42, socket: 64 },
  { id: 5, label: 'Master', color: 'white', size: 32, socket: 48 },
]

const INITIAL_FADERS = [60, 45, 80, 10, 20, 0, 55, 90]
const VIBE_ROOTS = [110, 130.81, 146.83, 164.81, 196, 220]
const SCALES = [
  { name: 'major', intervals: [0, 2, 4, 7, 9, 12, 14, 16] },
  { name: 'pentatonic', intervals: [0, 2, 4, 7, 9, 12, 14] },
  { name: 'dorian', intervals: [0, 2, 3, 5, 7, 9, 10, 12] },
  { name: 'lydian', intervals: [0, 2, 4, 6, 7, 9, 11, 12] },
]
const SCALE_BY_NAME = Object.fromEntries(SCALES.map((scale) => [scale.name, scale.intervals]))
const CHANNEL_LIGHT_INFO = [
  'CH1 Master Volume',
  'CH2 Filter Cutoff',
  'CH3 Resonance',
  'CH4 Note Gate Length',
  'CH5 Note Density',
  'CH6 Octave Lift Chance',
  'CH7 Delay Mix',
  'CH8 Delay Feedback',
]

const PRESET_CONFIGS = {
  lofi: {
    label: 'LO-FI',
    mode: 'lofi',
    scales: ['dorian', 'pentatonic', 'major'],
    tempo: [82, 100],
    rootPool: [110, 130.81, 146.83],
    melodyPatterns: [
      [0, 2, 4, 5, 4, 2, 1, 2, 0, 2, 4, 7, 5, 4, 2, 1],
      [0, 1, 2, 4, 2, 1, 0, 2, 4, 5, 7, 5, 4, 2, 1, 0],
    ],
    bassPatterns: [
      [0, null, null, null, 3, null, null, null, 4, null, null, null, 2, null, null, null],
      [0, null, null, null, 4, null, null, null, 5, null, null, null, 3, null, null, null],
    ],
    leadType: 'triangle',
    leadHarmonic: 2,
    bassType: 'sine',
    leadLevel: [0.05, 0.2],
    bassLevel: [0.02, 0.08],
    gate: [0.42, 0.74],
    density: [0.75, 0.95],
    swing: [0.05, 0.14],
    faders: [50, 56, 30, 55, 62, 42, 30, 24],
  },
  synthwave: {
    label: 'SYNTH',
    mode: 'synth',
    scales: ['major', 'lydian'],
    tempo: [98, 122],
    rootPool: [130.81, 146.83, 164.81, 196],
    melodyPatterns: [
      [0, 2, 4, 7, 11, 9, 7, 4, 2, 4, 7, 9, 11, 14, 12, 9],
      [0, 4, 7, 11, 9, 7, 4, 2, 0, 2, 4, 7, 9, 11, 14, 12],
    ],
    bassPatterns: [
      [0, null, null, 0, 4, null, null, 4, 5, null, null, 5, 4, null, null, 2],
      [0, null, 0, null, 4, null, 4, null, 5, null, 5, null, 4, null, 2, null],
    ],
    leadType: 'sawtooth',
    leadHarmonic: 1.5,
    bassType: 'triangle',
    leadLevel: [0.06, 0.23],
    bassLevel: [0.025, 0.095],
    gate: [0.48, 0.88],
    density: [0.82, 1],
    swing: [0, 0.06],
    faders: [58, 70, 42, 72, 84, 48, 74, 68],
  },
  house: {
    label: 'HOUSE',
    mode: 'house',
    scales: ['major', 'dorian', 'pentatonic'],
    tempo: [118, 132],
    rootPool: [110, 130.81, 146.83],
    melodyPatterns: [
      [0, null, 4, null, 0, null, 5, null, 0, null, 4, null, 0, null, 7, null],
      [0, null, 3, null, 0, null, 5, null, 0, null, 3, null, 0, null, 7, null],
    ],
    bassPatterns: [
      [0, null, null, null, 0, null, null, null, 3, null, null, null, 4, null, null, null],
      [0, null, null, null, 3, null, null, null, 4, null, null, null, 3, null, null, null],
    ],
    leadType: 'square',
    leadHarmonic: 2,
    bassType: 'triangle',
    leadLevel: [0.06, 0.22],
    bassLevel: [0.03, 0.11],
    gate: [0.32, 0.62],
    density: [0.9, 1],
    swing: [0, 0.04],
    faders: [62, 58, 36, 34, 94, 52, 20, 14],
  },
  ambient: {
    label: 'AMBIENT',
    mode: 'ambient',
    scales: ['major', 'lydian', 'pentatonic'],
    tempo: [60, 84],
    rootPool: [110, 130.81, 164.81],
    melodyPatterns: [
      [0, null, 2, null, 4, null, 5, null, 7, null, 9, null, 7, null, 4, null],
      [0, null, 4, null, 7, null, 9, null, 11, null, 9, null, 7, null, 4, null],
    ],
    bassPatterns: [
      [0, null, null, null, null, null, null, null, 4, null, null, null, null, null, null, null],
      [0, null, null, null, 3, null, null, null, 4, null, null, null, 2, null, null, null],
    ],
    leadType: 'sine',
    leadHarmonic: 2,
    bassType: 'sine',
    leadLevel: [0.04, 0.14],
    bassLevel: [0.02, 0.06],
    gate: [0.72, 0.98],
    density: [0.62, 0.82],
    swing: [0.02, 0.08],
    faders: [46, 74, 22, 84, 58, 34, 52, 36],
  },
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function lerp(min, max, amount) {
  return min + (max - min) * amount
}

function frequencyToMidi(frequency) {
  return Math.round(69 + 12 * Math.log2(frequency / 440))
}

function midiToStrudelNote(midi) {
  const names = ['c', 'cs', 'd', 'ds', 'e', 'f', 'fs', 'g', 'gs', 'a', 'as', 'b']
  const pitch = ((midi % 12) + 12) % 12
  const octave = Math.floor(midi / 12) - 1
  return `${names[pitch]}${octave}`
}

function Grille() {
  return (
    <div className="grille" aria-hidden="true">
      {Array.from({ length: DOT_COUNT }).map((_, i) => (
        <span key={i} className="dot" />
      ))}
    </div>
  )
}

function TinyButtons({ onToggleCode }) {
  return (
    <div className="tiny-buttons">
      <button className="btn-round tiny" type="button" aria-label="round indicator">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10" />
        </svg>
      </button>
      <button className="btn-round tiny" type="button" aria-label="minus indicator">
        <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" fill="none">
          <line x1="4" y1="12" x2="20" y2="12" />
        </svg>
      </button>
      <button className="btn-round tiny tiny-code" type="button" onClick={onToggleCode} aria-label="Toggle Strudel code">
        &lt;&gt;
      </button>
    </div>
  )
}

function useWaveCanvas(canvasRef, joyState) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const context = canvas.getContext('2d')
    if (!context) return undefined

    let raf = 0
    let time = 0

    const setup = () => {
      const { width, height } = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const draw = () => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight

      context.clearRect(0, 0, w, h)

      const speed = 0.05 + Math.abs(joyState.current[4].x) * 0.2
      time += speed

      const freqBase = 1.5 + joyState.current[1].x * 2
      const ampBase = 0.5 + joyState.current[2].y * -0.3
      const separation = 0.2 + joyState.current[3].y * 0.3
      const noise = Math.abs(joyState.current[5].x) * 0.2

      const lines = 5
      const segments = 64

      for (let lineIndex = 0; lineIndex < lines; lineIndex += 1) {
        context.beginPath()
        context.lineWidth = 1
        context.globalAlpha = 0.8
        context.strokeStyle = lineIndex % 2 === 0 ? '#e84a1b' : '#ffffff'

        const yOffset = (lineIndex - lines / 2) * separation * (h / 4)

        for (let i = 0; i < segments; i += 1) {
          const ratio = i / (segments - 1)
          const x = ratio * w
          const normX = ratio * 6 - 3

          let y = Math.sin(normX * freqBase + time + lineIndex * 0.5) * ampBase
          y += Math.sin(normX * 3 + time * 1.5) * 0.1
          y += (Math.random() - 0.5) * noise

          const py = h / 2 + y * (h / 4.2) + yOffset

          if (i === 0) context.moveTo(x, py)
          else context.lineTo(x, py)
        }

        context.stroke()
      }

      raf = window.requestAnimationFrame(draw)
    }

    setup()
    draw()

    const onResize = () => setup()
    window.addEventListener('resize', onResize)

    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [canvasRef, joyState])
}

function ScreenDisplay({ readout, joyState }) {
  const canvasRef = useRef(null)
  useWaveCanvas(canvasRef, joyState)

  return (
    <div className="screen-display" role="status" aria-live="polite">
      <canvas ref={canvasRef} className="screen-canvas" />
      <div className="screen-ui">
        <div className="screen-header">
          <span>DMX-FIELD</span>
          <span>{readout}</span>
        </div>
        <div className="screen-footer">
          <span>WAVE: SINE</span>
          <span>SYNC: INT</span>
        </div>
      </div>
    </div>
  )
}

function TransportButtons({
  activePreset,
  onStartAudio,
  onStopAudio,
  onRandomize,
  onAmbientPreset,
}) {
  return (
    <div className="btn-group-round">
      <button className="btn-round" type="button" aria-label="play" onClick={onStartAudio}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5,3 19,12 5,21" />
        </svg>
      </button>
      <button className="btn-round" type="button" aria-label="stop" onClick={onStopAudio}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="6" width="12" height="12" />
        </svg>
      </button>
      <button className="btn-round" type="button" onClick={onRandomize}>loop</button>
      <button
        className={`btn-round ${activePreset === 'ambient' ? 'active-preset' : ''}`}
        type="button"
        onClick={onAmbientPreset}
      >
        shift
      </button>
    </div>
  )
}

function Encoders({ onJoyChange }) {
  const handlePointerDown = (event, encoder) => {
    event.preventDefault()
    const target = event.currentTarget
    const socket = target.parentElement
    if (!socket) return

    const rect = socket.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const maxDist = rect.width / 2 - target.offsetWidth / 4

    const onMove = (moveEvent) => {
      const dx = moveEvent.clientX - centerX
      const dy = moveEvent.clientY - centerY
      const dist = Math.hypot(dx, dy)
      let finalX = dx
      let finalY = dy

      if (dist > maxDist) {
        const angle = Math.atan2(dy, dx)
        finalX = Math.cos(angle) * maxDist
        finalY = Math.sin(angle) * maxDist
      }

      target.style.transform = `translate(-50%, -50%) translate(${finalX}px, ${finalY}px)`
      onJoyChange(encoder.id, finalX / maxDist, finalY / maxDist)
    }

    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)

      target.style.transition = 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      target.style.transform = 'translate(-50%, -50%) translate(0px, 0px)'
      onJoyChange(encoder.id, 0, 0)
      window.setTimeout(() => {
        target.style.transition = 'none'
      }, 200)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <div className="encoder-row">
      {ENCODERS.map((encoder, index) => (
        <div
          className="encoder-unit"
          key={encoder.id}
          style={index === ENCODERS.length - 1 ? { marginLeft: 'auto' } : undefined}
        >
          <div
            className="knob-socket"
            style={{ width: `${encoder.socket}px`, height: `${encoder.socket}px` }}
          >
            <button
              className={`knob-cap knob-${encoder.color}`}
              style={{ width: `${encoder.size}px`, height: `${encoder.size}px` }}
              type="button"
              onPointerDown={(event) => handlePointerDown(event, encoder)}
              aria-label={`${encoder.label} encoder`}
            />
          </div>
          <span className="label">{encoder.label}</span>
        </div>
      ))}
    </div>
  )
}

function FaderBank({ faders, setFaders, setReadout, leds, onToggleLed }) {
  const startFaderDrag = (event, channel) => {
    event.preventDefault()

    const track = event.currentTarget.parentElement
    if (!track) return

    const rect = track.getBoundingClientRect()
    const capHeight = event.currentTarget.offsetHeight
    const maxTravel = rect.height - capHeight
    const startY = event.clientY
    const currentPercent = faders[channel - 1]
    const startBottom = (currentPercent / 100) * maxTravel

    const onMove = (moveEvent) => {
      const deltaY = startY - moveEvent.clientY
      let newBottom = startBottom + deltaY
      if (newBottom < 0) newBottom = 0
      if (newBottom > maxTravel) newBottom = maxTravel

      const nextPercent = (newBottom / maxTravel) * 100
      setFaders((prev) => prev.map((value, idx) => (idx === channel - 1 ? nextPercent : value)))
      setReadout(`CH:${channel} VAL:${Math.floor((nextPercent / 100) * 255)}`)
    }

    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const channels = useMemo(() => Array.from({ length: 8 }, (_, i) => i + 1), [])

  return (
    <div className="fader-bank">
      {channels.map((channel, idx) => (
        <div className="channel-strip" key={channel}>
          <span className="label channel-label">{String(channel).padStart(2, '0')}</span>
          <div className="fader-track">
            <button
              className="fader-cap"
              type="button"
              style={{ '--fader-level': faders[idx] / 100 }}
              onPointerDown={(event) => startFaderDrag(event, channel)}
              aria-label={`Channel ${channel} fader`}
            />
          </div>
          <button
            className={`btn-lozenge black ${leds[idx] ? 'active' : ''}`}
            type="button"
            onClick={() => onToggleLed(idx)}
            aria-label={`Channel ${channel} ${CHANNEL_LIGHT_INFO[idx]} ${leds[idx] ? 'enabled' : 'disabled'}`}
            data-tooltip={`${CHANNEL_LIGHT_INFO[idx]} ${leds[idx] ? '(ON)' : '(OFF)'}`}
          />
        </div>
      ))}
    </div>
  )
}

export default function TEDMXFieldControllerPage() {
  const [readout, setReadout] = useState('UNI:1 ACTIVE')
  const [faders, setFaders] = useState(INITIAL_FADERS)
  const [channelLeds, setChannelLeds] = useState([true, true, true, true, true, true, true, true])
  const [isAudioRunning, setIsAudioRunning] = useState(false)
  const [activePreset, setActivePreset] = useState('lofi')
  const [showStrudelCode, setShowStrudelCode] = useState(false)
  const [strudelCode, setStrudelCode] = useState('')
  const fadersRef = useRef(INITIAL_FADERS)
  const channelLedsRef = useRef([true, true, true, true, true, true, true, true])
  const joyState = useRef({
    1: { x: 0, y: 0 },
    2: { x: 0, y: 0 },
    3: { x: 0, y: 0 },
    4: { x: 0, y: 0 },
    5: { x: 0, y: 0 },
  })
  const audioRef = useRef(null)
  const schedulerRef = useRef(0)
  const vibeRef = useRef({
    root: 164.81,
    presetKey: 'lofi',
    mode: PRESET_CONFIGS.lofi.mode,
    scaleName: 'major',
    scaleIntervals: SCALE_BY_NAME.major,
    melodyPattern: PRESET_CONFIGS.lofi.melodyPatterns[0],
    bassPattern: PRESET_CONFIGS.lofi.bassPatterns[0],
    leadType: PRESET_CONFIGS.lofi.leadType,
    leadHarmonic: PRESET_CONFIGS.lofi.leadHarmonic,
    bassType: PRESET_CONFIGS.lofi.bassType,
    leadLevelRange: PRESET_CONFIGS.lofi.leadLevel,
    bassLevelRange: PRESET_CONFIGS.lofi.bassLevel,
    gateRange: PRESET_CONFIGS.lofi.gate,
    densityRange: PRESET_CONFIGS.lofi.density,
    swingRange: PRESET_CONFIGS.lofi.swing,
    tempo: 104,
    nextNoteTime: 0,
    stepIndex: 0,
  })

  const stopAudio = useCallback(() => {
    if (schedulerRef.current) {
      window.clearInterval(schedulerRef.current)
      schedulerRef.current = 0
    }
    const audio = audioRef.current
    if (!audio) return

    audio.oscillators.forEach((osc) => {
      try {
        osc.stop()
      } catch {
        // oscillator may already be stopped
      }
      osc.disconnect()
    })
    audio.nodes.forEach((node) => node.disconnect())
    audio.context.close()
    audioRef.current = null
  }, [])

  useEffect(() => () => stopAudio(), [stopAudio])
  useEffect(() => {
    const onVisibilityChange = () => {
      const audio = audioRef.current
      if (!audio) return
      if (document.visibilityState === 'visible' && audio.context.state === 'suspended') {
        audio.context.resume().catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])
  useEffect(() => {
    fadersRef.current = faders
  }, [faders])
  useEffect(() => {
    channelLedsRef.current = channelLeds
  }, [channelLeds])

  const createAudioGraph = async () => {
    if (audioRef.current) return audioRef.current

    const context = new window.AudioContext()
    await context.resume()

    const voiceBus = context.createGain()
    const master = context.createGain()
    const filter = context.createBiquadFilter()
    const compressor = context.createDynamicsCompressor()
    const dry = context.createGain()
    const delay = context.createDelay(0.8)
    const feedback = context.createGain()
    const wet = context.createGain()

    voiceBus.gain.value = 1
    master.gain.value = 0.2
    filter.type = 'lowpass'
    filter.frequency.value = 2600
    filter.Q.value = 0.9
    compressor.threshold.value = -18
    compressor.knee.value = 18
    compressor.ratio.value = 3
    compressor.attack.value = 0.003
    compressor.release.value = 0.25
    dry.gain.value = 0.9
    delay.delayTime.value = 0.28
    feedback.gain.value = 0.22
    wet.gain.value = 0.15

    voiceBus.connect(filter)
    filter.connect(compressor)
    compressor.connect(master)
    master.connect(dry)
    dry.connect(context.destination)
    master.connect(delay)
    delay.connect(feedback)
    feedback.connect(delay)
    delay.connect(wet)
    wet.connect(context.destination)

    audioRef.current = {
      context,
      oscillators: [],
      nodes: [voiceBus, master, filter, compressor, dry, delay, feedback, wet],
      params: {
        voiceBus,
        master,
        filter,
        delay,
        feedback,
        wet,
      },
    }

    vibeRef.current.nextNoteTime = context.currentTime + 0.08
    vibeRef.current.stepIndex = 0
    return audioRef.current
  }

  const triggerNote = (audio, frequency, when, duration, options) => {
    const context = audio.context
    const oscA = context.createOscillator()
    const oscB = context.createOscillator()
    const gain = context.createGain()
    const panner = context.createStereoPanner()

    oscA.type = options.type
    oscB.type = 'sine'

    oscA.frequency.setValueAtTime(frequency, when)
    oscB.frequency.setValueAtTime(frequency * options.harmonic, when)
    oscB.detune.setValueAtTime((Math.random() - 0.5) * 8, when)

    const attack = 0.006
    gain.gain.setValueAtTime(0.0001, when)
    gain.gain.linearRampToValueAtTime(options.level, when + attack)
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration)

    panner.pan.setValueAtTime(options.pan, when)

    oscA.connect(gain)
    oscB.connect(gain)
    gain.connect(panner)
    panner.connect(audio.params.voiceBus)

    oscA.start(when)
    oscB.start(when)

    const stopAt = when + duration + 0.06
    oscA.stop(stopAt)
    oscB.stop(stopAt)

    oscB.onended = () => {
      oscA.disconnect()
      oscB.disconnect()
      gain.disconnect()
      panner.disconnect()
    }
  }

  const scheduleMelodyNotes = (audio, now, controls, joys, ledState) => {
    const mode = vibeRef.current.mode
    const fxRateX = clamp((joys[4].x + 1) / 2, 0, 1)
    const dimmerX = clamp((joys[3].x + 1) / 2, 0, 1)
    const panY = clamp((joys[1].y + 1) / 2, 0, 1)
    const tempo = lerp(48, 220, fxRateX)
    vibeRef.current.tempo = tempo
    const stepLength = (60 / tempo) / 4
    const horizon = now + (document.visibilityState === 'hidden' ? 2.8 : 0.35)
    const gateBase = ledState[3] ? lerp(vibeRef.current.gateRange[0], vibeRef.current.gateRange[1], controls.gate) : 0.14
    const gateRaw = clamp(gateBase * lerp(0.35, 1.55, dimmerX), 0.08, 1.28)
    const gate = mode === 'house'
      ? clamp(gateRaw * 0.58, 0.08, 0.58)
      : mode === 'synth'
        ? clamp(gateRaw * 1.22, 0.2, 1.4)
        : gateRaw
    const densityBase = ledState[4] ? lerp(vibeRef.current.densityRange[0], vibeRef.current.densityRange[1], controls.density) : 0.08
    const densityRaw = clamp(densityBase + (ledState[4] ? joys[3].y * 0.45 : 0), 0.08, 1)
    const density = mode === 'house'
      ? clamp(densityRaw + 0.25, 0.3, 1)
      : mode === 'synth'
        ? clamp(densityRaw + 0.08, 0.2, 1)
        : densityRaw
    const octaveLiftChance = ledState[5] ? lerp(0.08, 0.42, controls.octave) : 0
    const stereoWidth = lerp(0.1, 0.98, panY)
    const transpose = Math.round(joys[1].x * 12)
    const swing = clamp(
      lerp(vibeRef.current.swingRange[0], vibeRef.current.swingRange[1], clamp((joys[3].y + 1) / 2, 0, 1)) + joys[3].x * 0.2,
      0,
      0.35,
    )

    while (vibeRef.current.nextNoteTime < horizon) {
      const step = vibeRef.current.stepIndex % vibeRef.current.melodyPattern.length
      const noteIdx = vibeRef.current.melodyPattern[step]
      const bassIdx = vibeRef.current.bassPattern[step]
      const t = vibeRef.current.nextNoteTime

      const housePulseStep = step % 4 === 1 || step % 4 === 3
      const leadGate = mode === 'house' ? housePulseStep : true
      if (noteIdx !== null && leadGate && Math.random() < density) {
        const interval = vibeRef.current.scaleIntervals[noteIdx % vibeRef.current.scaleIntervals.length]
        const octaveJump = Math.random() < octaveLiftChance ? 12 : 0
        const freq = vibeRef.current.root * 2 ** ((interval + octaveJump + transpose) / 12)
        const levelBase = lerp(vibeRef.current.leadLevelRange[0], vibeRef.current.leadLevelRange[1], controls.master)
        const level = mode === 'house'
          ? levelBase * (step % 4 === 1 ? 1.45 : 0.65)
          : mode === 'synth'
            ? levelBase * (step % 4 === 0 ? 1.2 : 0.9)
            : levelBase * (step % 4 === 0 ? 1.15 : 0.92)
        triggerNote(audio, freq, t, stepLength * gate, {
          type: vibeRef.current.leadType,
          level,
          pan: (Math.random() * 2 - 1) * (mode === 'house' ? 0.18 : mode === 'synth' ? 0.85 : stereoWidth),
          harmonic: vibeRef.current.leadHarmonic,
        })
      }

      const bassStep = mode === 'house' ? step % 4 === 0 : step % 2 === 0
      if (bassIdx !== null && bassStep) {
        const interval = vibeRef.current.scaleIntervals[bassIdx % vibeRef.current.scaleIntervals.length]
        const bassFreq = vibeRef.current.root * 0.5 * 2 ** ((interval + transpose) / 12)
        const bassDur = mode === 'house'
          ? stepLength * 0.72
          : mode === 'synth'
            ? stepLength * clamp(gate * 1.1, 0.3, 1.2)
            : stepLength * clamp(gate * 1.2, 0.24, 1.1)
        triggerNote(audio, bassFreq, t, bassDur, {
          type: vibeRef.current.bassType,
          level: lerp(vibeRef.current.bassLevelRange[0], vibeRef.current.bassLevelRange[1], controls.master) * (mode === 'house' ? 1.2 : 1),
          pan: -0.08,
          harmonic: 1.01,
        })
      }

      vibeRef.current.stepIndex += 1
      vibeRef.current.nextNoteTime += stepLength + (step % 2 === 1 ? stepLength * swing : 0)
    }
  }

  const tickAudio = () => {
    const audio = audioRef.current
    if (!audio) return
    const now = audio.context.currentTime
    const normalized = fadersRef.current.map((value) => clamp(value / 100, 0, 1))
    const ledState = channelLedsRef.current
    const valueOr = (idx, fallback) => (ledState[idx] ? normalized[idx] : fallback)
    const controls = {
      master: valueOr(0, 0),
      filter: valueOr(1, 0.02),
      resonance: valueOr(2, 0),
      gate: valueOr(3, 0),
      density: valueOr(4, 0),
      octave: valueOr(5, 0),
      wet: valueOr(6, 0),
      feedback: valueOr(7, 0),
    }
    const joys = joyState.current
    const mode = vibeRef.current.mode
    const tiltX = clamp((joys[2].x + 1) / 2, 0, 1)
    const fxRateY = clamp((joys[4].y + 1) / 2, 0, 1)

    scheduleMelodyNotes(audio, now, controls, joys, ledState)

    audio.params.master.gain.setTargetAtTime(lerp(0.02, 0.34, controls.master), now, 0.08)
    const cutoffBase = lerp(260, 7600, controls.filter) + joys[2].y * -4200
    const cutoff = mode === 'house'
      ? cutoffBase * 0.76
      : mode === 'synth'
        ? cutoffBase * 1.18 + 240
        : cutoffBase
    audio.params.filter.frequency.setTargetAtTime(clamp(cutoff, 220, 9000), now, 0.08)
    const resonanceBoost = mode === 'house' ? 5 : mode === 'synth' ? 2 : 0
    const resonance = clamp(lerp(0.5, 8.5, controls.resonance) + (ledState[2] ? tiltX * 16 : 0) + resonanceBoost, 0.5, 24)
    audio.params.filter.Q.setTargetAtTime(resonance, now, 0.1)
    const delayTime = mode === 'house'
      ? lerp(0.02, 0.18, fxRateY)
      : mode === 'synth'
        ? lerp(0.2, 0.78, fxRateY)
        : lerp(0.04, 0.7, fxRateY)
    audio.params.delay.delayTime.setTargetAtTime(delayTime, now, 0.12)
    const wetMixBase = clamp(lerp(0.01, 0.34, controls.wet) + (ledState[6] ? (fxRateY - 0.5) * 0.28 : 0), 0.01, 0.62)
    const wetMix = mode === 'house'
      ? wetMixBase * 0.4
      : mode === 'synth'
        ? clamp(wetMixBase + 0.12, 0.02, 0.72)
        : wetMixBase
    audio.params.wet.gain.setTargetAtTime(wetMix, now, 0.12)
    const feedbackBase = clamp(lerp(0.04, 0.52, controls.feedback) + (ledState[7] ? joys[4].x * 0.22 : 0), 0.04, 0.72)
    const feedback = mode === 'house'
      ? feedbackBase * 0.42
      : mode === 'synth'
        ? clamp(feedbackBase + 0.16, 0.08, 0.84)
        : feedbackBase
    audio.params.feedback.gain.setTargetAtTime(feedback, now, 0.12)

  }

  const startAudioScheduler = () => {
    if (schedulerRef.current) return
    tickAudio()
    schedulerRef.current = window.setInterval(tickAudio, 80)
  }

  const applyPreset = (presetKey, withVariation = true) => {
    const preset = PRESET_CONFIGS[presetKey]
    if (!preset) return

    const scaleName = preset.scales[Math.floor(Math.random() * preset.scales.length)]
    const scaleIntervals = SCALE_BY_NAME[scaleName]
    const melodyTemplate = preset.melodyPatterns[Math.floor(Math.random() * preset.melodyPatterns.length)]
    const bassTemplate = preset.bassPatterns[Math.floor(Math.random() * preset.bassPatterns.length)]
    const shift = withVariation ? Math.floor(Math.random() * 2) : 0
    const root = preset.rootPool[Math.floor(Math.random() * preset.rootPool.length)]
    const tempo = Math.round(lerp(preset.tempo[0], preset.tempo[1], Math.random()))
    const melodyPattern = melodyTemplate.map((step) => (step === null ? null : (step + shift) % scaleIntervals.length))
    const bassPattern = bassTemplate.map((step) => (step === null ? null : (step + shift) % scaleIntervals.length))
    const nextFaders = preset.faders.map((base) => clamp(base + (Math.random() - 0.5) * 12, 0, 100))

    vibeRef.current = {
      ...vibeRef.current,
      presetKey,
      mode: preset.mode,
      root,
      scaleName,
      scaleIntervals,
      melodyPattern,
      bassPattern,
      leadType: preset.leadType,
      leadHarmonic: preset.leadHarmonic,
      bassType: preset.bassType,
      leadLevelRange: preset.leadLevel,
      bassLevelRange: preset.bassLevel,
      gateRange: preset.gate,
      densityRange: preset.density,
      swingRange: preset.swing,
      tempo,
      nextNoteTime: audioRef.current ? audioRef.current.context.currentTime + 0.05 : 0,
      stepIndex: 0,
    }
    fadersRef.current = nextFaders
    setActivePreset(presetKey)
    setReadout(`${preset.label} ${tempo} BPM`)
    setFaders(nextFaders)
  }

  const ensureAudioRunning = async () => {
    if (audioRef.current) return
    await createAudioGraph()
    setIsAudioRunning(true)
    startAudioScheduler()
  }

  const handlePresetClick = async (presetKey) => {
    applyPreset(presetKey, true)
    await ensureAudioRunning()
  }

  const randomizeCurrentPreset = async () => {
    applyPreset(activePreset, true)
    await ensureAudioRunning()
  }

  const startAudioPlayback = async () => {
    if (!audioRef.current) {
      applyPreset(activePreset, false)
    }
    await ensureAudioRunning()
    setReadout(`${PRESET_CONFIGS[activePreset].label} LIVE`)
  }

  const stopAudioPlayback = () => {
    if (!isAudioRunning) return
    stopAudio()
    setIsAudioRunning(false)
    setReadout('VIBE STOPPED')
  }

  const onJoyChange = (id, x, y) => {
    joyState.current[id] = { x, y }
  }

  const generateStrudelCode = useCallback(() => {
    const vibe = vibeRef.current
    const rootMidi = frequencyToMidi(vibe.root)
    const scale = vibe.scaleIntervals
    const normalized = fadersRef.current.map((value) => clamp(value / 100, 0, 1))
    const leds = channelLedsRef.current

    const mapPattern = (pattern, octaveOffset) =>
      pattern
        .map((step) => {
          if (step === null) return '~'
          const interval = scale[step % scale.length]
          return midiToStrudelNote(rootMidi + interval + octaveOffset)
        })
        .join(' ')

    const leadPattern = mapPattern(vibe.melodyPattern, 12)
    const bassPattern = mapPattern(vibe.bassPattern, -12)
    const cps = (vibe.tempo / 60 / 4).toFixed(4)
    const cutoff = Math.round(lerp(260, 7600, leds[1] ? normalized[1] : 0.02))
    const resonance = (lerp(0.5, 8.5, leds[2] ? normalized[2] : 0)).toFixed(2)
    const gate = (leds[3] ? lerp(vibe.gateRange[0], vibe.gateRange[1], normalized[3]) : 0.14).toFixed(2)
    const density = (leds[4] ? lerp(vibe.densityRange[0], vibe.densityRange[1], normalized[4]) : 0.08).toFixed(2)
    const wet = (leds[6] ? lerp(0.01, 0.34, normalized[6]) : 0.01).toFixed(2)
    const feedback = (leds[7] ? lerp(0.04, 0.52, normalized[7]) : 0.04).toFixed(2)

    return `// Generated from TE-DMX preset: ${PRESET_CONFIGS[vibe.presetKey].label}
setcps(${cps})

stack(
  note("${bassPattern}")
    .s("${vibe.bassType}")
    .gain(${(leds[0] ? lerp(vibe.bassLevelRange[0], vibe.bassLevelRange[1], normalized[0]) : 0).toFixed(3)})
    .lpf(${Math.max(180, Math.round(cutoff * 0.65))})
    .room(0.05),

  note("${leadPattern}")
    .s("${vibe.leadType}")
    .gain(${(leds[0] ? lerp(vibe.leadLevelRange[0], vibe.leadLevelRange[1], normalized[0]) : 0).toFixed(3)})
    .lpf(${cutoff})
    .resonance(${resonance})
    .delay(${wet})
    .delayfeedback(${feedback})
    .legato(${gate})
    .density(${density})
)`
  }, [])
  useEffect(() => {
    if (!showStrudelCode) return undefined
    const refreshId = window.setInterval(() => {
      setStrudelCode(generateStrudelCode())
    }, 700)
    return () => window.clearInterval(refreshId)
  }, [showStrudelCode, generateStrudelCode])
  useEffect(() => {
    if (!showStrudelCode) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowStrudelCode(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [showStrudelCode])

  const toggleStrudelCode = () => {
    if (!showStrudelCode) {
      setStrudelCode(generateStrudelCode())
    }
    setShowStrudelCode((prev) => !prev)
  }

  const copyStrudelCode = async () => {
    const code = generateStrudelCode()
    try {
      await navigator.clipboard.writeText(code)
      setStrudelCode(code)
      setReadout('STRUDEL CODE COPIED')
    } catch {
      setReadout('COPY FAILED')
    }
  }
  const refreshStrudelCode = () => {
    setStrudelCode(generateStrudelCode())
    setReadout('STRUDEL CODE REFRESHED')
  }

  const toggleChannelLed = (idx) => {
    setChannelLeds((prev) => {
      const next = prev.map((value, i) => (i === idx ? !value : value))
      setReadout(`CH${idx + 1} ${next[idx] ? 'ON' : 'OFF'} ${CHANNEL_LIGHT_INFO[idx].split(' ').slice(1).join(' ').toUpperCase()}`)
      return next
    })
  }

  return (
    <div className="tedmx-page">
      <div className="device-case">
        <section className="section-left">
          <Grille />
          <TinyButtons onToggleCode={toggleStrudelCode} />
          <ScreenDisplay readout={readout} joyState={joyState} />
          <div className="page-button-row">
            <button
              className={`btn-round page ${activePreset === 'lofi' ? 'active-preset' : ''}`}
              type="button"
              onClick={() => handlePresetClick('lofi')}
            >
              LO-FI
            </button>
            <button
              className={`btn-round page ${activePreset === 'synthwave' ? 'active-preset' : ''}`}
              type="button"
              onClick={() => handlePresetClick('synthwave')}
            >
              SYNTH
            </button>
            <button
              className={`btn-round page ${activePreset === 'house' ? 'active-preset' : ''}`}
              type="button"
              onClick={() => handlePresetClick('house')}
            >
              HOUSE
            </button>
          </div>
          <TransportButtons
            activePreset={activePreset}
            onStartAudio={startAudioPlayback}
            onStopAudio={stopAudioPlayback}
            onRandomize={randomizeCurrentPreset}
            onAmbientPreset={() => handlePresetClick('ambient')}
          />
        </section>

        <section className="section-right">
          <Encoders onJoyChange={onJoyChange} />
          <FaderBank
            faders={faders}
            setFaders={setFaders}
            setReadout={setReadout}
            leds={channelLeds}
            onToggleLed={toggleChannelLed}
          />
        </section>

        <div className="branding">TE-DMX</div>
        <div className={`underhood-overlay ${showStrudelCode ? 'open' : ''}`} aria-hidden={!showStrudelCode}>
          <div className="underhood-header">
            <div className="underhood-title-wrap">
              <span className="underhood-kicker">UNDER THE HOOD</span>
              <span className="underhood-title">TE-DMX live Strudel output</span>
            </div>
            <div className="strudel-actions">
              <button type="button" className="btn-round tiny tiny-code underhood-btn" onClick={refreshStrudelCode}>sync</button>
              <button type="button" className="btn-round tiny tiny-code underhood-btn" onClick={copyStrudelCode}>copy</button>
              <button type="button" className="btn-round tiny tiny-code underhood-btn" onClick={toggleStrudelCode}>deck</button>
            </div>
          </div>
          <pre className="underhood-code">{strudelCode}</pre>
          <div className="underhood-footer">Music keeps running. Press <kbd>Esc</kbd> or <strong>deck</strong> to return.</div>
        </div>
      </div>
    </div>
  )
}

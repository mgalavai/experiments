import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ironwoodLifeline } from './lifelineData'
import './lifeline.css'

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value))

function ArrowIcon({ direction = 'right' }) {
  return (
    <svg className={`lifeline-arrow lifeline-arrow--${direction}`} viewBox="0 0 18 18" aria-hidden="true">
      <path d="M3 9h11M10 5l4 4-4 4" />
    </svg>
  )
}

function MachineMark() {
  return (
    <svg viewBox="0 0 44 32" aria-hidden="true">
      <path d="M3 23h34l-4-9h-9l-6-5H8l-3 9m20-4 1-8h8l3 8" />
      <circle cx="11" cy="24" r="5" />
      <circle cx="31" cy="24" r="5" />
      <path d="m37 14 5-3v9h-3" />
    </svg>
  )
}

function MediaCard({ photo, index, onOpen }) {
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const drag = useRef(null)

  const onPointerDown = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
      moved: false,
    }
  }

  const onPointerMove = (event) => {
    if (!drag.current) return
    const dx = event.clientX - drag.current.startX
    const dy = event.clientY - drag.current.startY
    if (Math.abs(dx) + Math.abs(dy) > 4) drag.current.moved = true
    setOffset({ x: drag.current.originX + dx, y: drag.current.originY + dy })
  }

  const onPointerUp = () => {
    if (drag.current && !drag.current.moved) onOpen(photo)
    drag.current = null
  }

  return (
    <button
      type="button"
      className={`lifeline-photo ${photo.wide ? 'lifeline-photo--wide' : ''}`}
      style={{
        '--photo-y': `${photo.y ?? (index % 2 ? 92 : -164)}px`,
        '--photo-rotate': `${photo.rotate ?? 0}deg`,
        '--photo-x': `${offset.x}px`,
        '--photo-drag-y': `${offset.y}px`,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => { drag.current = null }}
      aria-label={`Open image: ${photo.caption}`}
    >
      <img src={photo.src} alt={photo.alt} draggable="false" />
      <span>{photo.caption}</span>
      <i aria-hidden="true">+</i>
    </button>
  )
}

function PeopleRow({ label, people }) {
  if (!people?.length) return null
  return (
    <div className="lifeline-people">
      <span>{label}</span>
      <div>
        {people.map((person) => (
          <span className="lifeline-person" key={person} title={person}>
            {person.slice(0, 1)}
            <b>{person}</b>
          </span>
        ))}
      </div>
    </div>
  )
}

function Marker({ marker, index, onPreview, onOpen, onCelebrate }) {
  const isAbove = index % 2 === 0
  return (
    <article className={`lifeline-marker ${isAbove ? 'is-above' : 'is-below'}`} id={marker.id}>
      <div className="lifeline-marker__axis">
        <span className="lifeline-marker__year">{marker.year}</span>
        <span className="lifeline-marker__dot" aria-hidden="true" />
        <span className="lifeline-marker__age">{marker.age}</span>
      </div>
      <div className="lifeline-marker__content">
        <div className="lifeline-marker__meta">
          <span>{marker.eyebrow}</span>
          <span>{String(index + 1).padStart(2, '0')} / {String(ironwoodLifeline.markers.length).padStart(2, '0')}</span>
        </div>
        <h2>{marker.title}</h2>
        <div className="lifeline-events">
          {marker.events.map((event, eventIndex) => (
            <div
              className={`lifeline-event ${event.image ? 'has-media' : ''} ${event.effect ? 'has-effect' : ''}`}
              key={`${marker.id}-${eventIndex}`}
              onMouseEnter={(e) => event.image && onPreview(event.image, e)}
              onMouseMove={(e) => event.image && onPreview(event.image, e)}
              onMouseLeave={() => event.image && onPreview(null)}
            >
              <span>{event.text}</span>
              {event.image ? <button type="button" onClick={() => onOpen(event.image)} aria-label={`Open image: ${event.image.alt}`}>VIEW</button> : null}
              {event.href ? <a href={event.href}>{event.linkLabel}</a> : null}
              {event.effect ? <button type="button" onClick={onCelebrate}>IGNITE <ArrowIcon /></button> : null}
            </div>
          ))}
        </div>
        <div className="lifeline-badges" aria-label="Milestone badges">
          {marker.badges?.map((badge) => <span key={badge}>{badge}</span>)}
        </div>
        <div className="lifeline-companies">
          {marker.companies?.map((company) => (
            <span key={company}><i aria-hidden="true">{company.slice(0, 1)}</i>{company}</span>
          ))}
        </div>
        <PeopleRow label={ironwoodLifeline.legend.mentors} people={marker.mentors} />
        <PeopleRow label={ironwoodLifeline.legend.met} people={marker.met} />
      </div>
      {marker.photos?.map((photo, photoIndex) => (
        <MediaCard key={photo.caption} photo={photo} index={photoIndex} onOpen={onOpen} />
      ))}
    </article>
  )
}

function Lightbox({ media, onClose }) {
  useEffect(() => {
    if (!media) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [media, onClose])

  if (!media) return null
  return (
    <div className="lifeline-lightbox" role="dialog" aria-modal="true" aria-label={media.alt} onMouseDown={onClose}>
      <div onMouseDown={(event) => event.stopPropagation()}>
        <img src={media.src} alt={media.alt} />
        <p>{media.caption ?? media.alt}</p>
        <button type="button" onClick={onClose} aria-label="Close image">CLOSE <span>×</span></button>
      </div>
    </div>
  )
}

function Celebration({ run }) {
  const pieces = useMemo(() => Array.from({ length: 84 }, (_, index) => ({
    id: `${run}-${index}`,
    x: (index * 37) % 100,
    delay: (index % 12) * 45,
    drift: ((index * 19) % 70) - 35,
    color: ['#ffd51f', '#f4f0df', '#ff6838', '#7ce5d0'][index % 4],
  })), [run])

  if (!run) return null
  return (
    <div className="lifeline-celebration" aria-hidden="true">
      {pieces.map((piece) => (
        <i key={piece.id} style={{ left: `${piece.x}%`, '--delay': `${piece.delay}ms`, '--drift': `${piece.drift}px`, '--color': piece.color }} />
      ))}
      <strong>NEXT SHIFT<br />STARTS NOW</strong>
    </div>
  )
}

export default function LifelinePage() {
  const [progress, setProgress] = useState(1)
  const [intro, setIntro] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [theme, setTheme] = useState('dark')
  const [preview, setPreview] = useState(null)
  const [lightbox, setLightbox] = useState(null)
  const [celebration, setCelebration] = useState(0)
  const stageRef = useRef(null)
  const dragRef = useRef(null)
  const markers = ironwoodLifeline.markers

  useEffect(() => {
    if (!intro) return undefined
    const timer = window.setTimeout(() => setIntro(false), 1700)
    return () => window.clearTimeout(timer)
  }, [intro])

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Project Ironwood — Lifeline'
    return () => { document.title = previousTitle }
  }, [])

  useEffect(() => {
    if (!celebration) return undefined
    const timer = window.setTimeout(() => setCelebration(0), 3600)
    return () => window.clearTimeout(timer)
  }, [celebration])

  const updateProgress = useCallback((next) => {
    setProgress(clamp(typeof next === 'function' ? next(progress) : next))
  }, [progress])

  const onWheel = (event) => {
    if (window.matchMedia('(max-width: 820px)').matches) return
    event.preventDefault()
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
    setIntro(false)
    setProgress((current) => clamp(current + delta / 3400))
  }

  const onKeyDown = (event) => {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End']
    if (!keys.includes(event.key)) return
    event.preventDefault()
    setIntro(false)
    if (event.key === 'Home') setProgress(0)
    if (event.key === 'End') setProgress(1)
    if (event.key === 'ArrowLeft') setProgress((current) => clamp(current - 0.055))
    if (event.key === 'ArrowRight') setProgress((current) => clamp(current + 0.055))
  }

  const onPointerDown = (event) => {
    if (event.target.closest('button, a, .lifeline-photo')) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { x: event.clientX, progress }
  }

  const onPointerMove = (event) => {
    if (!dragRef.current) return
    const width = Math.max(stageRef.current?.clientWidth ?? 1, 1)
    setIntro(false)
    setProgress(clamp(dragRef.current.progress - (event.clientX - dragRef.current.x) / (width * 3.8)))
  }

  const onPreview = (mediaItem, event) => {
    if (!mediaItem) {
      setPreview(null)
      return
    }
    setPreview({ ...mediaItem, x: event.clientX, y: event.clientY })
  }

  const trackWidth = markers.length * 360 + 260
  const travel = `calc(${trackWidth}px - 100vw + 64px)`

  return (
    <main className={`lifeline-page lifeline-page--${theme} ${intro ? 'is-intro' : ''}`}>
      <header className="lifeline-header" data-site-nav-inner>
        <Link to="/" className="lifeline-brand" data-site-nav-logo aria-label="Back to gallery">
          <MachineMark />
          <span>IRONWOOD<br /><b>LIFELINE</b></span>
        </Link>
        <div className="lifeline-header__copy">
          <p>{ironwoodLifeline.description}</p>
          <span>FICTIONAL ARCHIVE / 11 MILESTONES</span>
        </div>
        <button type="button" className="lifeline-theme" onClick={() => setTheme((value) => value === 'dark' ? 'light' : 'dark')} aria-label={`Use ${theme === 'dark' ? 'light' : 'dark'} theme`}>
          <span>{theme === 'dark' ? 'LIGHT' : 'DARK'}</span>
          <i aria-hidden="true" />
        </button>
      </header>

      <section
        className="lifeline-stage"
        ref={stageRef}
        onWheel={onWheel}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => { dragRef.current = null }}
        onPointerCancel={() => { dragRef.current = null }}
        tabIndex="0"
        aria-label={`${ironwoodLifeline.name} timeline. Use arrow keys to move through time.`}
      >
        <div className="lifeline-intro-copy" aria-hidden={!intro}>
          <span>1954</span>
          <strong>A MACHINE<br />LEARNS TO MOVE</strong>
          <span>2026</span>
        </div>
        <div
          className="lifeline-track"
          style={{
            width: `${trackWidth}px`,
            '--lifeline-progress': progress,
            transform: `translate3d(calc(-1 * ${travel} * ${progress}), 0, 0)`,
          }}
        >
          <div className="lifeline-rail" />
          <div className="lifeline-labels" aria-hidden="true">
            <span>YEAR</span><span>AGE</span><span>EVENTS</span>
          </div>
          {markers.map((marker, index) => (
            <Marker
              marker={marker}
              index={index}
              key={marker.id}
              onPreview={onPreview}
              onOpen={setLightbox}
              onCelebrate={() => setCelebration(Date.now())}
            />
          ))}
        </div>
        {preview ? (
          <div className="lifeline-preview" style={{ left: preview.x, top: preview.y }}>
            <img src={preview.src} alt="" />
            <span>CLICK TO EXPAND</span>
          </div>
        ) : null}
      </section>

      <footer className="lifeline-footer">
        <div className="lifeline-instruction"><ArrowIcon direction="left" /> SCROLL / DRAG / KEYS <ArrowIcon /></div>
        <label>
          <span>{markers[0].year}</span>
          <input type="range" min="0" max="1000" value={Math.round(progress * 1000)} onChange={(event) => { setIntro(false); updateProgress(Number(event.target.value) / 1000) }} aria-label="Timeline position" />
          <span>{markers.at(-1).year}</span>
        </label>
        <div className="lifeline-legend"><span><i /> GUIDED BY</span><span><i /> BUILT WITH</span></div>
      </footer>

      <Lightbox media={lightbox} onClose={() => setLightbox(null)} />
      <Celebration run={celebration} />
    </main>
  )
}

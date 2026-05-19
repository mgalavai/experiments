import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const monthTabs = ['Jan', 'Feb', 'Mar', 'Apr', 'May']

const fridaySchedule = [
  {
    id: 'botanical-sourcing',
    time: '09:00 - 10:30',
    title: 'Botanical Sourcing & Vendor Calls',
  },
  {
    id: 'lunch',
    time: '11:50 - 12:30',
    title: 'Lunch Break',
  },
  {
    id: 'review',
    time: '14:30 - 16:00',
    title: 'Review Q2 Floral Arrangements Design Mockups',
  },
]

const saturdaySchedule = [
  {
    id: 'market-run',
    time: '08:30 - 09:45',
    title: 'Market Stem Run & Color Checks',
  },
  {
    id: 'conditioning',
    time: '10:00 - 11:15',
    title: 'Condition Arrivals for Afternoon Orders',
  },
  {
    id: 'sample-review',
    time: '14:00 - 15:30',
    title: 'Client Sample Review and Bouquet Refinements',
  },
]

const fridayTasks = [
  {
    id: 'palette',
    title: "Finalize color palette for the 'Flower Friendly' landing page campaign.",
    tag: 'Design',
    completed: true,
  },
  {
    id: 'inventory',
    title: 'Update inventory counts for Peonies and Ranunculus arrivals.',
    tag: 'Operations',
    meta: 'Due 2:00 PM',
    completed: false,
  },
  {
    id: 'copy',
    title: 'Draft copy for the bespoke wedding bouquet brochure.',
    completed: false,
  },
]

const saturdayTasks = [
  {
    id: 'vases',
    title: 'Confirm vessel counts and polished ceramic vases.',
    tag: 'Studio',
    completed: false,
  },
  {
    id: 'delivery',
    title: 'Check delivery windows for the early market arrivals.',
    tag: 'Logistics',
    meta: 'Before noon',
    completed: true,
  },
  {
    id: 'handoff',
    title: 'Prepare the weekend handoff notes for the evening shift.',
    completed: false,
  },
]

function RingGroup() {
  return (
    <div className="ring-group">
      <div className="hole left" />
      <div className="ring" />
      <div className="hole right" />
    </div>
  )
}

/** Binder rings sit on the turning sheet so they move with the hinge (no separate spine layer). */
function GutterRingsStrip() {
  return (
    <div className="planner-gutter-rings" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <RingGroup key={index} />
      ))}
    </div>
  )
}

function PlannerTabs({ activeTab, setActiveTab }) {
  return (
    <div className="planner-tabs" aria-label="Planner months">
      {monthTabs.map((tab) => (
        <button
          key={tab}
          type="button"
          className={`tab ${activeTab === tab ? 'active' : ''}`}
          onClick={() => setActiveTab(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

function TaskItem({ task, onToggle }) {
  return (
    <li className={`task-item ${task.completed ? 'completed' : ''}`}>
      <button
        type="button"
        className="task-checkbox"
        aria-pressed={task.completed}
        aria-label={`Toggle ${task.title}`}
        onClick={() => onToggle(task.id)}
      />
      <div className="task-content">
        <div className="task-text">{task.title}</div>
        {(task.tag || task.meta) && (
          <div className="task-meta">
            {task.tag && <span className="tag">{task.tag}</span>}
            {task.meta && <span>{task.meta}</span>}
          </div>
        )}
      </div>
    </li>
  )
}

function getOrdinalSuffix(day) {
  const remainder100 = day % 100
  if (remainder100 >= 11 && remainder100 <= 13) return `${day}th`

  switch (day % 10) {
    case 1:
      return `${day}st`
    case 2:
      return `${day}nd`
    case 3:
      return `${day}rd`
    default:
      return `${day}th`
  }
}

function formatToday(date) {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' })
  const month = date.toLocaleDateString('en-US', { month: 'long' })
  const year = date.getFullYear()
  return {
    weekday,
    date: `${month} ${getOrdinalSuffix(date.getDate())}, ${year}`,
  }
}

function formatCurrentTime(date) {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function getCurrentTimePosition(date) {
  const currentHours = date.getHours() + date.getMinutes() / 60
  const startHour = 8
  const endHour = 18
  const normalized = ((currentHours - startHour) / (endHour - startHour)) * 100
  return Math.min(100, Math.max(0, normalized))
}

function TimeScale({ scheduleEntries }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date())
    }, 1000)
    return () => window.clearInterval(intervalId)
  }, [])
  const currentTime = useMemo(() => formatCurrentTime(now), [now])
  const currentTimeTop = useMemo(() => `${getCurrentTimePosition(now)}%`, [now])

  return (
    <div className="schedule-container">
      <div className="current-time-indicator" style={{ top: currentTimeTop }}>
        <span className="current-time-label">Now {currentTime}</span>
      </div>

      <div className="time-block">
        <div className="time-label">08:00</div>
        <div className="time-line" />
      </div>

      <div className="time-block">
        <div className="time-label">09:00</div>
        <div className="time-line" />
        <div className="event" style={{ top: 0, height: 70 }}>
          <span className="event-time">{scheduleEntries[0].time}</span>
          {scheduleEntries[0].title}
        </div>
      </div>

      <div className="time-block">
        <div className="time-label">10:00</div>
        <div className="time-line" />
      </div>
      <div className="time-block">
        <div className="time-label">11:00</div>
        <div className="time-line" />
      </div>

      <div className="time-block">
        <div className="time-label">12:00</div>
        <div className="time-line" />
        <div
          className="event event--neutral"
          style={{ top: -10, height: 40 }}
        >
          <span className="event-time event-time--neutral">{scheduleEntries[1].time}</span>
          {scheduleEntries[1].title}
        </div>
      </div>

      <div className="time-block">
        <div className="time-label">13:00</div>
        <div className="time-line" />
      </div>

      <div className="time-block">
        <div className="time-label">14:00</div>
        <div className="time-line" />
        <div className="event" style={{ top: 20, height: 90 }}>
          <span className="event-time">{scheduleEntries[2].time}</span>
          {scheduleEntries[2].title}
        </div>
      </div>

      <div className="time-block">
        <div className="time-label">15:00</div>
        <div className="time-line" />
      </div>
      <div className="time-block">
        <div className="time-label">16:00</div>
        <div className="time-line" />
      </div>
      <div className="time-block">
        <div className="time-label">17:00</div>
        <div className="time-line" />
      </div>
      <div className="time-block">
        <div className="time-label">18:00</div>
        <div className="time-line" />
      </div>
    </div>
  )
}

function PlannerHeader({ weekLabel, dividerLabel, dayTitle, dateLabel }) {
  return (
    <header className="date-header">
      <div className="meta-top">
        <span>{weekLabel}</span>
        <div className="meta-line" />
        <span>{dividerLabel}</span>
      </div>
      <h1 className="day-title">{dayTitle}</h1>
      <div className="date-subtitle">{dateLabel}</div>
    </header>
  )
}

function NotesPanel({ text }) {
  return (
    <div className="notes-area">
      <svg className="watermark" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill="currentColor" d="M50 100 C 40 80, 20 60, 20 40 C 20 20, 40 10, 50 10 C 60 10, 80 20, 80 40 C 80 60, 60 80, 50 100 Z" />
        <path fill="currentColor" d="M50 90 C 45 70, 30 50, 30 35 C 30 20, 45 15, 50 15 C 55 15, 70 20, 70 35 C 70 50, 55 70, 50 90 Z" opacity="0.5" />
        <circle cx="50" cy="30" r="5" fill="currentColor" />
      </svg>

      <div className="ruled-line" />
      <div className="ruled-line" />
      <div className="ruled-line" />
      <div className="ruled-line" />
      <div className="ruled-line" />
      <div className="ruled-line" />

      <div className="handwriting">
        {text.map((line, index) => (
          <span key={line}>
            {line}
            {index < text.length - 1 ? <br /> : null}
          </span>
        ))}
      </div>
    </div>
  )
}

function PlannerPage({ side, tone, children, className = '' }) {
  return (
    <section className={`planner-sheet planner-sheet--${side} planner-sheet--${tone} ${className}`.trim()}>
      {children}
    </section>
  )
}

const PEEL_MS = 780
const PEEL_EASE = 'cubic-bezier(0.25, 0.82, 0.2, 1)'

function FridayPlannerBook() {
  const [activeTab, setActiveTab] = useState('Mar')
  const [calendarTick, setCalendarTick] = useState(0)
  const [tasks, setTasks] = useState(fridayTasks)
  const [weekendTasks, setWeekendTasks] = useState(saturdayTasks)

  const [spread, setSpread] = useState(0)
  /** idle | fwd | backSnap | backRun */
  const [flipAnim, setFlipAnim] = useState('idle')
  const [dragDeg, setDragDeg] = useState(null)
  const dragStart = useRef({ x: 0 })

  const spreadRef = useRef(0)
  const flipAnimRef = useRef('idle')
  useEffect(() => {
    spreadRef.current = spread
  }, [spread])
  useEffect(() => {
    flipAnimRef.current = flipAnim
  }, [flipAnim])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCalendarTick((n) => n + 1)
    }, 60_000)
    return () => window.clearInterval(intervalId)
  }, [])

  const toggleTask = (id) => {
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)),
    )
  }

  const toggleWeekendTask = (id) => {
    setWeekendTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)),
    )
  }

  const today = useMemo(() => {
    void calendarTick
    return formatToday(new Date())
  }, [calendarTick])
  const nextDay = useMemo(() => {
    void calendarTick
    const future = new Date()
    future.setDate(future.getDate() + 1)
    return formatToday(future)
  }, [calendarTick])

  const syncActiveTab = useCallback((s) => {
    setActiveTab(s >= 1 ? 'Apr' : 'Mar')
  }, [])

  const finishForward = useCallback(() => {
    setSpread(1)
    setFlipAnim('idle')
    syncActiveTab(1)
  }, [syncActiveTab])

  const finishBack = useCallback(() => {
    setSpread(0)
    setFlipAnim('idle')
    syncActiveTab(0)
  }, [syncActiveTab])

  const startForward = useCallback(() => {
    if (spreadRef.current !== 0 || flipAnimRef.current !== 'idle') return
    setDragDeg(null)
    setFlipAnim('fwd')
  }, [])

  const startBack = useCallback(() => {
    if (spreadRef.current !== 1 || flipAnimRef.current !== 'idle') return
    setDragDeg(null)
    setFlipAnim('backSnap')
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFlipAnim('backRun')
      })
    })
  }, [])

  const onFriPivotTransitionEnd = (event) => {
    if (event.propertyName !== 'transform') return
    if (flipAnim === 'fwd') finishForward()
  }

  const onBackOverlayTransitionEnd = (event) => {
    if (event.propertyName !== 'transform') return
    if (flipAnim === 'backRun') finishBack()
  }

  const handleTabSelect = (tab) => {
    setActiveTab(tab)
    if (tab === 'Apr' && spreadRef.current < 1) startForward()
    if (tab === 'Mar' && spreadRef.current >= 1) startBack()
  }

  const friPivotStyle = (() => {
    if (spread !== 0) {
      return { transform: 'rotateY(0deg)', transition: 'none' }
    }
    if (dragDeg !== null) {
      return { transform: `rotateY(${dragDeg}deg)`, transition: 'none' }
    }
    if (flipAnim === 'fwd') {
      return { transform: 'rotateY(-178deg)', transition: `transform ${PEEL_MS}ms ${PEEL_EASE}` }
    }
    return { transform: 'rotateY(0deg)', transition: 'none' }
  })()

  const backOverlayPivotStyle =
    flipAnim === 'backSnap'
      ? { transform: 'rotateY(-178deg)', transition: 'none' }
      : flipAnim === 'backRun'
        ? { transform: 'rotateY(0deg)', transition: `transform ${PEEL_MS}ms ${PEEL_EASE}` }
        : { transform: 'rotateY(0deg)', transition: 'none' }

  const onCornerPointerDown = (e) => {
    if (spread !== 0 || flipAnim !== 'idle') return
    if (e.button !== undefined && e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragStart.current = { x: e.clientX }
    setDragDeg(0)
  }

  const onCornerPointerMove = (e) => {
    if (dragDeg === null) return
    const delta = e.clientX - dragStart.current.x
    const next = Math.max(-178, Math.min(0, delta * 0.45))
    setDragDeg(next)
  }

  const onCornerPointerUp = (e) => {
    if (dragDeg === null) return
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    if (dragDeg < -88) {
      setDragDeg(null)
      setFlipAnim('fwd')
    } else {
      setDragDeg(null)
    }
  }

  const renderFridayRight = (withGrab, grabKey) => (
    <>
      <GutterRingsStrip />
      <PlannerPage side="right" tone="friday">
        <div className="corner-deco">
          <div className="corner-dot" />
          <div className="corner-dot corner-dot--soft" />
        </div>

        <h2 className="section-title">Priorities</h2>
        <ul className="task-list">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} onToggle={toggleTask} />
          ))}
        </ul>

        <h2 className="section-title">Journal &amp; Notes</h2>
        <NotesPanel
          text={[
            'Remember to ask Sarah about the new ceramic vases...',
            'The matte finish works beautifully with the soft pinks.',
          ]}
        />
      </PlannerPage>
      {withGrab ? (
        <div
          key={grabKey}
          className="planner-corner-grab"
          aria-hidden="true"
          onPointerDown={onCornerPointerDown}
          onPointerMove={onCornerPointerMove}
          onPointerUp={onCornerPointerUp}
          onPointerCancel={onCornerPointerUp}
        />
      ) : null}
    </>
  )

  return (
    <main className="desk-surface">
      <PlannerTabs activeTab={activeTab} setActiveTab={handleTabSelect} />

      <div className="planner-book planner-book--native planner-book">
        <div className="planner-stack">
          <div
            className="planner-spread-layer planner-spread-layer--sat"
            data-active={spread === 1 ? 'true' : 'false'}
          >
            <PlannerPage side="left" tone="saturday">
              <PlannerHeader weekLabel="Weekend" dividerLabel="Next Page" dayTitle="Saturday" dateLabel={nextDay.date} />
              <TimeScale scheduleEntries={saturdaySchedule} />
            </PlannerPage>
            <div className="planner-right-pivot">
              <GutterRingsStrip />
              <PlannerPage side="right" tone="saturday">
                <div className="corner-deco">
                  <div className="corner-dot" />
                  <div className="corner-dot corner-dot--soft" />
                </div>

                <h2 className="section-title">Weekend Priorities</h2>
                <ul className="task-list">
                  {weekendTasks.map((task) => (
                    <TaskItem key={task.id} task={task} onToggle={toggleWeekendTask} />
                  ))}
                </ul>

                <h2 className="section-title">Journal &amp; Notes</h2>
                <NotesPanel
                  text={[
                    'Keep the palette soft, then hand off the dense work to the afternoon shift.',
                    'Drag the corner back to Friday when the studio closes.',
                  ]}
                />
              </PlannerPage>
            </div>
          </div>

          <div
            className="planner-spread-layer planner-spread-layer--fri"
            data-active={spread === 0 ? 'true' : 'false'}
          >
            <PlannerPage side="left" tone="friday">
              <PlannerHeader weekLabel="Week 12" dividerLabel="Spring Equinox" dayTitle={today.weekday} dateLabel={today.date} />
              <TimeScale scheduleEntries={fridaySchedule} />
            </PlannerPage>
            <div
              className="planner-right-pivot"
              style={friPivotStyle}
              onTransitionEnd={onFriPivotTransitionEnd}
            >
              {renderFridayRight(true, 'fri-grab-main')}
            </div>
          </div>

          {(flipAnim === 'backSnap' || flipAnim === 'backRun') && (
            <div className="planner-spread-layer planner-spread-layer--fri planner-spread-layer--overlay">
              <PlannerPage side="left" tone="friday">
                <PlannerHeader weekLabel="Week 12" dividerLabel="Spring Equinox" dayTitle={today.weekday} dateLabel={today.date} />
                <TimeScale scheduleEntries={fridaySchedule} />
              </PlannerPage>
              <div
                className="planner-right-pivot"
                style={backOverlayPivotStyle}
                onTransitionEnd={onBackOverlayTransitionEnd}
              >
                {renderFridayRight(false, 'fri-overlay')}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default function FridayPlannerPage() {
  return (
    <div className="friday-planner-page">
      <FridayPlannerBook />
    </div>
  )
}

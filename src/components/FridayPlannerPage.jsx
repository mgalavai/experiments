import { useEffect, useMemo, useState } from 'react'

const monthTabs = ['Jan', 'Feb', 'Mar', 'Apr', 'May']

const scheduleEntries = [
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

const initialTasks = [
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

function RingGroup() {
  return (
    <div className="ring-group">
      <div className="hole left" />
      <div className="ring" />
      <div className="hole right" />
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

function PlannerBook() {
  const [activeTab, setActiveTab] = useState('Mar')
  const [tasks, setTasks] = useState(initialTasks)
  const [now, setNow] = useState(() => new Date())
  const [isPageTurned, setIsPageTurned] = useState(false)

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [])

  const toggleTask = (id) => {
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)),
    )
  }

  const today = useMemo(() => formatToday(now), [now])
  const nextDay = useMemo(() => {
    const future = new Date(now)
    future.setDate(future.getDate() + 1)
    return formatToday(future)
  }, [now])
  const currentTime = useMemo(() => formatCurrentTime(now), [now])
  const currentTimeTop = useMemo(() => `${getCurrentTimePosition(now)}%`, [now])

  return (
    <main className="desk-surface">
      <article className="planner-book">
        <PlannerTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        <section className="page left">
          <header className="date-header">
            <div className="meta-top">
              <span>Week 12</span>
              <div className="meta-line" />
              <span>Spring Equinox</span>
            </div>
            <h1 className="day-title">{today.weekday}</h1>
            <div className="date-subtitle">{today.date}</div>
          </header>

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
              <div className="event" style={{ top: -10, height: 40, background: 'transparent', borderLeftColor: 'var(--ink-light)' }}>
                <span className="event-time" style={{ color: 'var(--ink-medium)' }}>
                  {scheduleEntries[1].time}
                </span>
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
        </section>

        <section className="spine" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, index) => (
            <RingGroup key={index} />
          ))}
        </section>

        <section className="page-turn-stage">
          <section className="page right page-turn-back" aria-hidden={!isPageTurned}>
            <div className="corner-deco corner-deco--back">
              <div className="corner-dot" />
              <div className="corner-dot corner-dot--soft" />
            </div>

            <h2 className="section-title">Saturday</h2>
            <div className="next-page-subtitle">{nextDay.date}</div>

            <div className="next-page-panel">
              <div className="next-page-panel-title">Continuation</div>
              <ul className="next-page-list">
                <li>08:30 Market stem run</li>
                <li>10:00 Condition arrivals</li>
                <li>14:00 Client sample review</li>
              </ul>
            </div>

            <div className="next-page-note">
              <span className="next-page-note-label">Page two</span>
              <p>Keep the palette soft, then hand off the dense work to the afternoon shift.</p>
            </div>

            <div className="notes-area notes-area--back">
              <div className="ruled-line" />
              <div className="ruled-line" />
              <div className="ruled-line" />
              <div className="ruled-line" />
              <div className="ruled-line" />
              <div className="ruled-line" />
            </div>
          </section>

          <section className={`page right page-turn-front ${isPageTurned ? 'is-turned' : ''}`}>
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
                Remember to ask Sarah about the new ceramic vases...
                <br />
                The matte finish works beautifully with the soft pinks.
              </div>
            </div>

          </section>

          <button
            type="button"
            className={`page-turn-corner ${isPageTurned ? 'is-open' : ''}`}
            aria-pressed={isPageTurned}
            aria-label={isPageTurned ? 'Return to Friday page' : 'Turn to next page'}
            onClick={() => setIsPageTurned((current) => !current)}
          >
            <span className="page-turn-corner-fold" />
          </button>
        </section>
      </article>
    </main>
  )
}

export default function FridayPlannerPage() {
  return (
    <div className="friday-planner-page">
      <PlannerBook />
    </div>
  )
}

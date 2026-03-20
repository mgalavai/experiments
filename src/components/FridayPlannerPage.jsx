import { useState } from 'react'

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

function PlannerBook() {
  const [activeTab, setActiveTab] = useState('Mar')
  const [tasks, setTasks] = useState(initialTasks)

  const toggleTask = (id) => {
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)),
    )
  }

  return (
    <main className="desk-surface">
      <PlannerTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <article className="planner-book">
        <section className="page left">
          <header className="date-header">
            <div className="meta-top">
              <span>Week 12</span>
              <div className="meta-line" />
              <span>Spring Equinox</span>
            </div>
            <h1 className="day-title">Thursday</h1>
            <div className="date-subtitle">March 21st, 2024</div>
          </header>

          <div className="schedule-container">
            <div className="current-time-indicator" />

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

        <section className="page right">
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

          <div className="page-curl-target" />
          <div className="page-curl" />
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

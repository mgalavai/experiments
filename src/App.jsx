import { useState } from 'react'
import { Agentation } from 'agentation'

const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY']

const hours = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
]

const scheduleEvents = [
  {
    id: 'botanical-sourcing',
    time: '09:00 - 10:30',
    title: 'Botanical Sourcing & Vendor Calls',
    start: 9,
    end: 10.5,
  },
  {
    id: 'lunch',
    time: '11:50 - 12:30',
    title: 'Lunch Break',
    start: 11.83,
    end: 12.5,
    variant: 'compact',
  },
  {
    id: 'review',
    time: '14:30 - 16:00',
    title: 'Review Q2 Floral Arrangements Design Mockups',
    start: 14.5,
    end: 16,
  },
]

const priorities = [
  {
    id: 'palette',
    done: true,
    title: "Finalize color palette for the 'Flower Friendly' landing page campaign.",
    tag: 'DESIGN',
    due: null,
  },
  {
    id: 'inventory',
    done: false,
    title: 'Update inventory counts for Peonies and Ranunculus arrivals.',
    tag: 'OPERATIONS',
    due: 'Due 2:00 PM',
  },
  {
    id: 'copy',
    done: false,
    title: 'Draft copy for the bespoke wedding bouquet brochure.',
    tag: null,
    due: null,
  },
]

function ordinal(day) {
  const mod100 = day % 100
  if (mod100 >= 11 && mod100 <= 13) return `${day}th`

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

function MonthRail({ activeMonth, onSelectMonth }) {
  return (
    <aside className="month-rail" aria-label="Months">
      {months.map((month) => (
        <button
          key={month}
          type="button"
          className={`month-tab ${month === activeMonth ? 'is-active' : ''}`}
          onClick={() => onSelectMonth(month)}
          aria-pressed={month === activeMonth}
        >
          {month}
        </button>
      ))}
    </aside>
  )
}

function TimelineEvent({ event }) {
  const startOffset = ((event.start - 8) / 10) * 100
  const height = ((event.end - event.start) / 10) * 100

  return (
    <article
      className={`timeline-event ${event.variant === 'compact' ? 'is-compact' : ''}`}
      style={{
        top: `${startOffset}%`,
        height: `${height}%`,
      }}
    >
      <div className="timeline-event-rail" aria-hidden="true" />
      <div className="timeline-event-copy">
        <span className="timeline-event-time">{event.time}</span>
        <span className="timeline-event-title">{event.title}</span>
      </div>
    </article>
  )
}

function PriorityItem({ item, onToggle }) {
  return (
    <li className={`priority-item ${item.done ? 'is-done' : ''}`}>
      <button type="button" className="priority-toggle" aria-pressed={item.done} onClick={() => onToggle(item.id)}>
        <span className="priority-toggle-dot" />
      </button>

      <div className="priority-copy">
        <p className="priority-text">{item.title}</p>
        <div className="priority-meta">
          {item.tag && <span className="priority-pill">{item.tag}</span>}
          {item.due && <span className="priority-due">{item.due}</span>}
        </div>
      </div>
    </li>
  )
}

function FridayPlanner() {
  const [activeMonth, setActiveMonth] = useState('MAR')
  const [priorityList, setPriorityList] = useState(priorities)

  const togglePriority = (id) => {
    setPriorityList((current) =>
      current.map((item) => (item.id === id ? { ...item, done: !item.done } : item)),
    )
  }

  return (
    <main className="friday-page">
      <div className="friday-backdrop" aria-hidden="true" />

      <section className="planner-stage">
        <MonthRail activeMonth={activeMonth} onSelectMonth={setActiveMonth} />

        <article className="planner-book">
          <div className="planner-book-glow" aria-hidden="true" />

          <section className="planner-page planner-page--left">
            <div className="planner-microcopy">
              <span>WEEK 12</span>
              <span className="planner-rule" aria-hidden="true" />
              <span>SPRING EQUINOX</span>
            </div>

            <header className="planner-heading">
              <h1>Friday</h1>
              <p>{`March ${ordinal(22)}, 2024`}</p>
            </header>

            <div className="timeline-wrap">
              <div className="timeline-grid" aria-label="Daily schedule">
                {hours.map((hour, index) => (
                  <div key={hour} className="timeline-hour" style={{ top: `${(index / 10) * 100}%` }}>
                    <span className="timeline-hour-label">{hour}</span>
                    <span className="timeline-hour-line" />
                  </div>
                ))}

                <div className="current-time-line" style={{ top: '27.4%' }} aria-hidden="true">
                  <span className="current-time-dot" />
                  <span className="current-time-stroke" />
                </div>

                {scheduleEvents.map((event) => (
                  <TimelineEvent key={event.id} event={event} />
                ))}
              </div>
            </div>
          </section>

          <div className="planner-spine" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="planner-binder" style={{ top: `${14 + index * 15}%` }}>
                <span className="planner-binder-cap" />
                <span className="planner-binder-core" />
                <span className="planner-binder-cap" />
              </div>
            ))}
          </div>

          <section className="planner-page planner-page--right">
            <div className="planner-dots" aria-hidden="true">
              <span />
              <span />
            </div>

            <div className="planner-section">
              <h2>Priorities</h2>
              <ul className="priority-list">
                {priorityList.map((item) => (
                  <PriorityItem key={item.id} item={item} onToggle={togglePriority} />
                ))}
              </ul>
            </div>

            <div className="planner-section planner-section--notes">
              <h2>Journal &amp; Notes</h2>
              <div className="notes-card">
                <div className="notes-watermark" aria-hidden="true" />
                <p>Remember to ask Sarah about the new ceramic vases...</p>
                <p>The matte finish works beautifully with the soft pinks.</p>
              </div>
            </div>
          </section>
        </article>
      </section>

      {import.meta.env.DEV && <Agentation />}
    </main>
  )
}

export default function App() {
  return <FridayPlanner />
}

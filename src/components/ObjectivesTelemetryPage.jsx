import { useEffect, useMemo, useState } from 'react'
import './objectives-telemetry.css'

const objectiveModules = [
  {
    id: 'objective-1',
    objectiveLabel: 'Objective 1',
    title: 'Pre-requisites for delivering value',
    primaryKpi: 'Service uptime %',
    primaryValue: '99.97%',
    goalLabel: 'Target: 99.95%',
    minLabel: '95',
    maxLabel: '100',
    width: 92,
    markers: ['25%', '50%', '75%'],
    footerLeft: 'Primary System: PLATFORM_CORE',
    footerRight: 'Rate: Stable',
    details: [
      { label: 'Service uptime %', value: '99.97', barWidth: 92 },
      { label: 'Data incidents per user', value: '0.02', barWidth: 18 },
      { label: 'Ticket resolution satisfaction score', value: '4.7 / 5', barWidth: 94 },
      { label: 'Usability test score %', value: '91%', barWidth: 91 },
    ],
    events: [
      'OBJ1 :: Service uptime % .................. 99.97%',
      'OBJ1 :: Data incidents per user .......... 0.02',
      'OBJ1 :: Ticket resolution satisfaction ... 4.7 / 5',
      'OBJ1 :: Usability test score % ........... 91%',
    ],
  },
  {
    id: 'objective-2',
    objectiveLabel: 'Objective 2',
    title: 'Premium and seamless customer experience',
    primaryKpi: 'Onboarding completion time (hours)',
    primaryValue: '2.4h',
    goalLabel: 'Target: 2.0h',
    minLabel: '0',
    maxLabel: '6.0',
    width: 40,
    markers: ['33%', '66%'],
    footerLeft: 'Current Focus: ONBOARDING_FLOW',
    footerRight: 'Mode: Improving',
    details: [
      { label: 'Onboarding completion time (hours)', value: '2.4', barWidth: 40 },
      { label: 'Onboarding time reduction %', value: '41%', barWidth: 41 },
      { label: 'Onboarding drop-out reduction %', value: '28%', barWidth: 28 },
      { label: 'Monthly active user growth %', value: '19%', barWidth: 76 },
      { label: 'Key feature interaction %', value: '73%', barWidth: 73 },
    ],
    events: [
      'OBJ2 :: Onboarding completion time ....... 2.4h',
      'OBJ2 :: Onboarding time reduction % ...... 41%',
      'OBJ2 :: Onboarding drop-out reduction % .. 28%',
      'OBJ2 :: Monthly active user growth % ..... 19%',
      'OBJ2 :: Key feature interaction % ........ 73%',
    ],
  },
  {
    id: 'objective-3',
    objectiveLabel: 'Objective 3',
    title: 'Enable dealer business optimization',
    primaryKpi: 'End-customer account setup time reduction %',
    primaryValue: '36%',
    goalLabel: 'Target: 40%',
    minLabel: '0',
    maxLabel: '50',
    width: 72,
    markers: ['20%', '40%', '60%', '80%'],
    footerLeft: 'Dealer Rollout: WAVE_12',
    footerRight: 'Status: Advancing',
    details: [
      { label: 'End-customer account setup time reduction %', value: '36%', barWidth: 72 },
      { label: 'Dealer tool satisfaction score (5-point scale)', value: '4.4 / 5', barWidth: 88 },
    ],
    events: [
      'OBJ3 :: Setup time reduction % ........... 36%',
      'OBJ3 :: Dealer tool satisfaction ......... 4.4 / 5',
    ],
  },
]

const matrixItems = [
  ['OBJ1', 'READY'],
  ['OBJ2', 'PREM'],
  ['OBJ3', 'ENBL'],
  ['OPS', '99.97%'],
  ['DATA', '0.02'],
  ['SAT', '4.7/5'],
  ['MAU', '+19%'],
  ['KFI', '73%'],
]

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

function formatClock(date) {
  const day = String(date.getDate()).padStart(2, '0')
  const month = MONTHS[date.getMonth()]
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`
}

function ObjectiveModule({ module, isSelected, onSelect }) {
  return (
    <button
      type="button"
      className={`telemetry-module telemetry-module-button ${isSelected ? 'is-selected' : ''}`}
      onClick={() => onSelect(module.id)}
      aria-pressed={isSelected}
    >
      <div className="telemetry-module-header">
        <div className="telemetry-module-heading">
          <span className="telemetry-objective-label">{module.objectiveLabel}</span>
          <span>{module.title}</span>
        </div>
        <span className="dim">{module.goalLabel}</span>
      </div>

      <div className="telemetry-chart-container">
        <span className="telemetry-axis-label">{module.minLabel}</span>
        <div className="telemetry-chart-frame">
          {module.markers.map((marker) => (
            <div key={marker} className="telemetry-frame-marker" style={{ left: marker }} />
          ))}
          <div className="telemetry-bar-fill" style={{ width: `${module.width}%` }} />
        </div>
        <span className="telemetry-axis-label dim">{module.maxLabel}</span>
      </div>

      <div className="telemetry-module-footer">
        <span>
          {module.primaryKpi}: {module.primaryValue}
        </span>
        <span className="dim">{module.footerRight}</span>
      </div>

      <div className="telemetry-module-subfooter">
        <span>{module.footerLeft}</span>
        <span className="telemetry-module-hint">{isSelected ? 'ACTIVE DETAIL FEED' : 'SELECT TO INSPECT'}</span>
      </div>
    </button>
  )
}

function StatusMatrix({ selectedObjectiveId }) {
  const selectedMatrixLabel = selectedObjectiveId === 'objective-1'
    ? 'OBJ1'
    : selectedObjectiveId === 'objective-2'
      ? 'OBJ2'
      : 'OBJ3'

  return (
    <section className="telemetry-matrix-module">
      <div className="telemetry-matrix-title dim">Objective Signal Matrix</div>
      <div className="telemetry-matrix-grid">
        {matrixItems.map(([label, value]) => {
          const isSelected = label === selectedMatrixLabel

          return (
            <div key={label} className={`telemetry-matrix-pair ${isSelected ? 'is-selected' : ''}`}>
              <span className="telemetry-m-label">{label}:</span>
              <span className="telemetry-m-value">{value}</span>
            </div>
          )
        })}
        <div className="telemetry-m-total">Portfolio Integrity: 92%</div>
      </div>
    </section>
  )
}

function ObjectiveDetailDeck({ module, animatedWidths }) {
  return (
    <section className="telemetry-module telemetry-module--detail">
      <div className="telemetry-module-header">
        <div className="telemetry-module-heading">
          <span className="telemetry-objective-label">Selected Feed</span>
          <span>
            {module.objectiveLabel}: {module.title}
          </span>
        </div>
        <span className="dim">Interactive Detail Panel</span>
      </div>

      <div className="telemetry-detail-summary">
        <div>{module.primaryKpi}</div>
        <div className="telemetry-detail-summary-meta">
          <span>{module.primaryValue}</span>
          <span className="dim">{module.goalLabel}</span>
        </div>
      </div>

      <div className={`telemetry-detail-grid telemetry-detail-grid--${module.id}`}>
        {module.details.map((detail, index) => (
          <div key={detail.label} className="telemetry-detail-card">
            <div className="telemetry-detail-card-header">
              <span className="dim">{detail.label}</span>
              <span>{detail.value}</span>
            </div>
            <div className="telemetry-detail-track">
              <div className="telemetry-detail-track-fill" style={{ width: `${animatedWidths[index]}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function EventLog({ module }) {
  return (
    <section className="telemetry-module telemetry-module--log">
      <div className="telemetry-module-header">
        <div className="telemetry-module-heading">
          <span className="telemetry-objective-label">Index</span>
          <span>
            {module.objectiveLabel} KPI Event Log
          </span>
        </div>
        <span className="dim">Filtered by selection</span>
      </div>
      <div className="telemetry-chart-container telemetry-chart-container--log">
        <span className="telemetry-axis-label" />
        <div className="telemetry-chart-frame telemetry-chart-frame--log">
          {module.events.map((entry, index) => (
            <div key={entry} className={index % 2 === 0 ? '' : 'dim'}>
              {entry}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function ObjectivesTelemetryPage() {
  const [clock, setClock] = useState(() => formatClock(new Date()))
  const [selectedObjectiveId, setSelectedObjectiveId] = useState(objectiveModules[0].id)
  const [detailPulse, setDetailPulse] = useState(0)

  const selectedObjective = useMemo(
    () => objectiveModules.find((module) => module.id === selectedObjectiveId) ?? objectiveModules[0],
    [selectedObjectiveId],
  )

  const animatedDetailWidths = useMemo(
    () =>
      selectedObjective.details.map((detail, index) => {
        if (index === 0) return detail.barWidth
        return Math.max(10, Math.min(100, detail.barWidth + detailPulse * (index % 2 === 0 ? 1 : -1)))
      }),
    [detailPulse, selectedObjective],
  )

  useEffect(() => {
    const clockInterval = window.setInterval(() => {
      setClock(formatClock(new Date()))
    }, 1000)

    const pulseInterval = window.setInterval(() => {
      setDetailPulse((Math.random() * 6) - 3)
    }, 2200)

    return () => {
      window.clearInterval(clockInterval)
      window.clearInterval(pulseInterval)
    }
  }, [])

  return (
    <div className="telemetry-page">
      <div className="telemetry-crt-monitor">
        <div className="telemetry-flicker-layer" />
        <div className="telemetry-scan-line" />

        <div className="telemetry-terminal">
          <header className="telemetry-header">
            <div className="telemetry-header-left">
              <div>Node: CX_CONTROL_PRIME</div>
              <div>
                Status: <span className="blink-text">NOMINAL</span>
              </div>
            </div>
            <div className="telemetry-header-center">
              <div>Strategic Telemetry Utility</div>
              <div className="telemetry-title-inverted">OBJECTIVE KPI MONITOR</div>
            </div>
            <div className="telemetry-header-right">{clock}</div>
          </header>

          <main className="telemetry-main">
            <div className="telemetry-main-column telemetry-main-column--left">
              <ObjectiveModule
                module={objectiveModules[0]}
                isSelected={selectedObjectiveId === objectiveModules[0].id}
                onSelect={setSelectedObjectiveId}
              />
              <ObjectiveModule
                module={objectiveModules[1]}
                isSelected={selectedObjectiveId === objectiveModules[1].id}
                onSelect={setSelectedObjectiveId}
              />
              <ObjectiveModule
                module={objectiveModules[2]}
                isSelected={selectedObjectiveId === objectiveModules[2].id}
                onSelect={setSelectedObjectiveId}
              />
            </div>
            <div className="telemetry-main-column telemetry-main-column--right">
              <StatusMatrix selectedObjectiveId={selectedObjectiveId} />
              <ObjectiveDetailDeck module={selectedObjective} animatedWidths={animatedDetailWidths} />
              <EventLog module={selectedObjective} />
            </div>
          </main>

          <div className="telemetry-command-line">
            <span>SELECT OBJECTIVE TO LOAD KPI DETAIL_</span>
            <span className="telemetry-cursor" />
          </div>
        </div>
      </div>
    </div>
  )
}

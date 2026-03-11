import { useEffect, useState } from 'react'
import './objectives-telemetry.css'

const objectiveModules = [
  {
    id: 'objective-1',
    objectiveLabel: 'Objective 1',
    title: 'Pre-requisites for delivering value',
    primaryKpi: 'Service uptime %',
    goalLabel: 'Target: 99.95%',
    minLabel: '95',
    maxLabel: '100',
    value: 99.97,
    width: 92,
    markers: ['25%', '50%', '75%'],
    footerLeft: 'Primary System: PLATFORM_CORE',
    footerRight: 'Rate: Stable',
    details: [
      { label: 'Data incidents per user', value: '0.02' },
      { label: 'Ticket resolution satisfaction score', value: '4.7 / 5' },
      { label: 'Usability test score %', value: '91%' },
    ],
  },
  {
    id: 'objective-2',
    objectiveLabel: 'Objective 2',
    title: 'Premium and seamless customer experience',
    primaryKpi: 'Onboarding completion time (hours)',
    goalLabel: 'Target: 2.0h',
    minLabel: '0',
    maxLabel: '6.0',
    value: 2.4,
    width: 40,
    markers: ['33%', '66%'],
    footerLeft: 'Current Focus: ONBOARDING_FLOW',
    footerRight: 'Mode: Improving',
    details: [
      { label: 'Onboarding time reduction %', value: '41%' },
      { label: 'Onboarding drop-out reduction %', value: '28%' },
      { label: 'Monthly active user growth %', value: '19%' },
      { label: 'Key feature interaction %', value: '73%' },
    ],
  },
  {
    id: 'objective-3',
    objectiveLabel: 'Objective 3',
    title: 'Enable dealer business optimization',
    primaryKpi: 'End-customer account setup time reduction %',
    goalLabel: 'Target: 40%',
    minLabel: '0',
    maxLabel: '50',
    value: 36,
    width: 72,
    markers: ['20%', '40%', '60%', '80%'],
    footerLeft: 'Dealer Rollout: WAVE_12',
    footerRight: 'Status: Advancing',
    details: [{ label: 'Dealer tool satisfaction score (5-point scale)', value: '4.4 / 5' }],
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

const splitMetrics = [
  {
    title: 'Monthly active user growth %',
    valueLabel: '+19%',
    width: 79,
  },
  {
    title: 'Key feature interaction %',
    valueLabel: '73%',
    width: 73,
  },
]

const eventLogEntries = [
  'OBJ1 :: Service uptime % .................. 99.97%',
  'OBJ1 :: Data incidents per user .......... 0.02',
  'OBJ1 :: Ticket resolution satisfaction ... 4.7 / 5',
  'OBJ1 :: Usability test score % ........... 91%',
  'OBJ2 :: Onboarding completion time ....... 2.4h',
  'OBJ2 :: Onboarding time reduction % ...... 41%',
  'OBJ2 :: Onboarding drop-out reduction % .. 28%',
  'OBJ2 :: Monthly active user growth % ..... 19%',
  'OBJ2 :: Key feature interaction % ........ 73%',
  'OBJ3 :: Setup time reduction % ........... 36%',
  'OBJ3 :: Dealer tool satisfaction ......... 4.4 / 5',
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

function ObjectiveModule({ module }) {
  return (
    <section className="telemetry-module">
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
        <span>{module.primaryKpi}: {module.value}</span>
        <span className="dim">{module.footerRight}</span>
      </div>

      <div className="telemetry-module-subfooter">
        <span>{module.footerLeft}</span>
      </div>

      <div className={`telemetry-kpi-grid telemetry-kpi-grid--${module.id}`}>
        {module.details.map((detail) => (
          <div key={detail.label} className="telemetry-kpi-row">
            <span className="dim">{detail.label}</span>
            <span>{detail.value}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function StatusMatrix() {
  return (
    <section className="telemetry-matrix-module">
      <div className="telemetry-matrix-title dim">Objective Signal Matrix</div>
      <div className="telemetry-matrix-grid">
        {matrixItems.map(([label, value]) => (
          <div key={label} className="telemetry-matrix-pair">
            <span className="telemetry-m-label">{label}:</span>
            <span className="telemetry-m-value">{value}</span>
          </div>
        ))}
        <div className="telemetry-m-total">Portfolio Integrity: 92%</div>
      </div>
    </section>
  )
}

function SplitMetrics({ activeWidth }) {
  return (
    <section className="telemetry-module telemetry-module--split">
      <div className="telemetry-chart-container">
        <span className="telemetry-axis-label">0</span>
        <div className="telemetry-chart-frame telemetry-chart-frame--split">
          <div className="telemetry-split-chart">
            {splitMetrics.map((metric, index) => (
              <div key={metric.title} className="telemetry-split-row">
                <div className="telemetry-split-label">
                  <span>{metric.title}</span>
                  <span className="dim">{metric.valueLabel}</span>
                </div>
                <div
                  className="telemetry-bar-fill telemetry-bar-fill--thin"
                  style={{ width: `${index === 0 ? activeWidth : metric.width}%` }}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="telemetry-split-axis">
          <span className="telemetry-axis-label dim">25%</span>
          <span className="telemetry-axis-label dim">100%</span>
        </div>
      </div>
    </section>
  )
}

function EventLog() {
  return (
    <section className="telemetry-module telemetry-module--log">
      <div className="telemetry-module-header">
        <div className="telemetry-module-heading">
          <span className="telemetry-objective-label">Index</span>
          <span>Objective KPI Event Log</span>
        </div>
      </div>
      <div className="telemetry-chart-container telemetry-chart-container--log">
        <span className="telemetry-axis-label" />
        <div className="telemetry-chart-frame telemetry-chart-frame--log">
          {eventLogEntries.map((entry, index) => (
            <div key={entry} className={index % 3 === 0 ? 'dim' : ''}>
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
  const [activeSplitWidth, setActiveSplitWidth] = useState(splitMetrics[0].width)

  useEffect(() => {
    const clockInterval = window.setInterval(() => {
      setClock(formatClock(new Date()))
    }, 1000)

    const pulseInterval = window.setInterval(() => {
      setActiveSplitWidth(78 + (Math.random() * 4 - 2))
    }, 2000)

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
            <ObjectiveModule module={objectiveModules[0]} />
            <StatusMatrix />
            <ObjectiveModule module={objectiveModules[1]} />
            <SplitMetrics activeWidth={activeSplitWidth} />
            <ObjectiveModule module={objectiveModules[2]} />
            <EventLog />
          </main>

          <div className="telemetry-command-line">
            <span>AWAITING EXECUTIVE INPUT_</span>
            <span className="telemetry-cursor" />
          </div>
        </div>
      </div>
    </div>
  )
}

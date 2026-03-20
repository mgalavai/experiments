import { BrowserRouter, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Agentation } from 'agentation'
import DigitalKeyPage from './components/DigitalKeyPage'
import FridayPlannerPage from './components/FridayPlannerPage'
import ObjectivesTelemetryPage from './components/ObjectivesTelemetryPage'
import TEDMXFieldControllerPage from './components/TEDMXFieldControllerPage'

function TopNav() {
  const location = useLocation()
  const isTelemetryRoute = location.pathname === '/telemetry-monitor'
  const isPlannerRoute = location.pathname === '/friday-planner'

  return (
    <nav
      className={`app-nav ${isTelemetryRoute ? 'app-nav--telemetry' : ''} ${isPlannerRoute ? 'app-nav--planner' : ''}`}
      aria-label="Views"
    >
      <NavLink to="/telemetry-monitor">Objective Telemetry</NavLink>
      <NavLink to="/digital-key">Digital Key</NavLink>
      <NavLink to="/te-dmx">TE-DMX Controller</NavLink>
      <NavLink to="/friday-planner">Friday Planner</NavLink>
    </nav>
  )
}

function AppShell() {
  return (
    <>
      <TopNav />
      <Routes>
        <Route path="/" element={<Navigate to="/telemetry-monitor" replace />} />
        <Route path="/telemetry-monitor" element={<ObjectivesTelemetryPage />} />
        <Route path="/digital-key" element={<DigitalKeyPage />} />
        <Route path="/te-dmx" element={<TEDMXFieldControllerPage />} />
        <Route path="/friday-planner" element={<FridayPlannerPage />} />
      </Routes>
      {import.meta.env.DEV && <Agentation />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}

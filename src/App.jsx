import { BrowserRouter, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Agentation } from 'agentation'
import DigitalKeyPage from './components/DigitalKeyPage'
import FridayPlannerPage from './components/FridayPlannerPage'
import ObjectivesTelemetryPage from './components/ObjectivesTelemetryPage'
import TEDMXFieldControllerPage from './components/TEDMXFieldControllerPage'

const views = [
  {
    path: '/telemetry-monitor',
    label: 'Objective Telemetry',
    element: <ObjectivesTelemetryPage />,
  },
  {
    path: '/digital-key',
    label: 'Digital Key',
    element: <DigitalKeyPage />,
  },
  {
    path: '/te-dmx',
    label: 'TE-DMX Controller',
    element: <TEDMXFieldControllerPage />,
  },
  {
    path: '/friday-planner',
    label: 'Friday Planner',
    element: <FridayPlannerPage />,
  },
]

function TopNav() {
  const location = useLocation()
  const isTelemetryRoute = location.pathname === '/telemetry-monitor'
  const isDigitalKeyRoute = location.pathname === '/digital-key'
  const isPlannerRoute = location.pathname === '/friday-planner'

  return (
    <nav
      className={`app-nav ${isTelemetryRoute ? 'app-nav--telemetry' : ''} ${isDigitalKeyRoute ? 'app-nav--digital-key' : ''} ${isPlannerRoute ? 'app-nav--planner' : ''}`}
      aria-label="Views"
    >
      {views.map((view) => (
        <NavLink key={view.path} to={view.path}>
          {view.label}
        </NavLink>
      ))}
    </nav>
  )
}

function AppShell() {
  const location = useLocation()

  useEffect(() => {
    const routeClass = `route-${location.pathname.replace(/\//g, '-') || 'root'}`
    document.body.dataset.route = location.pathname
    document.body.classList.add(routeClass)

    return () => {
      document.body.classList.remove(routeClass)
      delete document.body.dataset.route
    }
  }, [location.pathname])

  return (
    <>
      <TopNav />
      <Routes>
        <Route path="/" element={<Navigate to={views[0].path} replace />} />
        {views.map((view) => (
          <Route key={view.path} path={view.path} element={view.element} />
        ))}
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

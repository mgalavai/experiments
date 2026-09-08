import { BrowserRouter, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import { Agentation } from 'agentation'
import DigitalKeyPage from './components/DigitalKeyPage'
import FridayPlannerPage from './components/FridayPlannerPage'
import ObjectivesTelemetryPage from './components/ObjectivesTelemetryPage'
import TEDMXFieldControllerPage from './components/TEDMXFieldControllerPage'
import LogoPage from './components/LogoPage'
import FieldTestPage from './components/FieldTestPage'
import LifelinePage from './components/LifelinePage'

const RealityTearPage = lazy(() => import('./components/RealityTearPage'))

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
  {
    path: '/logo',
    label: 'Logo',
    element: <LogoPage />,
  },
  {
    path: '/field-test',
    label: 'Field Test',
    element: <FieldTestPage />,
  },
  {
    path: '/lifeline',
    label: 'Lifeline',
    element: <LifelinePage />,
  },
  {
    path: '/reality-tear',
    label: 'Reality Tear',
    element: (
      <Suspense fallback={<div style={{ background: '#070d09', color: '#b9ff7a', minHeight: '100dvh', display: 'grid', placeItems: 'center' }}>Opening reality…</div>}>
        <RealityTearPage />
      </Suspense>
    ),
  },
]

function TopNav() {
  const location = useLocation()
  const isTelemetryRoute = location.pathname === '/telemetry-monitor'
  const isDigitalKeyRoute = location.pathname === '/digital-key'
  const isPlannerRoute = location.pathname === '/friday-planner'
  const isLogoRoute = location.pathname === '/logo'
  const isLifelineRoute = location.pathname === '/lifeline'

  return (
    <nav
      className={`app-nav ${isTelemetryRoute ? 'app-nav--telemetry' : ''} ${isDigitalKeyRoute ? 'app-nav--digital-key' : ''} ${isPlannerRoute ? 'app-nav--planner' : ''} ${isLogoRoute ? 'app-nav--logo' : ''} ${isLifelineRoute ? 'app-nav--lifeline' : ''}`}
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
  const isImmersiveRoute = location.pathname === '/field-test' || location.pathname === '/reality-tear'

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
      {!isImmersiveRoute && <TopNav />}
      <Routes>
        <Route path="/" element={<Navigate to={views[0].path} replace />} />
        {views.map((view) => (
          <Route key={view.path} path={view.path} element={view.element} />
        ))}
      </Routes>
      {import.meta.env.DEV && location.pathname !== '/reality-tear' && <Agentation />}
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

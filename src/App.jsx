import { BrowserRouter, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { Agentation } from 'agentation'
import DigitalKeyPage from './components/DigitalKeyPage'
import ReactiveNodePage from './components/ReactiveNodePage'
import TEDMXFieldControllerPage from './components/TEDMXFieldControllerPage'

function TopNav() {
  return (
    <nav className="app-nav" aria-label="Views">
      <NavLink to="/reactive-node">Reactive Node</NavLink>
      <NavLink to="/digital-key">Digital Key</NavLink>
      <NavLink to="/te-dmx">TE-DMX Controller</NavLink>
    </nav>
  )
}

function App() {
  return (
    <BrowserRouter>
      <TopNav />
      <Routes>
        <Route path="/" element={<Navigate to="/reactive-node" replace />} />
        <Route path="/reactive-node" element={<ReactiveNodePage />} />
        <Route path="/digital-key" element={<DigitalKeyPage />} />
        <Route path="/te-dmx" element={<TEDMXFieldControllerPage />} />
      </Routes>
      {import.meta.env.DEV && <Agentation />}
    </BrowserRouter>
  )
}

export default App

import { BrowserRouter, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { Agentation } from 'agentation'
import DigitalKeyPage from './components/DigitalKeyPage'
import TEDMXFieldControllerPage from './components/TEDMXFieldControllerPage'

function TopNav() {
  return (
    <nav className="app-nav" aria-label="Views">
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
        <Route path="/" element={<Navigate to="/te-dmx" replace />} />
        <Route path="/digital-key" element={<DigitalKeyPage />} />
        <Route path="/te-dmx" element={<TEDMXFieldControllerPage />} />
      </Routes>
      {import.meta.env.DEV && <Agentation />}
    </BrowserRouter>
  )
}

export default App

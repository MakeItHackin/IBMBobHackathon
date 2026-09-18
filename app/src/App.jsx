import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import EventsPage from './pages/EventsPage'
import MapPage from './pages/MapPage'

export default function App() {
  return (
    <BrowserRouter basename="/IBMBobHackathon/">
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <header className="bg-indigo-700 text-white shadow" style={{ flexShrink: 0 }}>
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <span className="text-xl font-bold tracking-tight">🚀 Rocket City Events</span>
            <nav className="flex gap-6 text-sm font-medium">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  isActive ? 'underline underline-offset-4' : 'hover:underline'
                }
              >
                Events
              </NavLink>
              <NavLink
                to="/map"
                className={({ isActive }) =>
                  isActive ? 'underline underline-offset-4' : 'hover:underline'
                }
              >
                Map
              </NavLink>
            </nav>
          </div>
        </header>

        <main style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Routes>
            <Route path="/" element={<EventsPage />} />
            <Route path="/map" element={<MapPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

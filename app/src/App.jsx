import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import EventsPage from './pages/EventsPage'
import MapPage from './pages/MapPage'

export default function App() {
  return (
    <BrowserRouter basename="/IBMBobHackathon/">
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-indigo-700 text-white shadow">
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

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<EventsPage />} />
            <Route path="/map" element={<MapPage />} />
          </Routes>
        </main>

        <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-200">
          Rocket City Events — Huntsville, AL
        </footer>
      </div>
    </BrowserRouter>
  )
}

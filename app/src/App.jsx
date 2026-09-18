import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import EventsPage from './pages/EventsPage'
import MapPage from './pages/MapPage'
import ProfilePage from './pages/ProfilePage'
import FindFriendsPage from './pages/FindFriendsPage'
import { currentUser } from './data/mockUser'

function Avatar({ initials }) {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%',
      background: '#a78bfa', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: 12, flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/IBMBobHackathon/">
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>

        {/* ── Header ── */}
        <header className="bg-indigo-700 text-white shadow" style={{ flexShrink: 0 }}>
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <span className="text-xl font-bold tracking-tight">🚀 Rocket City Events</span>

            <nav className="flex gap-5 text-sm font-medium items-center">
              <NavLink to="/" end className={({ isActive }) => isActive ? 'underline underline-offset-4' : 'hover:underline'}>
                Events
              </NavLink>
              <NavLink to="/map" className={({ isActive }) => isActive ? 'underline underline-offset-4' : 'hover:underline'}>
                Map
              </NavLink>
              <NavLink to="/friends" className={({ isActive }) => isActive ? 'underline underline-offset-4' : 'hover:underline'}>
                Find Friends
              </NavLink>

              {/* Logged-in user pill */}
              <NavLink to="/profile" className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-colors ${
                  isActive
                    ? 'bg-white text-indigo-700 font-semibold'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`
              }>
                <Avatar initials={currentUser.avatar} />
                <span>{currentUser.firstName}</span>
              </NavLink>
            </nav>
          </div>
        </header>

        {/* ── Main content ── */}
        <main style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Routes>
            <Route path="/" element={<EventsPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/friends" element={<FindFriendsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </main>

      </div>
    </BrowserRouter>
  )
}

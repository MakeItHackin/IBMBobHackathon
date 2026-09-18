import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEvents } from '../hooks/useEvents'

// Fix default marker icons broken by Vite bundling
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Heatmap layer using leaflet.heat loaded as a side-effect
function HeatmapLayer({ points }) {
  const map = useMap()
  const heatRef = useRef(null)

  useEffect(() => {
    if (!map) return
    import('leaflet.heat').then(() => {
      if (heatRef.current) {
        map.removeLayer(heatRef.current)
      }
      heatRef.current = L.heatLayer(points, {
        radius: 35,
        blur: 25,
        maxZoom: 14,
        gradient: { 0.3: '#4f46e5', 0.6: '#7c3aed', 1.0: '#dc2626' },
      }).addTo(map)
    })
    return () => {
      if (heatRef.current) map.removeLayer(heatRef.current)
    }
  }, [map, points])

  return null
}

export default function MapPage() {
  const { events, loading } = useEvents()
  const [showHeat, setShowHeat] = useState(true)
  const [showMarkers, setShowMarkers] = useState(true)

  const maxAttendance = Math.max(...events.map(e => e.attendance?.expected_attendance || 1))
  const heatPoints = events
    .filter(e => e.where?.geo?.lat && e.where?.geo?.lng)
    .map(e => [
      e.where.geo.lat,
      e.where.geo.lng,
      (e.attendance?.expected_attendance || 1) / maxAttendance
    ])

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Controls bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex gap-6 items-center text-sm">
        <span className="font-medium text-gray-700">Map View</span>
        <label className="flex items-center gap-2 cursor-pointer text-gray-600">
          <input
            type="checkbox"
            checked={showHeat}
            onChange={e => setShowHeat(e.target.checked)}
            className="accent-indigo-600"
          />
          Heatmap
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-gray-600">
          <input
            type="checkbox"
            checked={showMarkers}
            onChange={e => setShowMarkers(e.target.checked)}
            className="accent-indigo-600"
          />
          Markers
        </label>
        {loading && <span className="text-gray-400 ml-auto">Loading…</span>}
        {!loading && <span className="text-gray-400 ml-auto">{events.length} events plotted</span>}
      </div>

      {/* Map */}
      <div className="flex-1">
        <MapContainer
          center={[34.7304, -86.5861]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {showHeat && heatPoints.length > 0 && (
            <HeatmapLayer points={heatPoints} />
          )}

          {showMarkers && events
            .filter(e => e.where?.geo?.lat && e.where?.geo?.lng)
            .map(event => (
              <Marker
                key={event.id}
                position={[event.where.geo.lat, event.where.geo.lng]}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold mb-1">{event.title}</div>
                    <div className="text-gray-500 mb-1">{event.where.venue_name}</div>
                    <div className="text-gray-500">{event.when.date_start} · {event.when.time_start}</div>
                    <div className={`mt-1 font-medium ${event.attendance.is_free ? 'text-green-600' : 'text-gray-700'}`}>
                      {event.attendance.is_free ? 'Free' : event.attendance.cost}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>
    </div>
  )
}

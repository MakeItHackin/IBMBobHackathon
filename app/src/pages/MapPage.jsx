import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
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
    if (!map || !points.length) return
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
      if (heatRef.current) {
        map.removeLayer(heatRef.current)
        heatRef.current = null
      }
    }
  }, [map, points])

  return null
}

export default function MapPage() {
  const { events, loading } = useEvents()
  const [showHeat, setShowHeat] = useState(true)
  const [showMarkers, setShowMarkers] = useState(true)

  // Only events that have real geo coordinates
  const geoEvents = events.filter(e => e.where?.geo?.lat && e.where?.geo?.lng)

  // Safe max — guard against empty array
  const attendanceValues = geoEvents.map(e => e.attendance?.expected_attendance || 0).filter(v => v > 0)
  const maxAttendance = attendanceValues.length > 0 ? Math.max(...attendanceValues) : 1

  const heatPoints = geoEvents.map(e => [
    e.where.geo.lat,
    e.where.geo.lng,
    Math.max((e.attendance?.expected_attendance || 1) / maxAttendance, 0.05),
  ])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Controls bar */}
      <div
        className="bg-white border-b border-gray-200 px-4 py-2 flex gap-6 items-center text-sm"
        style={{ flexShrink: 0 }}
      >
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
        {!loading && (
          <span className="text-gray-400 ml-auto">
            {geoEvents.length} of {events.length} events plotted
          </span>
        )}
      </div>

      {/* Map — takes all remaining height */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <MapContainer
          center={[34.7304, -86.5861]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {showHeat && heatPoints.length > 0 && (
            <HeatmapLayer points={heatPoints} />
          )}

          {showMarkers && geoEvents.map(event => (
            <Marker
              key={event.id}
              position={[event.where.geo.lat, event.where.geo.lng]}
            >
              <Popup>
                <div style={{ fontSize: 13, minWidth: 180 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{event.title}</div>
                  <div style={{ color: '#666', marginBottom: 2 }}>{event.where.venue_name}</div>
                  <div style={{ color: '#666', marginBottom: 4 }}>
                    {event.when.date_start}{event.when.time_start ? ' · ' + event.when.time_start : ''}
                  </div>
                  <div style={{ fontWeight: 500, color: event.attendance.is_free ? '#16a34a' : '#374151' }}>
                    {event.attendance.is_free ? 'Free' : event.attendance.cost}
                  </div>
                  {event.attendance.expected_attendance && (
                    <div style={{ color: '#888', marginTop: 2 }}>
                      ~{event.attendance.expected_attendance.toLocaleString()} expected
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'
import { friends, friendHistory, getFriend, getActiveFriends } from '../data/mockUser'
import { useEvents } from '../hooks/useEvents'

// Custom colored marker for each friend
function friendIcon(initials, active) {
  const bg = active ? '#7c3aed' : '#9ca3af'
  return L.divIcon({
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -38],
    html: `<div style="
      width:36px;height:36px;border-radius:50%;
      background:${bg};color:#fff;
      display:flex;align-items:center;justify-content:center;
      font-weight:700;font-size:13px;
      border:3px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
    ">${initials}</div>`,
  })
}

function Avatar({ initials, size = 36, bg = '#7c3aed' }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.35, flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

// Slightly jitter coords so overlapping friends don't stack exactly
function jitter(lat, lng, index) {
  const offsets = [
    [0, 0], [0.002, 0.003], [-0.002, 0.002],
    [0.001, -0.003], [-0.001, -0.002],
  ]
  const [dlat, dlng] = offsets[index % offsets.length]
  return [lat + dlat, lng + dlng]
}

export default function FindFriendsPage() {
  const { events } = useEvents()
  const [selectedFriend, setSelectedFriend] = useState(null)

  function getEvent(id) {
    return events.find(e => e.id === id)
  }

  const activeFriends = getActiveFriends()
  const allFriendsWithCoords = friends
    .map((f, i) => {
      if (f.privacy.showLocation === 'private') return null
      const ev = f.currentEventId ? getEvent(f.currentEventId) : null
      if (!ev?.where?.geo?.lat) return null
      const [lat, lng] = jitter(ev.where.geo.lat, ev.where.geo.lng, i)
      return { ...f, event: ev, lat, lng }
    })
    .filter(Boolean)

  // Activity feed: all friends' history sorted by date desc
  const activityFeed = [...friendHistory]
    .sort((a, b) => b.attendedDate.localeCompare(a.attendedDate))
    .map(h => ({ ...h, friend: getFriend(h.uid), event: getEvent(h.eventId) }))
    .filter(h => h.friend && h.event)

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>

      {/* ── Left sidebar ── */}
      <div style={{
        width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column',
        borderRight: '1px solid #e5e7eb', background: '#fff', overflowY: 'auto',
      }}>

        {/* Header */}
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #f3f4f6' }}>
          <h1 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700, color: '#111827' }}>🔍 Find My Friends</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
            {activeFriends.length} friend{activeFriends.length !== 1 ? 's' : ''} currently at an event
          </p>
        </div>

        {/* Active right now */}
        <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Active Right Now
          </div>
          {activeFriends.length === 0 ? (
            <div style={{ fontSize: 13, color: '#9ca3af', paddingBottom: 8 }}>No friends are at an event right now.</div>
          ) : (
            activeFriends.map(f => {
              const ev = getEvent(f.currentEventId)
              return (
                <div
                  key={f.uid}
                  onClick={() => setSelectedFriend(selectedFriend?.uid === f.uid ? null : f)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 8, marginBottom: 6,
                    cursor: 'pointer',
                    background: selectedFriend?.uid === f.uid ? '#ede9fe' : '#f9fafb',
                    border: `1px solid ${selectedFriend?.uid === f.uid ? '#c4b5fd' : '#f3f4f6'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <Avatar initials={f.avatar} size={38} bg='#7c3aed' />
                    <span style={{
                      position: 'absolute', bottom: 0, right: 0,
                      width: 11, height: 11, background: '#22c55e',
                      borderRadius: '50%', border: '2px solid #f9fafb',
                    }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                      {f.firstName} {f.lastName}
                    </div>
                    <div style={{ fontSize: 12, color: '#7c3aed', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      📍 {ev ? ev.title : 'Unknown event'}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Activity feed */}
        <div style={{ padding: '12px 16px', flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Recent Activity
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activityFeed.map((item, i) => (
              <div key={i} style={{
                padding: '10px 12px', borderRadius: 8,
                background: '#f9fafb', border: '1px solid #f3f4f6',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Avatar initials={item.friend.avatar} size={28} bg='#6366f1' />
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                      {item.friend.firstName}
                    </span>
                    <span style={{ fontSize: 12, color: '#6b7280' }}> attended</span>
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: '#d1d5db' }}>{item.attendedDate}</span>
                </div>
                <div style={{ fontSize: 13, color: '#374151', fontWeight: 500, paddingLeft: 36 }}>
                  {item.event.title}
                </div>
                {item.note && (
                  <div style={{ fontSize: 12, color: '#6b7280', paddingLeft: 36, marginTop: 3, fontStyle: 'italic' }}>
                    "{item.note}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Map ── */}
      <div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
        <MapContainer
          center={[34.7250, -86.6000]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {allFriendsWithCoords.map(f => (
            <Marker
              key={f.uid}
              position={[f.lat, f.lng]}
              icon={friendIcon(f.avatar, true)}
            >
              <Popup>
                <div style={{ fontSize: 13, minWidth: 180 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: '#7c3aed', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 12,
                    }}>{f.avatar}</div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#111827' }}>{f.firstName} {f.lastName}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>@{f.username}</div>
                    </div>
                  </div>
                  <div style={{ color: '#7c3aed', fontWeight: 500, marginBottom: 4 }}>
                    📍 Currently here
                  </div>
                  <div style={{ fontWeight: 600, color: '#111827', marginBottom: 2 }}>{f.event.title}</div>
                  <div style={{ color: '#6b7280', fontSize: 12 }}>{f.event.where.venue_name}</div>
                  <div style={{ color: '#6b7280', fontSize: 12 }}>
                    {f.event.when.time_start} – {f.event.when.time_end}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Highlight ring around selected friend's venue */}
          {selectedFriend && (() => {
            const ev = events.find(e => e.id === selectedFriend.currentEventId)
            if (!ev?.where?.geo?.lat) return null
            return (
              <Circle
                center={[ev.where.geo.lat, ev.where.geo.lng]}
                radius={120}
                pathOptions={{ color: '#7c3aed', fillColor: '#7c3aed', fillOpacity: 0.1, weight: 2 }}
              />
            )
          })()}
        </MapContainer>
      </div>
    </div>
  )
}

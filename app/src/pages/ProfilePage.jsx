import { currentUser, myRSVPs, myHistory, friends } from '../data/mockUser'
import { useEvents } from '../hooks/useEvents'

const CATEGORY_STYLES = {
  'Technology':          { background: '#f3e8ff', color: '#6b21a8' },
  'Technology & DIY':    { background: '#ede9fe', color: '#5b21b6' },
  'Music & Nightlife':   { background: '#ffe4e6', color: '#9f1239' },
  'Sports & Fitness':    { background: '#fee2e2', color: '#991b1b' },
  'Science & Education': { background: '#dbeafe', color: '#1e40af' },
  'Arts & Culture':      { background: '#fce7f3', color: '#9d174d' },
  'Food & Drink':        { background: '#ffedd5', color: '#9a3412' },
  'Social & Games':      { background: '#fef9c3', color: '#713f12' },
  'Nature & Outdoors':   { background: '#ccfbf1', color: '#134e4a' },
  'Community & Volunteer': { background: '#ecfccb', color: '#3f6212' },
  'Health & Wellness':   { background: '#d1fae5', color: '#065f46' },
}

function Avatar({ initials, size = 48, bg = '#4338ca' }) {
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

function StatusBadge({ status }) {
  const styles = {
    going:      { background: '#dcfce7', color: '#166534' },
    interested: { background: '#fef9c3', color: '#713f12' },
  }
  return (
    <span style={{
      ...styles[status],
      fontSize: 11, fontWeight: 600, padding: '2px 8px',
      borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.05em',
    }}>
      {status}
    </span>
  )
}

function PrivacyBadge({ value }) {
  const map = { public: '🌐 Public', friends: '👥 Friends', private: '🔒 Private' }
  return <span style={{ fontSize: 12, color: '#6b7280' }}>{map[value] || value}</span>
}

export default function ProfilePage() {
  const { events } = useEvents()

  function getEvent(id) {
    return events.find(e => e.id === id)
  }

  const goingEvents = myRSVPs.filter(r => r.status === 'going').map(r => getEvent(r.eventId)).filter(Boolean)
  const interestedEvents = myRSVPs.filter(r => r.status === 'interested').map(r => getEvent(r.eventId)).filter(Boolean)
  const historyEvents = myHistory.map(h => ({ ...h, event: getEvent(h.eventId) })).filter(h => h.event)

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px', overflowY: 'auto', height: '100%' }}>

      {/* ── Profile header ── */}
      <div style={{
        background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
        padding: 24, display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 20,
      }}>
        <Avatar initials={currentUser.avatar} size={72} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>
              {currentUser.firstName} {currentUser.lastName}
            </h1>
            <span style={{ fontSize: 13, color: '#6366f1', fontWeight: 500 }}>@{currentUser.username}</span>
            <span style={{
              background: '#ecfdf5', color: '#065f46', fontSize: 11, fontWeight: 600,
              padding: '2px 10px', borderRadius: 999,
            }}>● Online</span>
          </div>
          <p style={{ margin: '6px 0 8px', fontSize: 14, color: '#4b5563', lineHeight: 1.5 }}>{currentUser.bio}</p>
          <div style={{ fontSize: 12, color: '#9ca3af', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span>📍 {currentUser.location}</span>
            <span>📅 Joined {currentUser.joined}</span>
            <span>👥 {friends.length} friends</span>
            <span>🎟️ {myRSVPs.length} upcoming</span>
            <span>✅ {myHistory.length} attended</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* ── Event preferences ── */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
          <h2 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: '#111827' }}>🎯 Event Preferences</h2>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Interested Categories</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {currentUser.preferences.categories.map(cat => (
                <span key={cat} style={{
                  ...(CATEGORY_STYLES[cat] || { background: '#f3f4f6', color: '#374151' }),
                  fontSize: 12, fontWeight: 500, padding: '3px 10px', borderRadius: 999,
                }}>{cat}</span>
              ))}
            </div>
          </div>
          <div style={{ fontSize: 13, color: '#4b5563', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div>📏 Max distance: <strong>{currentUser.preferences.maxDistance} miles</strong></div>
            <div>👤 Age group: <strong>{currentUser.preferences.ageGroup}</strong></div>
            <div>🔔 Notifications: <strong>{currentUser.preferences.notifications ? 'On' : 'Off'}</strong></div>
          </div>
        </div>

        {/* ── Privacy settings ── */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
          <h2 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: '#111827' }}>🔒 Privacy Settings</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
            {[
              { label: 'Who can see events I\'m attending', key: 'showAttending' },
              { label: 'Who can see my event history', key: 'showHistory' },
              { label: 'Who can see my location', key: 'showLocation' },
            ].map(({ label, key }) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#4b5563' }}>{label}</span>
                <PrivacyBadge value={currentUser.privacy[key]} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Friends list ── */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: '#111827' }}>
          👥 Friends <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: 13 }}>({friends.length})</span>
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {friends.map(f => {
            const currentEvent = events.find(e => e.id === f.currentEventId)
            return (
              <div key={f.uid} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 8, background: '#f9fafb',
                border: '1px solid #f3f4f6',
              }}>
                <div style={{ position: 'relative' }}>
                  <Avatar initials={f.avatar} size={40} bg={f.currentEventId ? '#7c3aed' : '#9ca3af'} />
                  {f.currentEventId && (
                    <span style={{
                      position: 'absolute', bottom: 0, right: 0,
                      width: 12, height: 12, background: '#22c55e',
                      borderRadius: '50%', border: '2px solid #f9fafb',
                    }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                    {f.firstName} {f.lastName}
                    <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: 12, marginLeft: 6 }}>@{f.username}</span>
                  </div>
                  {currentEvent ? (
                    <div style={{ fontSize: 12, color: '#7c3aed', marginTop: 2 }}>
                      📍 Currently at <strong>{currentEvent.title}</strong>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Not at an event right now</div>
                  )}
                </div>
                <div style={{ fontSize: 11, color: '#d1d5db' }}>{f.location}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Upcoming RSVPs ── */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: '#111827' }}>🎟️ My Upcoming Events</h2>
        {myRSVPs.length === 0 ? (
          <div style={{ color: '#9ca3af', fontSize: 13 }}>No upcoming RSVPs yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...goingEvents.map(e => ({ e, status: 'going' })), ...interestedEvents.map(e => ({ e, status: 'interested' }))].map(({ e, status }) => (
              <div key={e.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 8, background: '#f9fafb',
                border: '1px solid #f3f4f6',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{e.title}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                    {e.when.date_start} · {e.where.venue_name}
                  </div>
                </div>
                <StatusBadge status={status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Event history ── */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
        <h2 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: '#111827' }}>✅ Event History</h2>
        {historyEvents.length === 0 ? (
          <div style={{ color: '#9ca3af', fontSize: 13 }}>No events attended yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {historyEvents.map(({ eventId, attendedDate, rating, note, event }) => (
              <div key={eventId} style={{
                padding: '10px 12px', borderRadius: 8, background: '#f9fafb',
                border: '1px solid #f3f4f6',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{event.title}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{attendedDate}</div>
                  </div>
                  <div style={{ fontSize: 14 }}>{'⭐'.repeat(rating)}</div>
                </div>
                {note && <div style={{ fontSize: 12, color: '#4b5563', marginTop: 6, fontStyle: 'italic' }}>"{note}"</div>}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

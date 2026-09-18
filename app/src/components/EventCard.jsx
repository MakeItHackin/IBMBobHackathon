const CATEGORY_STYLES = {
  'Market':                      { background: '#dcfce7', color: '#166534' },
  'Food & Drink':                { background: '#ffedd5', color: '#9a3412' },
  'Science & Education':         { background: '#dbeafe', color: '#1e40af' },
  'Sports & Fitness':            { background: '#fee2e2', color: '#991b1b' },
  'Technology':                  { background: '#f3e8ff', color: '#6b21a8' },
  'Arts & Culture':              { background: '#fce7f3', color: '#9d174d' },
  'Technology & DIY':            { background: '#ede9fe', color: '#5b21b6' },
  'Social & Games':              { background: '#fef9c3', color: '#713f12' },
  'Nature & Outdoors':           { background: '#ccfbf1', color: '#134e4a' },
  'Music & Nightlife':           { background: '#ffe4e6', color: '#9f1239' },
  'Pop Culture & Entertainment': { background: '#fae8ff', color: '#86198f' },
  'Business & Entrepreneurship': { background: '#f1f5f9', color: '#1e293b' },
  'Community & Volunteer':       { background: '#ecfccb', color: '#3f6212' },
  'Health & Wellness':           { background: '#d1fae5', color: '#065f46' },
}

function categoryStyle(cat) {
  return CATEGORY_STYLES[cat] || { background: '#f3f4f6', color: '#374151' }
}

export default function EventCard({ event }) {
  const { title, description, category, when, where, attendance } = event

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-base font-semibold text-gray-900 leading-snug">{title}</h2>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
          style={categoryStyle(category)}
        >
          {category}
        </span>
      </div>

      <p className="text-sm text-gray-500 leading-relaxed">{description.short}</p>

      <div className="text-xs text-gray-500 space-y-1">
        <div className="flex items-center gap-1">
          <span>📅</span>
          <span>{when.date_start}{when.date_end !== when.date_start ? ` – ${when.date_end}` : ''}</span>
          <span className="ml-2">🕐 {when.time_start} – {when.time_end}</span>
        </div>
        <div className="flex items-center gap-1">
          <span>📍</span>
          <span>{where.venue_name}, {where.address.city}, {where.address.state}</span>
        </div>
        <div className="flex items-center gap-1">
          <span>🎟️</span>
          <span className={attendance.is_free ? 'text-green-600 font-medium' : 'text-gray-600'}>
            {attendance.is_free ? 'Free' : attendance.cost}
          </span>
        </div>
        {attendance.expected_attendance && (
          <div className="flex items-center gap-1">
            <span>👥</span>
            <span>~{attendance.expected_attendance.toLocaleString()} expected</span>
          </div>
        )}
      </div>

      {event.meta?.source && (
        <div className="text-xs text-indigo-400 font-medium uppercase tracking-wide">
          via {event.meta.source}
        </div>
      )}
    </div>
  )
}

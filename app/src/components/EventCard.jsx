const CATEGORY_COLORS = {
  'Market': 'bg-green-100 text-green-800',
  'Food & Drink': 'bg-orange-100 text-orange-800',
  'Science & Education': 'bg-blue-100 text-blue-800',
  'Sports & Fitness': 'bg-red-100 text-red-800',
  'Technology': 'bg-purple-100 text-purple-800',
  'Arts & Culture': 'bg-pink-100 text-pink-800',
  'Technology & DIY': 'bg-violet-100 text-violet-800',
  'Social & Games': 'bg-yellow-100 text-yellow-800',
  'Nature & Outdoors': 'bg-teal-100 text-teal-800',
  'Music & Nightlife': 'bg-rose-100 text-rose-800',
  'Pop Culture & Entertainment': 'bg-fuchsia-100 text-fuchsia-800',
  'Business & Entrepreneurship': 'bg-slate-100 text-slate-800',
  'Community & Volunteer': 'bg-lime-100 text-lime-800',
}

function categoryColor(cat) {
  return CATEGORY_COLORS[cat] || 'bg-gray-100 text-gray-700'
}

export default function EventCard({ event }) {
  const { title, description, category, when, where, attendance } = event

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-base font-semibold text-gray-900 leading-snug">{title}</h2>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${categoryColor(category)}`}>
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
      </div>

      {event.meta?.source && (
        <div className="text-xs text-indigo-400 font-medium uppercase tracking-wide">
          via {event.meta.source}
        </div>
      )}
    </div>
  )
}

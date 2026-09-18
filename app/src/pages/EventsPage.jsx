import { useState } from 'react'
import { useEvents } from '../hooks/useEvents'
import EventCard from '../components/EventCard'

const SOURCES = ['All', 'facebook', 'reddit', 'eventbrite', 'meetup']

export default function EventsPage() {
  const { events, loading } = useEvents()
  const [search, setSearch] = useState('')
  const [source, setSource] = useState('All')
  const [onlyFree, setOnlyFree] = useState(false)

  const filtered = events.filter(e => {
    const matchSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.description.short.toLowerCase().includes(search.toLowerCase()) ||
      e.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    const matchSource = source === 'All' || e.meta?.source === source
    const matchFree = !onlyFree || e.attendance.is_free
    return matchSearch && matchSource && matchFree
  })

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">What's happening in Huntsville</h1>
      <p className="text-sm text-gray-500 mb-6">Browse local events aggregated from across the web</p>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <input
          type="text"
          placeholder="Search events, tags..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />

        <select
          value={source}
          onChange={e => setSource(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          {SOURCES.map(s => (
            <option key={s} value={s}>{s === 'All' ? 'All sources' : s}</option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={onlyFree}
            onChange={e => setOnlyFree(e.target.checked)}
            className="accent-indigo-600"
          />
          Free only
        </label>

        <span className="ml-auto text-sm text-gray-400">{filtered.length} event{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-20">Loading events…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-400 py-20">No events match your filters.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  )
}

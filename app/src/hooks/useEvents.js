import { useEffect, useState } from 'react'

export function useEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}events.json`)
      .then(r => r.json())
      .then(data => {
        setEvents(data.events)
        setLoading(false)
      })
  }, [])

  return { events, loading }
}

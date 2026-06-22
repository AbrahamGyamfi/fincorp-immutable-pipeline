import { useState, useEffect, useCallback } from 'react'

export function usePolling(url, intervalMs = 30_000) {
  const [data,    setData]    = useState(null)
  const [error,   setError]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastFetched, setLastFetched] = useState(null)

  const fetchNow = useCallback(async () => {
    try {
      const res  = await fetch(url)
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
      const json = await res.json()
      setData(json)
      setError(null)
      setLastFetched(new Date())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [url])

  useEffect(() => {
    fetchNow()
    const timer = setInterval(fetchNow, intervalMs)
    return () => clearInterval(timer)
  }, [fetchNow, intervalMs])

  return { data, error, loading, lastFetched, refetch: fetchNow }
}

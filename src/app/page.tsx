'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { VideoRow } from '@/lib/types'
import VideoCard from '@/components/VideoCard'

export default function HomePage() {
  const [videos, setVideos] = useState<VideoRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('videos')
        .select('id, user_id, title, description, storage_path, created_at')
        .order('created_at', { ascending: false })
        .limit(60)

      if (!mounted) return
      if (error) setError(error.message)
      setVideos((data as VideoRow[]) ?? [])
      setLoading(false)
    }

    load()
    return () => { mounted = false }
  }, [])

  return (
    <div className="card">
      <div className="row">
        <h1 className="h1" style={{ fontWeight: 900 }}>Explore</h1>
        <div className="spacer" />
        <span className="muted small">{loading ? 'Loading…' : `${videos.length} videos`}</span>
      </div>

      {error && <div style={{ marginTop: 10, color: 'var(--danger)' }}>{error}</div>}

      <div className="hr" />

      <div className="grid">
        {videos.map(v => <VideoCard key={v.id} v={v} />)}
      </div>

      {!loading && videos.length === 0 && (
        <div className="muted" style={{ marginTop: 10 }}>
          No videos yet.
        </div>
      )}
    </div>
  )
}

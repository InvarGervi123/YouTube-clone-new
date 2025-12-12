'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import type { VideoRow } from '@/lib/types'
import { publicVideoUrl } from '@/lib/storage'
import Link from 'next/link'

export default function WatchPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const [video, setVideo] = useState<VideoRow | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setError(null)
      const { data, error } = await supabase
        .from('videos')
        .select('id, user_id, title, description, storage_path, created_at')
        .eq('id', id)
        .maybeSingle()

      if (!mounted) return
      if (error) setError(error.message)
      setVideo((data as VideoRow) ?? null)
    }
    if (id) load()
    return () => { mounted = false }
  }, [id])

  if (!id) return null

  return (
    <div className="card">
      <div className="row">
        <Link className="btn" href="/">← Back</Link>
        <div className="spacer" />
      </div>

      {error && <div style={{ marginTop: 10, color: 'var(--danger)' }}>{error}</div>}
      {!error && !video && <div className="muted" style={{ marginTop: 10 }}>Loading…</div>}

      {video && (
        <>
          <div style={{ marginTop: 12 }}>
            <div className="videoThumb">
              <video
                src={publicVideoUrl(video.storage_path)}
                controls
                playsInline
                preload="metadata"
                style={{ width: '100%', height: '100%', objectFit: 'contain', background: 'black' }}
              />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div className="h1" style={{ fontWeight: 900 }}>{video.title}</div>
            <div className="muted small" style={{ marginTop: 6 }}>
              {new Date(video.created_at).toLocaleString()}
            </div>
            {video.description && (
              <div className="card" style={{ marginTop: 12 }}>
                <div className="muted" style={{ whiteSpace: 'pre-wrap' }}>
                  {video.description}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

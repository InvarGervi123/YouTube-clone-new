'use client'

import Link from 'next/link'
import type { VideoRow } from '@/lib/types'
import { publicVideoUrl } from '@/lib/storage'

export default function VideoCard({ v }: { v: VideoRow }) {
  const url = publicVideoUrl(v.storage_path)

  return (
    <Link href={`/watch/${v.id}`} className="card" style={{ display: 'block' }}>
      <div className="videoThumb">
        <video src={url} muted playsInline preload="metadata" />
      </div>
      <div style={{ marginTop: 10 }}>
        <div className="h2" style={{ fontWeight: 800, lineHeight: 1.2 }}>
          {v.title}
        </div>
        <div className="muted small" style={{ marginTop: 6 }}>
          {new Date(v.created_at).toLocaleString()}
        </div>
      </div>
    </Link>
  )
}

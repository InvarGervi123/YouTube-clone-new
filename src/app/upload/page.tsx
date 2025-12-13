'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as tus from 'tus-js-client'
import { supabase, getProjectIdFromUrl } from '@/lib/supabaseClient'
import { sanitizeFilename } from '@/lib/storage'
import { useUser } from '@/lib/useUser'

const BUCKET = 'videos'

export default function UploadPage() {
  const router = useRouter()
  const { user, profile, loading } = useUser()

  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [progress, setProgress] = useState<number>(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
    if (!loading && profile?.banned) router.replace('/')
  }, [loading, user, profile, router])

  const objectPath = useMemo(() => {
    if (!user || !file) return null
    const safe = sanitizeFilename(file.name)
    const id = (crypto as any).randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`
    return `${user.id}/${id}-${safe}`
  }, [user, file])

  async function upload() {
    if (!user) return
    if (!file) { setError('Choose a video file.'); return }
    if (!title.trim()) { setError('Title is required.'); return }
    if (!objectPath) { setError('Upload path error.'); return }

    setError(null)
    setBusy(true)
    setProgress(0)

    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession()
    if (sessionErr || !sessionData.session) {
      setBusy(false)
      setError('Not logged in.')
      return
    }

    const projectId = getProjectIdFromUrl()

    await new Promise<void>((resolve, reject) => {
      const upload = new tus.Upload(file, {
        endpoint: `https://${projectId}.storage.supabase.co/storage/v1/upload/resumable`,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: {
          authorization: `Bearer ${sessionData.session!.access_token}`,
          'x-upsert': 'true'
        },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        metadata: {
          bucketName: BUCKET,
          objectName: objectPath,
          contentType: file.type || 'video/mp4',
          cacheControl: '3600'
        },
        // Supabase TUS currently requires 6MB chunks (do not change).
        chunkSize: 6 * 1024 * 1024,
        onError: (err) => reject(err),
        onProgress: (bytesUploaded, bytesTotal) => {
          const pct = (bytesUploaded / bytesTotal) * 100
          setProgress(Number(pct.toFixed(2)))
        },
        onSuccess: () => resolve()
      })

      upload.findPreviousUploads().then((prev) => {
        if (prev.length) upload.resumeFromPreviousUpload(prev[0])
        upload.start()
      })
    }).catch((e) => {
      setBusy(false)
      setError(String(e?.message ?? e))
      throw e
    })

    // Save metadata row
    const { error: dbErr } = await supabase.from('videos').insert({
      user_id: user.id,
      title: title.trim(),
      description: description.trim(),
      storage_path: objectPath
    })

    setBusy(false)
    if (dbErr) {
      setError(dbErr.message)
      return
    }

    router.push('/')
  }

  if (loading) return null

  return (
    <div className="card" style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="row">
        <h1 className="h1" style={{ fontWeight: 900 }}>Upload</h1>
        <div className="spacer" />
        <Link className="btn" href="/">← Back</Link>
      </div>

      <div className="hr" />

      <div className="muted small">Video file</div>
      <input
        className="input"
        type="file"
        accept="video/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />

      <div className="muted small" style={{ marginTop: 10 }}>Title</div>
      <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="My video title" />

      <div className="muted small" style={{ marginTop: 10 }}>Description</div>
      <textarea className="textarea" value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this video about?" />

      {busy && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="row">
            <div style={{ fontWeight: 800 }}>Uploading…</div>
            <div className="spacer" />
            <div className="muted small">{progress}%</div>
          </div>
          <div style={{ height: 10, borderRadius: 999, border: '1px solid var(--border)', marginTop: 10, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'rgba(122,162,255,0.55)' }} />
          </div>
        </div>
      )}

      {error && <div style={{ marginTop: 10, color: 'var(--danger)' }}>{error}</div>}

      <button className="btn primary" style={{ marginTop: 12, width: '100%' }} disabled={busy} onClick={upload}>
        {busy ? 'Uploading…' : 'Upload video'}
      </button>

      <div className="muted small" style={{ marginTop: 10 }}>
        This uploads directly from your browser to Supabase Storage (not through Vercel/Next.js).
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import type { Profile, VideoRow } from '@/lib/types'
import { useUser } from '@/lib/useUser'

export default function AdminPage() {
  const router = useRouter()
  const { user, isAdmin, loading } = useUser()

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [videos, setVideos] = useState<VideoRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [loading, user, router])

  useEffect(() => {
    if (!loading && user && !isAdmin) router.replace('/')
  }, [loading, user, isAdmin, router])

  async function refresh() {
    setError(null)
    const p = await supabase
      .from('profiles')
      .select('id, role, banned, created_at')
      .order('created_at', { ascending: false })
      .limit(200)

    const v = await supabase
      .from('videos')
      .select('id, user_id, title, description, storage_path, created_at')
      .order('created_at', { ascending: false })
      .limit(200)

    if (p.error) setError(p.error.message)
    if (v.error) setError(v.error.message)

    setProfiles((p.data as Profile[]) ?? [])
    setVideos((v.data as VideoRow[]) ?? [])
  }

  useEffect(() => {
    if (isAdmin) refresh()
  }, [isAdmin])

  async function setBan(profileId: string, banned: boolean) {
    setBusyId(profileId)
    setError(null)
    const { error } = await supabase.from('profiles').update({ banned }).eq('id', profileId)
    setBusyId(null)
    if (error) setError(error.message)
    else refresh()
  }

  async function setRole(profileId: string, role: 'user' | 'admin') {
    setBusyId(profileId)
    setError(null)
    const { error } = await supabase.from('profiles').update({ role }).eq('id', profileId)
    setBusyId(null)
    if (error) setError(error.message)
    else refresh()
  }

  async function deleteVideo(videoId: string, storagePath: string) {
    setBusyId(videoId)
    setError(null)

    const s = await supabase.storage.from('videos').remove([storagePath])
    if (s.error) {
      setBusyId(null)
      setError(s.error.message)
      return
    }

    const d = await supabase.from('videos').delete().eq('id', videoId)
    setBusyId(null)
    if (d.error) setError(d.error.message)
    else refresh()
  }

  if (loading) return null
  if (!isAdmin) return null

  return (
    <div className="card">
      <div className="row">
        <h1 className="h1" style={{ fontWeight: 900 }}>Admin</h1>
        <div className="spacer" />
        <Link className="btn" href="/">← Back</Link>
      </div>

      {error && <div style={{ marginTop: 10, color: 'var(--danger)' }}>{error}</div>}

      <div className="hr" />

      <div className="row" style={{ alignItems: 'baseline' }}>
        <h2 className="h2" style={{ fontWeight: 900 }}>Users</h2>
        <div className="spacer" />
        <span className="muted small">{profiles.length}</span>
      </div>

      <div style={{ overflowX: 'auto', marginTop: 10 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr className="muted small" style={{ textAlign: 'left' }}>
              <th style={{ padding: '8px 6px' }}>User ID</th>
              <th style={{ padding: '8px 6px' }}>Role</th>
              <th style={{ padding: '8px 6px' }}>Banned</th>
              <th style={{ padding: '8px 6px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map(p => (
              <tr key={p.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 6px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12 }}>
                  {p.id}
                </td>
                <td style={{ padding: '10px 6px' }}>
                  <span className="badge">{p.role}</span>
                </td>
                <td style={{ padding: '10px 6px' }}>
                  {p.banned ? <span className="badge" style={{ borderColor: 'rgba(255,107,107,0.35)' }}>banned</span> : <span className="badge">ok</span>}
                </td>
                <td style={{ padding: '10px 6px' }}>
                  <div className="row" style={{ flexWrap: 'wrap' }}>
                    <button className="btn" disabled={busyId === p.id} onClick={() => setRole(p.id, p.role === 'admin' ? 'user' : 'admin')}>
                      {p.role === 'admin' ? 'Make user' : 'Make admin'}
                    </button>
                    <button className="btn danger" disabled={busyId === p.id} onClick={() => setBan(p.id, !p.banned)}>
                      {p.banned ? 'Unban' : 'Ban'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="hr" />

      <div className="row" style={{ alignItems: 'baseline' }}>
        <h2 className="h2" style={{ fontWeight: 900 }}>Videos</h2>
        <div className="spacer" />
        <span className="muted small">{videos.length}</span>
      </div>

      <div style={{ overflowX: 'auto', marginTop: 10 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr className="muted small" style={{ textAlign: 'left' }}>
              <th style={{ padding: '8px 6px' }}>Title</th>
              <th style={{ padding: '8px 6px' }}>Owner</th>
              <th style={{ padding: '8px 6px' }}>Created</th>
              <th style={{ padding: '8px 6px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {videos.map(v => (
              <tr key={v.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 6px' }}>{v.title}</td>
                <td style={{ padding: '10px 6px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12 }}>
                  {v.user_id}
                </td>
                <td style={{ padding: '10px 6px' }} className="muted small">
                  {new Date(v.created_at).toLocaleString()}
                </td>
                <td style={{ padding: '10px 6px' }}>
                  <button className="btn danger" disabled={busyId === v.id} onClick={() => deleteVideo(v.id, v.storage_path)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="muted small" style={{ marginTop: 12 }}>
        All admin powers are enforced by Supabase RLS policies.
      </div>
    </div>
  )
}

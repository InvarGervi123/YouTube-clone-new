'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMsg(null)
    setLoading(true)

    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setMsg('Check your email for a confirmation link, then log in.')
  }

  return (
    <div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
      <h1 className="h1" style={{ fontWeight: 900 }}>Sign up</h1>
      <div className="muted small" style={{ marginTop: 6 }}>
        Already have an account? <Link href="/login">Log in</Link>
      </div>

      <form onSubmit={onSubmit} style={{ marginTop: 14 }}>
        <div className="muted small">Email</div>
        <input className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />

        <div className="muted small" style={{ marginTop: 10 }}>Password</div>
        <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Use a strong password" />

        {error && <div style={{ marginTop: 10, color: 'var(--danger)' }}>{error}</div>}
        {msg && <div style={{ marginTop: 10, color: 'var(--accent)' }}>{msg}</div>}

        <button className="btn primary" style={{ marginTop: 12, width: '100%' }} disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    router.push('/')
  }

  return (
    <div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
      <h1 className="h1" style={{ fontWeight: 900 }}>Log in</h1>
      <div className="muted small" style={{ marginTop: 6 }}>
        Don&apos;t have an account? <Link href="/signup">Sign up</Link>
      </div>

      <form onSubmit={onSubmit} style={{ marginTop: 14 }}>
        <div className="muted small">Email</div>
        <input className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />

        <div className="muted small" style={{ marginTop: 10 }}>Password</div>
        <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />

        {error && <div style={{ marginTop: 10, color: 'var(--danger)' }}>{error}</div>}

        <button className="btn primary" style={{ marginTop: 12, width: '100%' }} disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}

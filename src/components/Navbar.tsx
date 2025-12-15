'use client'

import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { useUser } from '@/lib/useUser'

export default function Navbar() {
  const { user, profile, isAdmin, loading } = useUser()

  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div className="row">
        <Link href="/" style={{ fontWeight: 900, letterSpacing: 0.2 }}>
          YamShamenTube
        </Link>
        <span className="badge">Next.js + Supabase</span>
        <div className="spacer" />
        {!loading && user && (
          <>
            <Link className="btn" href="/upload">Upload</Link>
            {isAdmin && <Link className="btn" href="/admin">Admin</Link>}
            <span className="muted small">{user.email}</span>
            {profile?.role === 'admin' && <span className="badge">admin</span>}
            <button
              className="btn"
              onClick={() => supabase.auth.signOut()}
            >
              Sign out
            </button>
          </>
        )}

        {!loading && !user && (
          <>
            <Link className="btn" href="/login">Log in</Link>
            <Link className="btn primary" href="/signup">Sign up</Link>
          </>
        )}
      </div>
    </div>
  )
}

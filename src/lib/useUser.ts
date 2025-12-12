'use client'

import { useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'
import type { Profile } from './types'

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function load() {
      const { data } = await supabase.auth.getUser()
      const current = data.user ?? null
      if (!mounted) return
      setUser(current)

      if (current) {
        const { data: p } = await supabase
          .from('profiles')
          .select('id, role, banned, created_at')
          .eq('id', current.id)
          .maybeSingle()
        if (!mounted) return
        setProfile((p as Profile) ?? null)

        if (p?.banned) {
          await supabase.auth.signOut()
          setUser(null)
          setProfile(null)
        }
      } else {
        setProfile(null)
      }

      setLoading(false)
    }

    load()

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      load()
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const isAdmin = useMemo(() => profile?.role === 'admin' && !profile?.banned, [profile])
  return { user, profile, isAdmin, loading }
}

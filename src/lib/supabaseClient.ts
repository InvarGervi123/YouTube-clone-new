import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  // This error helps you immediately if env vars are missing.
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
}

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

export function getProjectIdFromUrl(u?: string) {
  const url = u ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  if (!url) return ''
  const host = new URL(url).hostname
  return host.split('.')[0]
}


import { supabase } from './supabaseClient'

export function publicVideoUrl(storagePath: string) {
  const { data } = supabase.storage.from('videos').getPublicUrl(storagePath)
  return data.publicUrl
}

export function sanitizeFilename(name: string) {
  return name
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .slice(0, 120)
}

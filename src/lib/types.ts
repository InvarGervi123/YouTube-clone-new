export type Profile = {
  id: string
  role: 'user' | 'admin'
  banned: boolean
  created_at: string
}

export type VideoRow = {
  id: string
  user_id: string
  title: string
  description: string
  storage_path: string
  created_at: string
}

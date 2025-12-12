# MiniTube (YouTube-style clone) — Frontend only

This is a **Next.js** frontend that works like a small YouTube clone:
- Anyone can **watch** videos (public feed + watch page)
- Users can **sign up / log in**
- Logged-in users can **upload videos**
- Admins can **ban users**, **promote users**, and **delete any video**

Uploads are **direct-from-browser to Supabase Storage** (resumable uploads via TUS), so you **do not** hit Vercel function body limits.

## 1) Create Supabase project
1. Create a new project.
2. Go to **Storage** → create a bucket named: `videos`
3. Set the bucket to **Public** (so anyone can watch)

## 2) Create DB tables + RLS policies
Open **SQL Editor** in Supabase and run the SQL in `supabase.sql`.

## 3) Add env vars
Create `.env.local` from `.env.example`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Get them from Supabase → Project Settings → API.

## 4) Run locally
```bash
npm install
npm run dev
```

## 5) Deploy to Vercel
- Import the repo into Vercel
- Add the same env vars in Vercel Project Settings

## Make someone an admin
After creating a user, run this in Supabase SQL Editor (replace `<USER_ID>`):
```sql
update public.profiles set role = 'admin' where id = '<USER_ID>';
```

## Notes about "free hosting" and large uploads
- Vercel Functions have a small request body limit (so you should not upload video files through Next.js API routes).
- Supabase Free tier has limited storage/bandwidth (good for a demo, not for unlimited heavy videos).

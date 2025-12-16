import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata = {
  title: 'miniTube',
  description: 'A small YouTube-style clone (Next.js + Supabase)'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <Navbar />
          {children}
        </div>
      </body>
    </html>
  )
}

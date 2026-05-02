'use client'

import { useState, useEffect } from 'react'
import Sidebar from './sidebar'
import TopBar from './top-bar'
import Footer from './footer'
import ScrollProgress from './scroll-progress'

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  // Close mobile sidebar on route change effect
  useEffect(() => {
    const close = () => setOpen(false)
    window.addEventListener('resize', close)
    return () => window.removeEventListener('resize', close)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ScrollProgress />
      <TopBar onMenuClick={() => setOpen(!open)} />
      <div className="flex flex-1 w-full">
        <Sidebar open={open} onClose={() => setOpen(false)} />
        <main className="flex-1 min-w-0 lg:pl-72">
          <div className="min-h-[calc(100vh-4rem)]">{children}</div>
          <Footer />
        </main>
      </div>
    </div>
  )
}

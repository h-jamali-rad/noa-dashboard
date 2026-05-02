'use client'

import Link from 'next/link'
import { Menu, FlaskConical, Github, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './theme-toggle'

export default function TopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
          aria-label="Toggle navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-lg gradient-brand flex items-center justify-center shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
            <FlaskConical className="h-5 w-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <div className="font-display font-bold leading-tight tracking-tight text-base">
              NOA microTESE Pipeline
            </div>
            <div className="text-[11px] text-muted-foreground leading-tight">
              6-Agent ML Research Dashboard
            </div>
          </div>
        </Link>

        <div className="ml-auto flex items-center gap-1">
          <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
            <Link href="/gallery">Gallery</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
            <Link href="/code">Code</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
            <Link href="/about">About</Link>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

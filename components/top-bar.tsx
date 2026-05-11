'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Menu, Github, ExternalLink } from 'lucide-react'
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
          <Image
            src="/logos/royan.png"
            alt="Royan Institute"
            width={36}
            height={36}
            className="rounded-lg shadow-md group-hover:scale-105 transition-transform"
          />
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

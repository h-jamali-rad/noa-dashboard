'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import {
  Home,
  Images,
  Code2,
  Info,
  X,
  ChevronRight,
  Database,
  Cpu,
  ShieldCheck,
  BrainCircuit,
  BookOpen,
  GraduationCap,
  Presentation,
  ClipboardList,
  Stethoscope,
  GitCompare,
  ScrollText,
  Server,
  Map,
  Newspaper,
  Network,
  Mic,
  ClipboardCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type NavItem = {
  href: string
  label: string
  icon: typeof Home
  badge?: string
  description?: string
}

const MAIN_NAV: NavItem[] = [
  { href: '/', label: 'Overview', icon: Home, description: 'Pipeline summary & key results' },
  { href: '/gallery', label: 'Image Gallery', icon: Images, description: 'All visualisations across phases' },
  { href: '/code', label: 'Code Library', icon: Code2, description: 'All Python scripts and reports' },
  { href: '/about', label: 'About', icon: Info, description: 'Project context & institutions' },
]

const PHASE_NAV: NavItem[] = [
  { href: '/phase/preprocessing', label: 'Agent 1 — Preprocessing', icon: Database, description: '2,413 patients • 73 features (55+18) • 22 histopathology' },
  { href: '/phase/training', label: 'Agent 2 — Training', icon: Cpu, description: '16 models tested → 5 finalized • best CatBoost AUC 0.8306' },
  { href: '/phase/validation', label: 'Agent 3 — Validation', icon: ShieldCheck, description: 'Calibration + DCA + corrected benchmark' },
  { href: '/phase/xai', label: 'Agent 4 — Explainable AI', icon: BrainCircuit, description: 'SHAP + feature-importance synthesis' },
  { href: '/phase/literature', label: 'Agent 5 — Literature', icon: BookOpen, description: 'Novelty and evidence synthesis' },
  { href: '/phase/integration', label: 'Agent 6 — Integration', icon: GraduationCap, description: 'Final dissertation assembly' },
]

const EXTRA_NAV: NavItem[] = [
  { href: '/architecture', label: 'AI Agent Architecture', icon: Network, description: 'Interactive multi-agent DAG system' },
  { href: '/virtual-defense', label: 'Virtual Defense', icon: Presentation, description: '4 expert panels with votes and critiques' },
  { href: '/post-defense-actions', label: 'Post-Defense Actions', icon: ClipboardList, description: 'Corrective actions log' },
  { href: '/cdss', label: 'CDSS', icon: Stethoscope, description: 'Video + client-side prediction form' },
  { href: '/usability-testing', label: 'Usability Testing', icon: ClipboardCheck, description: 'SUS expert evaluation & podcast' },
  { href: '/articles', label: 'Articles', icon: Newspaper, description: 'Published & in-preparation manuscripts' },
  { href: '/novelty-comparison', label: 'Novelty Comparison', icon: GitCompare, description: 'Hossein vs prior literature' },
  { href: '/references', label: 'References', icon: ScrollText, description: 'Static numbered bibliography' },
  { href: '/hardware-specs', label: 'Hardware Specs', icon: Server, description: 'GPU / CPU / RAM infrastructure' },
  { href: '/podcast', label: 'Research Podcast', icon: Mic, description: 'AI-generated expert dialogue transcripts' },
  { href: '/roadmap', label: 'Project Roadmap', icon: Map, description: '3D interactive project mind map' },
]

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname() || '/'

  // Close on route change
  useEffect(() => {
    onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          'fixed top-16 bottom-0 left-0 z-40 w-72 border-r border-border/60 bg-card/95 backdrop-blur-md transition-transform duration-300 ease-out',
          'lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 lg:hidden border-b border-border/60">
          <span className="text-sm font-semibold">Navigation</span>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close menu">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="h-full overflow-y-auto px-3 py-4 pb-24">
          <div className="px-2 mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Dashboard</p>
          </div>
          <ul className="space-y-0.5 mb-6">
            {MAIN_NAV.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    title={item.description ?? item.label}
                    className={cn(
                      'group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors duration-150',
                      active
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-foreground/80 hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {item.badge}
                      </span>
                    )}
                    {active && <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-60" />}
                  </Link>
                </li>
              )
            })}
          </ul>

          <div className="px-2 mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Research Pipeline</p>
          </div>
          <ul className="space-y-0.5">
            {PHASE_NAV.map((item, idx) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    title={item.description ?? item.label}
                    className={cn(
                      'group flex items-start gap-3 rounded-md px-3 py-2.5 text-sm transition-colors duration-150',
                      active
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-foreground/80 hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[10px] font-mono font-semibold',
                        active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:bg-primary/15 group-hover:text-primary'
                      )}
                    >
                      {idx + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                        <span className="truncate">{item.label}</span>
                      </span>
                      {item.description && (
                        <span className="block text-[11px] text-muted-foreground mt-0.5 leading-snug">
                          {item.description}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>

          <div className="px-2 mt-6 mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Additional Sections</p>
          </div>
          <ul className="space-y-0.5">
            {EXTRA_NAV.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    title={item.description ?? item.label}
                    className={cn(
                      'group flex items-start gap-3 rounded-md px-3 py-2.5 text-sm transition-colors duration-150',
                      active ? 'bg-primary/10 text-primary font-medium' : 'text-foreground/80 hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 mt-0.5 opacity-80" />
                    <span className="min-w-0 flex-1">
                      <span className="truncate block">{item.label}</span>
                      {item.description && <span className="block text-[11px] text-muted-foreground mt-0.5 leading-snug">{item.description}</span>}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>
    </>
  )
}

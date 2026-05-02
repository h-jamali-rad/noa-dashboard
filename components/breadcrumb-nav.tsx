import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

export type Crumb = { label: string; href?: string }

export default function BreadcrumbNav({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-xs text-muted-foreground mb-4">
      <Link
        href="/"
        className="flex items-center gap-1 hover:text-primary transition-colors"
        title="Back to overview"
      >
        <Home className="h-3 w-3" />
        <span>Home</span>
      </Link>
      {items.map((it, i) => (
        <span key={`${it.label}-${i}`} className="flex items-center">
          <ChevronRight className="h-3 w-3 mx-1.5 opacity-50" />
          {it.href ? (
            <Link href={it.href} className="hover:text-primary transition-colors" title={it.label}>
              {it.label}
            </Link>
          ) : (
            <span className="text-foreground/80">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}

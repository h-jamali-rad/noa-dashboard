import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
  className,
}: {
  label: string
  value: ReactNode
  hint?: string
  icon?: any
  accent?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow duration-200',
        className
      )}
      title={hint ?? label}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
            {label}
          </p>
          <p className="font-display font-bold text-2xl mt-1 leading-tight tracking-tight">
            {value}
          </p>
          {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
        </div>
        {Icon && (
          <div
            className="flex h-9 w-9 items-center justify-center rounded-md text-white shrink-0"
            style={{ backgroundColor: accent ?? 'hsl(var(--primary))' }}
          >
            <Icon className="h-4.5 w-4.5" />
          </div>
        )}
      </div>
    </div>
  )
}

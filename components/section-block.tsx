import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export function SectionBlock({
  id,
  eyebrow,
  title,
  description,
  icon: Icon,
  accent,
  children,
  className,
}: {
  id?: string
  eyebrow?: string
  title: string
  description?: string
  icon?: any
  accent?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      id={id}
      className={cn('scroll-mt-20 mb-10', className)}
    >
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-2">
          {Icon && (
            <div
              className="flex h-9 w-9 items-center justify-center rounded-md text-white shadow-sm shrink-0"
              style={{ backgroundColor: accent ?? 'hsl(var(--primary))' }}
            >
              <Icon className="h-4.5 w-4.5" />
            </div>
          )}
          <div>
            {eyebrow && (
              <p
                className="text-[11px] uppercase tracking-wider font-semibold mb-0.5"
                style={{ color: accent ?? 'hsl(var(--primary))' }}
              >
                {eyebrow}
              </p>
            )}
            <h2 className="font-display font-bold text-2xl tracking-tight">{title}</h2>
          </div>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">{description}</p>
        )}
      </div>
      {children}
    </section>
  )
}

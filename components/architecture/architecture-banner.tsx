'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Network, Cpu, BrainCircuit, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

const floatingIcons = [
  { Icon: Network, x: '10%', y: '20%', delay: 0, color: '#0e7490' },
  { Icon: Cpu, x: '80%', y: '15%', delay: 0.5, color: '#4f46e5' },
  { Icon: BrainCircuit, x: '70%', y: '70%', delay: 1, color: '#8b5cf6' },
  { Icon: ShieldCheck, x: '15%', y: '75%', delay: 1.5, color: '#10b981' },
]

export function ArchitectureBanner() {
  return (
    <Link href="/architecture" className="block group">
      <motion.div
        className="relative overflow-hidden rounded-xl border border-border/60 p-6 sm:p-8 transition-all duration-300 group-hover:border-primary/50"
        style={{
          background: `
            linear-gradient(135deg, 
              hsl(var(--card)) 0%, 
              hsl(var(--card)) 60%, 
              hsl(192 82% 31% / 0.08) 100%
            )
          `,
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{ y: -2 }}
      >
        {/* Animated gradient border glow */}
        <motion.div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `
              linear-gradient(135deg, 
                rgba(14,116,144,0.1) 0%, 
                rgba(79,70,229,0.08) 50%, 
                rgba(139,92,246,0.1) 100%
              )
            `,
          }}
        />

        {/* Floating background icons */}
        {floatingIcons.map(({ Icon, x, y, delay, color }, i) => (
          <motion.div
            key={i}
            className="absolute pointer-events-none"
            style={{ left: x, top: y }}
            animate={{
              y: [0, -8, 0],
              opacity: [0.06, 0.12, 0.06],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay,
              ease: 'easeInOut',
            }}
          >
            <Icon className="h-10 w-10 sm:h-12 sm:w-12" style={{ color }} />
          </motion.div>
        ))}

        {/* Content */}
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Left: Animated mini architecture preview */}
          <div className="shrink-0">
            <motion.div
              className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(14,116,144,0.15) 0%, rgba(79,70,229,0.15) 100%)',
                border: '1px solid rgba(14,116,144,0.3)',
              }}
            >
              {/* Orbiting dots */}
              {[0, 120, 240].map((angle, i) => (
                <motion.div
                  key={i}
                  className="absolute h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: ['#0e7490', '#4f46e5', '#8b5cf6'][i],
                    top: '50%',
                    left: '50%',
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 6 + i, repeat: Infinity, ease: 'linear' }}
                >
                  <motion.div
                    className="absolute h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: ['#0e7490', '#4f46e5', '#8b5cf6'][i],
                      top: `-${14 + i * 4}px`,
                    }}
                  />
                </motion.div>
              ))}
              {/* Center icon */}
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Network className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
              </motion.div>
            </motion.div>
          </div>

          {/* Middle: Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <motion.span
                className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                NEW
              </motion.span>
            </div>
            <h3 className="font-display font-bold text-lg sm:text-xl tracking-tight group-hover:text-primary transition-colors">
              Explore HJR&apos;s Multi-Agent AI Architecture
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Interactive DAG visualization of 5 specialized agents (Orchestrator, Researcher, Verifier, ML Expert, Dashboard Builder)
              orchestrated for the microTESE research workflow.
            </p>
          </div>

          {/* Right: CTA */}
          <div className="shrink-0 sm:ml-4">
            <Button variant="outline" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground transition-all">
              Explore
              <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

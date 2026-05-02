import {
  Database,
  Cpu,
  ShieldCheck,
  BrainCircuit,
  BookOpen,
  GraduationCap,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

export const PHASE_ORDER = [
  'preprocessing',
  'training',
  'validation',
  'xai',
  'literature',
  'integration',
] as const

export type PhaseSlug = (typeof PHASE_ORDER)[number]

export const ADDITIONAL_SECTION_ORDER = [
  'virtual-defense',
  'post-defense-actions',
  'cdss',
  'novelty-comparison',
  'references',
  'hardware-specs',
] as const

export const ICONS: Record<string, LucideIcon> = {
  database: Database,
  cpu: Cpu,
  'shield-check': ShieldCheck,
  'brain-circuit': BrainCircuit,
  'book-open': BookOpen,
  'graduation-cap': GraduationCap,
  sparkles: Sparkles,
}

export function getIcon(key: string): LucideIcon {
  return ICONS[key] ?? Sparkles
}

export const PHASE_COLOR_RAMP: Record<PhaseSlug, { hue: string; soft: string }> = {
  preprocessing: { hue: '#0f6d8b', soft: 'rgba(15, 109, 139, 0.12)' },
  training: { hue: '#1c8a9c', soft: 'rgba(28, 138, 156, 0.12)' },
  validation: { hue: '#2d6cdf', soft: 'rgba(45, 108, 223, 0.12)' },
  xai: { hue: '#7c3aed', soft: 'rgba(124, 58, 237, 0.12)' },
  literature: { hue: '#0f8a4f', soft: 'rgba(15, 138, 79, 0.12)' },
  integration: { hue: '#dc2626', soft: 'rgba(220, 38, 38, 0.12)' },
}

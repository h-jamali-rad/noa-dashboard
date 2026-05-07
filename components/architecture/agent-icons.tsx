'use client'

import { motion } from 'framer-motion'

/* ---- Shared wrapper for all icons ---- */
function IconWrap({ children, color, size = 56 }: { children: React.ReactNode; color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" xmlns="https://cdn.prod.website-files.com/621e95f9ac30687a56e4297e/678066bdc6b399b37f9e8c14_6481e3192719280020a3e877.png">
      <defs>
        <radialGradient id={`glow-${color.replace('#', '')}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      {children}
    </svg>
  )
}

/* ---- 1. Master Orchestrator: Central hub with rotating rings ---- */
export function OrchestratorIcon({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="orch-grad" x1="0" y1="0" x2="72" y2="72">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      {/* Outer rotating ring */}
      <motion.circle
        cx="36" cy="36" r="32"
        stroke="url(#orch-grad)" strokeWidth="1.5" strokeDasharray="8 4"
        fill="none"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '36px 36px' }}
      />
      {/* Middle ring */}
      <motion.circle
        cx="36" cy="36" r="26"
        stroke="#0e7490" strokeWidth="1" strokeDasharray="6 6"
        fill="none" opacity={0.6}
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '36px 36px' }}
      />
      {/* Inner glow */}
      <circle cx="36" cy="36" r="18" fill="#0e7490" opacity={0.15} />
      <motion.circle
        cx="36" cy="36" r="18"
        fill="none" stroke="#0ea5e9" strokeWidth="1.5"
        animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '36px 36px' }}
      />
      {/* Core brain icon */}
      <motion.g
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '36px 36px' }}
      >
        <path d="M28 30c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8" stroke="#0ea5e9" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <path d="M36 38c-4.4 0-8-3.6-8-8" stroke="#8b5cf6" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <circle cx="36" cy="30" r="3" fill="#0ea5e9" />
        <path d="M33 33l3-3 3 3" stroke="#8b5cf6" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {/* Neural connections */}
        <circle cx="30" cy="27" r="1.2" fill="#0ea5e9" opacity={0.8} />
        <circle cx="42" cy="27" r="1.2" fill="#8b5cf6" opacity={0.8} />
        <circle cx="36" cy="36" r="1.2" fill="#0ea5e9" opacity={0.8} />
        <line x1="30" y1="27" x2="36" y2="30" stroke="#0ea5e9" strokeWidth="0.6" opacity={0.5} />
        <line x1="42" y1="27" x2="36" y2="30" stroke="#8b5cf6" strokeWidth="0.6" opacity={0.5} />
        <line x1="36" y1="30" x2="36" y2="36" stroke="#0ea5e9" strokeWidth="0.6" opacity={0.5} />
      </motion.g>
      {/* Orbiting dots */}
      {[0, 90, 180, 270].map((angle, i) => (
        <motion.circle
          key={i}
          cx="36" cy="4" r="2"
          fill={i % 2 === 0 ? '#0ea5e9' : '#8b5cf6'}
          animate={{ rotate: 360 }}
          transition={{ duration: 10 + i * 2, repeat: Infinity, ease: 'linear', delay: i * 0.5 }}
          style={{ transformOrigin: '36px 36px' }}
          opacity={0.8}
        />
      ))}
    </svg>
  )
}

/* ---- 2. Data Preprocessing: Database with filter/cleaning animation ---- */
export function DataPreprocessingIcon({ size = 56 }: { size?: number }) {
  return (
    <IconWrap color="#06b6d4" size={size}>
      {/* Database shape */}
      <ellipse cx="28" cy="18" rx="14" ry="5" fill="#06b6d4" opacity={0.2} stroke="#06b6d4" strokeWidth="1.2" />
      <path d="M14 18v16c0 2.76 6.27 5 14 5s14-2.24 14-5V18" stroke="#06b6d4" strokeWidth="1.2" fill="none" />
      <ellipse cx="28" cy="26" rx="14" ry="5" fill="none" stroke="#06b6d4" strokeWidth="0.6" opacity={0.4} />
      {/* Cleaning sparkle animation */}
      <motion.g
        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '38px 14px' }}
      >
        <path d="M38 10l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" fill="#06b6d4" />
      </motion.g>
      <motion.g
        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        style={{ transformOrigin: '20px 30px' }}
      >
        <path d="M20 28l0.7 2 2 0.7-2 0.7-0.7 2-0.7-2-2-0.7 2-0.7z" fill="#06b6d4" opacity={0.7} />
      </motion.g>
      {/* Filter funnel */}
      <motion.path
        d="M22 32l6 6v4l-6-6z"
        fill="#06b6d4" opacity={0.3}
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
    </IconWrap>
  )
}

/* ---- 3. Pathology Encoding: DNA helix with encoding waves ---- */
export function PathologyEncodingIcon({ size = 56 }: { size?: number }) {
  return (
    <IconWrap color="#8b5cf6" size={size}>
      {/* Double helix */}
      <motion.path
        d="M20 10c4 4 12 4 16 0c-4 4-12 4-16 0"
        stroke="#8b5cf6" strokeWidth="1.5" fill="none" strokeLinecap="round"
        animate={{ y: [0, 4, 8, 12, 16, 20, 24, 28] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />
      <path d="M20 14c4 8 12-4 16 0" stroke="#8b5cf6" strokeWidth="1.2" fill="none" opacity={0.6} />
      <path d="M20 22c4 8 12-4 16 0" stroke="#8b5cf6" strokeWidth="1.2" fill="none" opacity={0.6} />
      <path d="M20 30c4 8 12-4 16 0" stroke="#8b5cf6" strokeWidth="1.2" fill="none" opacity={0.6} />
      <path d="M20 38c4 8 12-4 16 0" stroke="#8b5cf6" strokeWidth="1.2" fill="none" opacity={0.6} />
      {/* Encoding wave lines */}
      <motion.g
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <line x1="40" y1="20" x2="48" y2="18" stroke="#a78bfa" strokeWidth="1" />
        <line x1="40" y1="24" x2="48" y2="22" stroke="#a78bfa" strokeWidth="1" />
        <line x1="40" y1="28" x2="48" y2="26" stroke="#a78bfa" strokeWidth="1" />
        <line x1="40" y1="32" x2="48" y2="30" stroke="#a78bfa" strokeWidth="1" />
      </motion.g>
      {/* Microscope lens */}
      <circle cx="28" cy="28" r="10" stroke="#8b5cf6" strokeWidth="0.8" fill="none" opacity={0.3} />
      <motion.circle
        cx="28" cy="28" r="10"
        stroke="#8b5cf6" strokeWidth="1.5" fill="none"
        strokeDasharray="6 57"
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '28px 28px' }}
        opacity={0.6}
      />
    </IconWrap>
  )
}

/* ---- 4. Model Training: Brain/neural net with training pulse ---- */
export function ModelTrainingIcon({ size = 56 }: { size?: number }) {
  return (
    <IconWrap color="#0ea5e9" size={size}>
      {/* Neural network nodes */}
      {/* Layer 1 */}
      <circle cx="12" cy="18" r="3" fill="#0ea5e9" opacity={0.6} />
      <circle cx="12" cy="28" r="3" fill="#0ea5e9" opacity={0.6} />
      <circle cx="12" cy="38" r="3" fill="#0ea5e9" opacity={0.6} />
      {/* Layer 2 */}
      <circle cx="28" cy="14" r="3.5" fill="#0ea5e9" opacity={0.8} />
      <circle cx="28" cy="28" r="3.5" fill="#0ea5e9" opacity={0.8} />
      <circle cx="28" cy="42" r="3.5" fill="#0ea5e9" opacity={0.8} />
      {/* Layer 3 */}
      <circle cx="44" cy="22" r="3" fill="#0ea5e9" opacity={0.6} />
      <circle cx="44" cy="34" r="3" fill="#0ea5e9" opacity={0.6} />
      {/* Connections */}
      {[18, 28, 38].map(y1 =>
        [14, 28, 42].map(y2 => (
          <line key={`${y1}-${y2}`} x1="12" y1={y1} x2="28" y2={y2} stroke="#0ea5e9" strokeWidth="0.5" opacity={0.3} />
        ))
      )}
      {[14, 28, 42].map(y1 =>
        [22, 34].map(y2 => (
          <line key={`${y1}-${y2}`} x1="28" y1={y1} x2="44" y2={y2} stroke="#0ea5e9" strokeWidth="0.5" opacity={0.3} />
        ))
      )}
      {/* Pulse traveling through network */}
      <motion.circle
        cx="12" cy="28" r="2"
        fill="#38bdf8"
        animate={{ cx: [12, 28, 44], cy: [28, 14, 22], opacity: [1, 0.8, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.circle
        cx="12" cy="38" r="2"
        fill="#38bdf8"
        animate={{ cx: [12, 28, 44], cy: [38, 42, 34], opacity: [1, 0.8, 0.4] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />
    </IconWrap>
  )
}

/* ---- 5. Validation: Shield with checkmark scan ---- */
export function ValidationIcon({ size = 56 }: { size?: number }) {
  return (
    <IconWrap color="#10b981" size={size}>
      {/* Shield */}
      <path
        d="M28 8L12 16v12c0 10 7.2 19.4 16 22 8.8-2.6 16-12 16-22V16L28 8z"
        fill="#10b981" opacity={0.12} stroke="#10b981" strokeWidth="1.2"
      />
      {/* Checkmark */}
      <motion.path
        d="M20 28l5 5 10-12"
        stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: [0, 1, 1, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Scanning line */}
      <motion.line
        x1="14" x2="42" y1="20" y2="20"
        stroke="#10b981" strokeWidth="1" opacity={0.5}
        animate={{ y1: [14, 42, 14], y2: [14, 42, 14] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
    </IconWrap>
  )
}

/* ---- 6. XAI: Eye with analysis rays ---- */
export function XaiIcon({ size = 56 }: { size?: number }) {
  return (
    <IconWrap color="#f59e0b" size={size}>
      {/* Eye shape */}
      <path d="M6 28s8-14 22-14 22 14 22 14-8 14-22 14S6 28 6 28z" fill="#f59e0b" opacity={0.1} stroke="#f59e0b" strokeWidth="1.2" />
      <circle cx="28" cy="28" r="7" fill="#f59e0b" opacity={0.3} stroke="#f59e0b" strokeWidth="1" />
      <motion.circle
        cx="28" cy="28" r="3"
        fill="#f59e0b"
        animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '28px 28px' }}
      />
      {/* Analysis rays */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <motion.line
          key={i}
          x1="28" y1="28"
          x2={28 + Math.cos(angle * Math.PI / 180) * 22}
          y2={28 + Math.sin(angle * Math.PI / 180) * 22}
          stroke="#f59e0b" strokeWidth="0.5" opacity={0.3}
          animate={{ opacity: [0.1, 0.5, 0.1] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.25, ease: 'easeInOut' }}
        />
      ))}
    </IconWrap>
  )
}

/* ---- 7. Literature: Book with page-turning ---- */
export function LiteratureIcon({ size = 56 }: { size?: number }) {
  return (
    <IconWrap color="#ec4899" size={size}>
      {/* Book base */}
      <path d="M10 12h16v32H10z" fill="#ec4899" opacity={0.1} stroke="#ec4899" strokeWidth="1" />
      <path d="M26 12h16v32H26z" fill="#ec4899" opacity={0.15} stroke="#ec4899" strokeWidth="1" />
      <line x1="26" y1="12" x2="26" y2="44" stroke="#ec4899" strokeWidth="1.5" />
      {/* Text lines */}
      <line x1="14" y1="20" x2="22" y2="20" stroke="#ec4899" strokeWidth="0.8" opacity={0.4} />
      <line x1="14" y1="24" x2="22" y2="24" stroke="#ec4899" strokeWidth="0.8" opacity={0.4} />
      <line x1="14" y1="28" x2="20" y2="28" stroke="#ec4899" strokeWidth="0.8" opacity={0.4} />
      <line x1="30" y1="20" x2="38" y2="20" stroke="#ec4899" strokeWidth="0.8" opacity={0.4} />
      <line x1="30" y1="24" x2="38" y2="24" stroke="#ec4899" strokeWidth="0.8" opacity={0.4} />
      <line x1="30" y1="28" x2="36" y2="28" stroke="#ec4899" strokeWidth="0.8" opacity={0.4} />
      {/* Page turning animation */}
      <motion.path
        d="M26 12h16v32H26z"
        fill="#ec4899" opacity={0.08}
        animate={{ rotateY: [0, -60, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '26px 28px' }}
      />
      {/* Floating citation dots */}
      <motion.circle cx="44" cy="16" r="1.5" fill="#ec4899"
        animate={{ y: [0, -4, 0], opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      />
      <motion.circle cx="46" cy="22" r="1" fill="#ec4899"
        animate={{ y: [0, -3, 0], opacity: [0.2, 0.6, 0.2] }}
        transition={{ duration: 3, repeat: Infinity, delay: 0.4 }}
      />
    </IconWrap>
  )
}

/* ---- 8. CDSS: Medical cross with heartbeat ---- */
export function CdssIcon({ size = 56 }: { size?: number }) {
  return (
    <IconWrap color="#ef4444" size={size}>
      {/* Medical cross */}
      <rect x="22" y="12" width="12" height="32" rx="2" fill="#ef4444" opacity={0.15} />
      <rect x="12" y="22" width="32" height="12" rx="2" fill="#ef4444" opacity={0.15} />
      <rect x="22" y="12" width="12" height="32" rx="2" fill="none" stroke="#ef4444" strokeWidth="1" />
      <rect x="12" y="22" width="32" height="12" rx="2" fill="none" stroke="#ef4444" strokeWidth="1" />
      {/* Heartbeat line */}
      <motion.polyline
        points="8,28 16,28 20,20 24,36 28,24 32,32 36,28 44,28 48,28"
        stroke="#ef4444" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="80"
        animate={{ strokeDashoffset: [80, 0, -80] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />
    </IconWrap>
  )
}

/* ---- 9. Judge LLM: Scales with weighing animation ---- */
export function JudgeIcon({ size = 56 }: { size?: number }) {
  return (
    <IconWrap color="#a855f7" size={size}>
      {/* Central pillar */}
      <line x1="28" y1="10" x2="28" y2="44" stroke="#a855f7" strokeWidth="1.5" />
      <rect x="24" y="42" width="8" height="3" rx="1" fill="#a855f7" opacity={0.4} />
      {/* Balance beam */}
      <motion.g
        animate={{ rotate: [-3, 3, -3] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '28px 14px' }}
      >
        <line x1="10" y1="14" x2="46" y2="14" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round" />
        {/* Left pan */}
        <line x1="14" y1="14" x2="10" y2="24" stroke="#a855f7" strokeWidth="0.8" />
        <line x1="14" y1="14" x2="18" y2="24" stroke="#a855f7" strokeWidth="0.8" />
        <path d="M8 24c0 2 5.3 4 6 4s6-2 6-4H8z" fill="#a855f7" opacity={0.2} stroke="#a855f7" strokeWidth="0.8" />
        {/* Right pan */}
        <line x1="42" y1="14" x2="38" y2="24" stroke="#a855f7" strokeWidth="0.8" />
        <line x1="42" y1="14" x2="46" y2="24" stroke="#a855f7" strokeWidth="0.8" />
        <path d="M36 24c0 2 5.3 4 6 4s6-2 6-4H36z" fill="#a855f7" opacity={0.2} stroke="#a855f7" strokeWidth="0.8" />
      </motion.g>
      {/* Gavel star */}
      <motion.path
        d="M28 10l1.5 3 3.5 0.5-2.5 2.5 0.5 3.5L28 18l-3 1.5 0.5-3.5L23 13.5l3.5-0.5z"
        fill="#a855f7" opacity={0.5}
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '28px 14px' }}
      />
    </IconWrap>
  )
}

/* ---- 10. Embedding & Reranker: Compass with radar sweep ---- */
export function EmbeddingIcon({ size = 56 }: { size?: number }) {
  return (
    <IconWrap color="#14b8a6" size={size}>
      {/* Outer circle */}
      <circle cx="28" cy="28" r="20" fill="none" stroke="#14b8a6" strokeWidth="1" opacity={0.4} />
      <circle cx="28" cy="28" r="14" fill="none" stroke="#14b8a6" strokeWidth="0.6" opacity={0.3} />
      <circle cx="28" cy="28" r="8" fill="none" stroke="#14b8a6" strokeWidth="0.6" opacity={0.3} />
      {/* Cross hairs */}
      <line x1="28" y1="8" x2="28" y2="48" stroke="#14b8a6" strokeWidth="0.5" opacity={0.3} />
      <line x1="8" y1="28" x2="48" y2="28" stroke="#14b8a6" strokeWidth="0.5" opacity={0.3} />
      {/* Radar sweep */}
      <motion.path
        d="M28 28L28 8A20 20 0 0 1 48 28z"
        fill="#14b8a6" opacity={0.15}
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '28px 28px' }}
      />
      <motion.line
        x1="28" y1="28" x2="28" y2="8"
        stroke="#14b8a6" strokeWidth="1.5"
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '28px 28px' }}
      />
      {/* Blips */}
      <motion.circle cx="34" cy="18" r="2" fill="#14b8a6"
        animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, delay: 1 }}
        style={{ transformOrigin: '34px 18px' }}
      />
      <motion.circle cx="20" cy="34" r="1.5" fill="#14b8a6"
        animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, delay: 2.5 }}
        style={{ transformOrigin: '20px 34px' }}
      />
      <circle cx="28" cy="28" r="3" fill="#14b8a6" />
    </IconWrap>
  )
}

/* ---- 11. LLM Farms: Server stack with processing animation ---- */
export function LlmFarmsIcon({ size = 56 }: { size?: number }) {
  return (
    <IconWrap color="#6366f1" size={size}>
      {/* Server rack */}
      {[0, 1, 2, 3].map(i => (
        <g key={i}>
          <rect x="10" y={10 + i * 10} width="36" height="8" rx="2" fill="#6366f1" opacity={0.1} stroke="#6366f1" strokeWidth="0.8" />
          <motion.circle
            cx="40" cy={14 + i * 10} r="1.5" fill="#6366f1"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
          />
          <line x1="14" y1={14 + i * 10} x2="24" y2={14 + i * 10} stroke="#6366f1" strokeWidth="0.6" opacity={0.4} />
        </g>
      ))}
      {/* Processing waves */}
      <motion.g
        animate={{ opacity: [0.2, 0.6, 0.2] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <path d="M48 20c2-2 2-6 0-8" stroke="#6366f1" strokeWidth="0.8" fill="none" />
        <path d="M50 22c3-3 3-10 0-12" stroke="#6366f1" strokeWidth="0.6" fill="none" opacity={0.5} />
      </motion.g>
    </IconWrap>
  )
}

'use client'

import { useState } from 'react'
import Image from 'next/image'

interface TeamMember {
  id: string
  name: string
  title: string
  specialty: string
  hIndex: number
  affiliation: string
  image: string
  height: number
  row: number // 0 = front, 1 = back
  position: number // x offset within row
  idleAnimation: string
}

const teamMembers: TeamMember[] = [
  {
    id: 'jamalirad',
    name: 'Hossein Jamalirad',
    title: 'PhD Candidate',
    specialty: 'Medical Informatics',
    hIndex: 4,
    affiliation: 'MUMS',
    image: '/images/team/char_jamalirad.png',
    height: 186,
    row: 0,
    position: 0,
    idleAnimation: 'idle-breathe',
  },
  {
    id: 'sabbaghian',
    name: 'Dr. Marjan Sabbaghian',
    title: 'Principal Investigator',
    specialty: 'Andrology & Biochemistry',
    hIndex: 30,
    affiliation: 'Royan Institute',
    image: '/images/team/char_sabbaghian.png',
    height: 175,
    row: 1,
    position: 1,
    idleAnimation: 'idle-sway-right',
  },
  {
    id: 'gilani',
    name: 'Dr. Mohammad Ali Sadighi Gilani',
    title: 'Professor of Urology',
    specialty: 'Urology & Andrology',
    hIndex: 30,
    affiliation: 'Royan Institute',
    image: '/images/team/char_gilani.png',
    height: 175,
    row: 1,
    position: 2,
    idleAnimation: 'idle-shift',
  },
  {
    id: 'vakili',
    name: 'Dr. Hassan Vakili Arki',
    title: 'Associate Professor',
    specialty: 'Medical Informatics',
    hIndex: 12,
    affiliation: 'MUMS',
    image: '/images/team/char_vakili.png',
    height: 175,
    row: 1,
    position: -1,
    idleAnimation: 'idle-sway-left',
  },
  {
    id: 'eslami',
    name: 'Dr. Saeid Eslami',
    title: 'Professor',
    specialty: 'Medical Informatics & Pharmaceutical Research',
    hIndex: 55,
    affiliation: 'MUMS & University of Amsterdam',
    image: '/images/team/char_eslami.png',
    height: 175,
    row: 1,
    position: -2,
    idleAnimation: 'idle-breathe-slow',
  },
]

export default function TeamStanding() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  function handleClick(id: string) {
    setSelectedId((prev) => (prev === id ? null : id))
  }

  const selected = teamMembers.find((m) => m.id === selectedId) ?? null

  return (
    <div className="relative w-full">
      {/* Background logos */}
      <div className="absolute inset-0 flex items-start justify-center gap-8 pt-4 opacity-10 pointer-events-none z-0">
        <Image src="/images/team/mums_logo.jpeg" alt="MUMS" width={80} height={80} className="rounded-full" />
        <Image src="/images/team/royan_logo.png" alt="Royan Institute" width={80} height={80} className="rounded-full" />
        <Image src="/images/team/medical_informatics_logo.png" alt="Medical Informatics" width={80} height={80} className="rounded-full" />
      </div>

      {/* Team composition */}
      <div className="relative z-10 flex flex-col items-center pt-8 pb-4">
        {/* Back row */}
        <div className="flex items-end justify-center gap-2 sm:gap-4 mb-[-40px] z-10">
          {teamMembers
            .filter((m) => m.row === 1)
            .sort((a, b) => a.position - b.position)
            .map((member) => (
              <CharacterCard
                key={member.id}
                member={member}
                isSelected={selectedId === member.id}
                isHovered={hoveredId === member.id}
                isFaded={selectedId !== null && selectedId !== member.id}
                onClick={() => handleClick(member.id)}
                onHover={(h) => setHoveredId(h ? member.id : null)}
                scale={0.85}
              />
            ))}
        </div>

        {/* Front row */}
        <div className="flex items-end justify-center z-20">
          {teamMembers
            .filter((m) => m.row === 0)
            .map((member) => (
              <CharacterCard
                key={member.id}
                member={member}
                isSelected={selectedId === member.id}
                isHovered={hoveredId === member.id}
                isFaded={selectedId !== null && selectedId !== member.id}
                onClick={() => handleClick(member.id)}
                onHover={(h) => setHoveredId(h ? member.id : null)}
                scale={1}
              />
            ))}
        </div>
      </div>

      {/* Info card */}
      {selected && (
        <div className="mx-auto mt-4 max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="rounded-xl border border-primary/30 bg-card/95 backdrop-blur-md p-5 shadow-lg shadow-primary/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-primary/50 flex-shrink-0">
                <Image
                  src={selected.image}
                  alt={selected.name}
                  width={48}
                  height={48}
                  className="object-cover object-top w-full h-full"
                />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-foreground">{selected.name}</h3>
                <p className="text-xs text-muted-foreground">{selected.title}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-primary/10 p-3">
                <p className="text-xs text-muted-foreground mb-1">h-index</p>
                <p className="font-bold text-xl text-primary">{selected.hIndex}</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-3">
                <p className="text-xs text-muted-foreground mb-1">Affiliation</p>
                <p className="font-semibold text-foreground text-sm">{selected.affiliation}</p>
              </div>
              <div className="col-span-2 rounded-lg bg-primary/10 p-3">
                <p className="text-xs text-muted-foreground mb-1">Specialty</p>
                <p className="font-semibold text-foreground">{selected.specialty}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hover tooltip */}
      {hoveredId && !selectedId && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 animate-in fade-in duration-200">
          <div className="rounded-lg bg-card/95 backdrop-blur border border-primary/20 px-4 py-2 shadow-md text-center">
            <p className="font-semibold text-sm text-foreground">
              {teamMembers.find((m) => m.id === hoveredId)?.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {teamMembers.find((m) => m.id === hoveredId)?.title}
            </p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes idle-breathe {
          0%, 100% { transform: translateY(0px) scale(var(--char-scale)); }
          50% { transform: translateY(-3px) scale(var(--char-scale)); }
        }
        @keyframes idle-sway-right {
          0%, 100% { transform: translateX(0px) scale(var(--char-scale)); }
          50% { transform: translateX(2px) scale(var(--char-scale)); }
        }
        @keyframes idle-sway-left {
          0%, 100% { transform: translateX(0px) scale(var(--char-scale)); }
          50% { transform: translateX(-2px) scale(var(--char-scale)); }
        }
        @keyframes idle-shift {
          0%, 100% { transform: translateY(0px) rotate(0deg) scale(var(--char-scale)); }
          33% { transform: translateY(-2px) rotate(0.3deg) scale(var(--char-scale)); }
          66% { transform: translateY(0px) rotate(-0.3deg) scale(var(--char-scale)); }
        }
        @keyframes idle-breathe-slow {
          0%, 100% { transform: translateY(0px) scale(var(--char-scale)); }
          50% { transform: translateY(-2px) scale(calc(var(--char-scale) * 1.005)); }
        }
      `}</style>
    </div>
  )
}

function CharacterCard({
  member,
  isSelected,
  isHovered,
  isFaded,
  onClick,
  onHover,
  scale,
}: {
  member: TeamMember
  isSelected: boolean
  isHovered: boolean
  isFaded: boolean
  onClick: () => void
  onHover: (h: boolean) => void
  scale: number
}) {
  const heightPx = (member.height / 186) * 280 * scale

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className="relative group focus:outline-none transition-all duration-500 ease-out"
      style={
        {
          '--char-scale': scale,
          opacity: isFaded ? 0.3 : 1,
          filter: isFaded ? 'grayscale(0.7)' : isHovered ? 'brightness(1.15) drop-shadow(0 0 20px hsl(192, 80%, 52%, 0.4))' : 'none',
          animation: `${member.idleAnimation} ${3 + Math.random() * 2}s ease-in-out infinite`,
          cursor: 'pointer',
        } as React.CSSProperties
      }
    >
      <div
        style={{ height: `${heightPx}px`, width: `${heightPx * 0.55}px` }}
        className="relative transition-transform duration-300 group-hover:scale-105"
      >
        <Image
          src={member.image}
          alt={member.name}
          fill
          className="object-contain object-bottom"
          sizes="200px"
        />
      </div>

      {/* Glow ring on select */}
      {isSelected && (
        <div className="absolute inset-0 rounded-full border-2 border-primary/40 animate-pulse pointer-events-none" />
      )}
    </button>
  )
}

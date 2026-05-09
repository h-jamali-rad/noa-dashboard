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
    <div className="relative w-full overflow-hidden min-h-[700px] bg-gradient-to-b from-transparent via-primary/5 to-transparent rounded-3xl">
      {/* Floating Institutional Logos Above Heads */}
      <div className="absolute top-8 left-0 w-full flex justify-center items-center gap-10 sm:gap-20 z-20 px-4">
        {/* MUMS Left */}
        <div className="flex flex-col items-center animate-bounce duration-[4s]" style={{ animationDelay: '0.2s' }}>
          <div className="w-14 h-14 sm:w-16 sm:h-16 relative rounded-full overflow-hidden border border-primary/20 bg-card/40 backdrop-blur-sm p-2 shadow-[0_0_15px_rgba(var(--primary),0.2)]">
            <Image src="/images/team/mums_logo.jpeg" alt="MUMS" fill className="object-contain p-1" />
          </div>
          <span className="text-[9px] font-bold mt-2 text-primary/70 tracking-widest uppercase">MUMS</span>
        </div>

        {/* Royan Center */}
        <div className="flex flex-col items-center animate-bounce duration-[3s]">
          <div className="w-18 h-18 sm:w-20 sm:h-20 relative rounded-full overflow-hidden border-2 border-primary/30 bg-card/50 backdrop-blur-md p-2 shadow-[0_0_25px_rgba(var(--primary),0.3)]">
            <Image src="/images/team/royan_logo.png" alt="Royan" fill className="object-contain p-1" />
          </div>
          <span className="text-[10px] font-bold mt-2 text-primary tracking-widest uppercase">Royan Institute</span>
        </div>

        {/* MedInfo Right */}
        <div className="flex flex-col items-center animate-bounce duration-[4.5s]" style={{ animationDelay: '0.4s' }}>
          <div className="w-14 h-14 sm:w-16 sm:h-16 relative rounded-full overflow-hidden border border-primary/20 bg-card/40 backdrop-blur-sm p-2 shadow-[0_0_15px_rgba(var(--primary),0.2)]">
            <Image src="/images/team/medical_informatics_logo.png" alt="MedInfo" fill className="object-contain p-1" />
          </div>
          <span className="text-[9px] font-bold mt-2 text-primary/70 tracking-widest uppercase">Med Informatics</span>
        </div>
      </div>

      {/* Team composition on Hologram Platform */}
      <div className="relative z-10 flex flex-col items-center pt-40 pb-12 cursor-default">
        {/* Hologram Platform Base */}
        <div className="absolute bottom-20 w-[90%] max-w-4xl h-40 bg-primary/10 blur-[120px] rounded-[100%] z-0" />
        <div className="absolute bottom-24 w-[70%] max-w-2xl h-16 border-b-4 border-primary/30 rounded-[100%] z-0 shadow-[0_15px_40px_rgba(var(--primary),0.4)] transform -rotate-1" />
        <div className="absolute bottom-28 w-[50%] max-w-xl h-10 border border-t-2 border-primary/10 rounded-[100%] z-0 shadow-[0_-5px_20px_rgba(var(--primary),0.1)] transform rotate-1" />
        
        {/* Vertical Scanning Beams */}
        <div className="absolute bottom-24 left-0 w-full h-[350px] pointer-events-none overflow-hidden z-0">
          <div className="w-full h-full relative opacity-20">
            {[...Array(8)].map((_, i) => (
              <div 
                key={i}
                className="absolute bottom-0 w-px h-full bg-gradient-to-t from-primary/60 to-transparent animate-pulse"
                style={{ left: `${15 + i * 10}%`, animationDelay: `${i * 0.3}s`, height: `${60 + Math.random() * 40}%` }}
              />
            ))}
          </div>
        </div>

        {/* Back row */}
        <div className="flex items-end justify-center gap-2 sm:gap-6 mb-[-60px] z-10">
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
                scale={0.82}
              />
            ))}
        </div>

        {/* Front row */}
        <div className="flex items-end justify-center z-20 mt-4">
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

      {/* Hologram Light Dust / Particles (CSS animation) */}
      <div className="absolute inset-x-0 bottom-1/4 h-32 pointer-events-none opacity-40 z-10 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div 
            key={i}
            className="absolute bg-primary rounded-full animate-hologram-particle"
            style={{ 
              width: `${Math.random() * 3 + 1}px`, 
              height: `${Math.random() * 3 + 1}px`,
              left: `${Math.random() * 100}%`,
              bottom: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 3 + 2}s`
            }}
          />
        ))}
      </div>

      {/* Info card */}
      {selected && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-40 animate-in fade-in slide-in-from-bottom-6 duration-400">
          <div className="rounded-2xl border border-primary/30 bg-card/80 backdrop-blur-xl p-6 shadow-2xl shadow-primary/20 ring-1 ring-white/10">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-primary/40 flex-shrink-0 bg-primary/10">
                <Image
                  src={selected.image}
                  alt={selected.name}
                  width={56}
                  height={56}
                  className="object-cover object-top w-full h-full"
                />
              </div>
              <div>
                <h3 className="font-display font-bold text-xl text-foreground tracking-tight">{selected.name}</h3>
                <p className="text-xs font-medium text-primary uppercase tracking-wider">{selected.title}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-primary/5 p-3 border border-primary/10">
                <p className="text-[10px] text-muted-foreground uppercase mb-1 font-bold">h-index</p>
                <p className="font-display font-black text-2xl text-primary">{selected.hIndex}</p>
              </div>
              <div className="rounded-xl bg-primary/5 p-3 border border-primary/10 overflow-hidden">
                <p className="text-[10px] text-muted-foreground uppercase mb-1 font-bold">Affiliation</p>
                <p className="font-bold text-foreground text-xs leading-tight truncate">{selected.affiliation}</p>
              </div>
              <div className="col-span-2 rounded-xl bg-primary/5 p-3 border border-primary/10">
                <p className="text-[10px] text-muted-foreground uppercase mb-1 font-bold">Specialty</p>
                <p className="font-semibold text-foreground text-sm line-clamp-2 leading-snug">{selected.specialty}</p>
              </div>
            </div>
            <button 
              onClick={() => setSelectedId(null)}
              className="mt-6 w-full py-2 rounded-lg bg-primary/10 border border-primary/20 text-xs font-bold uppercase tracking-widest hover:bg-primary/20 transition-colors"
            >
              Close Profile
            </button>
          </div>
        </div>
      )}

      {/* Hover tooltip */}
      {hoveredId && !selectedId && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 z-30 animate-in fade-in zoom-in-95 duration-200">
          <div className="rounded-full bg-primary/10 backdrop-blur-xl border border-primary/30 px-6 py-2 shadow-xl shadow-primary/10">
            <p className="font-display font-bold text-sm text-foreground whitespace-nowrap">
              {teamMembers.find((m) => m.id === hoveredId)?.name}
            </p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes idle-breathe {
          0%, 100% { transform: translateY(0px) scale(var(--char-scale)); }
          50% { transform: translateY(-4px) scale(var(--char-scale)); }
        }
        @keyframes idle-sway-right {
          0%, 100% { transform: translateX(0px) rotate(0deg) scale(var(--char-scale)); }
          50% { transform: translateX(3px) rotate(0.2deg) scale(var(--char-scale)); }
        }
        @keyframes idle-sway-left {
          0%, 100% { transform: translateX(0px) rotate(0deg) scale(var(--char-scale)); }
          50% { transform: translateX(-3px) rotate(-0.2deg) scale(var(--char-scale)); }
        }
        @keyframes idle-shift {
          0%, 100% { transform: translateY(0px) rotate(0deg) scale(var(--char-scale)); }
          33% { transform: translateY(-3px) rotate(0.4deg) scale(var(--char-scale)); }
          66% { transform: translateY(0px) rotate(-0.4deg) scale(var(--char-scale)); }
        }
        @keyframes idle-breathe-slow {
          0%, 100% { transform: translateY(0px) scale(var(--char-scale)); }
          50% { transform: translateY(-2px) scale(calc(var(--char-scale) * 1.008)); }
        }
        @keyframes hologram-particle {
          0% { opacity: 0; transform: translateY(20px); }
          50% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-40px); }
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
  const heightPx = (member.height / 186) * 320 * scale

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className="relative group focus:outline-none transition-all duration-700 ease-out"
      style={
        {
          '--char-scale': scale,
          opacity: isFaded ? 0.35 : 1,
          filter: isFaded ? 'grayscale(0.8) blur(1px)' : isHovered ? 'brightness(1.2) drop-shadow(0 0 30px rgba(var(--primary), 0.5))' : 'drop-shadow(0 0 10px rgba(var(--primary), 0.2))',
          animation: `${member.idleAnimation} ${4 + Math.random() * 3}s ease-in-out infinite`,
          cursor: 'pointer',
        } as React.CSSProperties
      }
    >
      <div
        style={{ height: `${heightPx}px`, width: `${heightPx * 0.55}px` }}
        className="relative transition-all duration-500 group-hover:scale-105 group-hover:-translate-y-2"
      >
        <Image
          src={member.image}
          alt={member.name}
          fill
          className="object-contain object-bottom drop-shadow-2xl"
          sizes="250px"
          priority
        />
        
        {/* Internal Hologram Glitch Effect on hover */}
        {isHovered && (
          <div className="absolute inset-0 bg-primary/10 mix-blend-screen opacity-30 animate-pulse pointer-events-none rounded-b-2xl overflow-hidden" />
        )}
      </div>

      {/* Glow highlight on select */}
      {isSelected && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-2 bg-primary blur-md rounded-full animate-pulse" />
      )}
    </button>
  )
}

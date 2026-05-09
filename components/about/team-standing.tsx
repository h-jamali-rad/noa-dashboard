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
  activeImage: string
  institutionLogo: string
  height: number
  row: number
  position: number
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
    activeImage: '/images/team/char_jamalirad_active.png',
    institutionLogo: '/images/team/mums_logo.jpeg',
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
    activeImage: '/images/team/char_sabbaghian_active.png',
    institutionLogo: '/images/team/royan_logo.png',
    height: 175,
    row: 1,
    position: 0.8,
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
    activeImage: '/images/team/char_gilani_active.png',
    institutionLogo: '/images/team/royan_logo.png',
    height: 175,
    row: 1,
    position: 1.6,
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
    activeImage: '/images/team/char_vakili_active.png',
    institutionLogo: '/images/team/mums_logo.jpeg',
    height: 175,
    row: 1,
    position: -0.8,
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
    activeImage: '/images/team/char_eslami_active.png',
    institutionLogo: '/images/team/medical_informatics_logo.png',
    height: 175,
    row: 1,
    position: -1.6,
    idleAnimation: 'idle-breathe-slow',
  },
]

export default function TeamStanding() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  function handleClick(id: string) {
    setSelectedId((prev) => (prev === id ? null : id))
  }

  const selected = teamMembers.find((m) => m.id === (hoveredId || selectedId)) ?? null

  return (
    <div className="relative w-full overflow-hidden min-h-[750px] bg-gradient-to-b from-transparent via-primary/5 to-transparent rounded-3xl">
      {/* Background Holographic Infrastructure Logos */}
      <div className="absolute top-12 left-0 w-full flex justify-around items-start opacity-10 pointer-events-none z-0 px-20">
        <div className="w-48 h-48 relative animate-pulse" style={{ animationDuration: '6s' }}>
          <Image src="/images/team/mums_logo.jpeg" alt="MUMS" fill className="object-contain grayscale contrast-125" />
        </div>
        <div className="w-56 h-56 relative animate-pulse" style={{ animationDuration: '8s', animationDelay: '1s' }}>
          <Image src="/images/team/royan_logo.png" alt="Royan" fill className="object-contain grayscale contrast-125" />
        </div>
        <div className="w-48 h-48 relative animate-pulse" style={{ animationDuration: '7s', animationDelay: '2.5s' }}>
          <Image src="/images/team/medical_informatics_logo.png" alt="MedInfo" fill className="object-contain grayscale contrast-125" />
        </div>
      </div>

      {/* Team composition on Hologram Platform */}
      <div className="relative z-10 flex flex-col items-center pt-32 pb-12 cursor-default">
        {/* Hologram Platform Base */}
        <div className="absolute bottom-16 w-full max-w-3xl h-64 bg-primary/10 blur-[130px] rounded-[100%] z-0" />
        <div
          className="absolute bottom-20 w-[80%] max-w-xl h-24 border-t border-primary/40 rounded-[100%] z-0"
          style={{
            background: 'radial-gradient(circle, rgba(var(--primary), 0.15) 0%, transparent 70%)',
            boxShadow: '0 -20px 50px rgba(var(--primary), 0.3)',
          }}
        />
        <div className="absolute bottom-22 w-[60%] max-w-lg h-12 border border-primary/20 rounded-[100%] z-0 opacity-50" />

        {/* Back row */}
        <div className="flex items-end justify-center gap-0 sm:gap-2 mb-[-100px] z-10">
          {teamMembers
            .filter((m) => m.row === 1)
            .sort((a, b) => a.position - b.position)
            .map((member) => (
              <CharacterCard
                key={member.id}
                member={member}
                isSelected={selectedId === member.id}
                isHovered={hoveredId === member.id}
                isFaded={hoveredId !== null && hoveredId !== member.id}
                onClick={() => handleClick(member.id)}
                onHover={(h) => setHoveredId(h ? member.id : null)}
                scale={0.88}
              />
            ))}
        </div>

        {/* Front row */}
        <div className="flex items-end justify-center z-30 mt-4">
          {teamMembers
            .filter((m) => m.row === 0)
            .map((member) => (
              <CharacterCard
                key={member.id}
                member={member}
                isSelected={selectedId === member.id}
                isHovered={hoveredId === member.id}
                isFaded={hoveredId !== null && hoveredId !== member.id}
                onClick={() => handleClick(member.id)}
                onHover={(h) => setHoveredId(h ? member.id : null)}
                scale={1.1}
              />
            ))}
        </div>
      </div>

      {/* Hologram Light Dust / Particles */}
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
              animationDuration: `${Math.random() * 3 + 2}s`,
            }}
          />
        ))}
      </div>

      {/* Info card */}
      {selected && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-50 animate-in fade-in slide-in-from-bottom-6 duration-400 pointer-events-auto">
          <div className="rounded-2xl border border-primary/30 bg-card/85 backdrop-blur-2xl p-6 shadow-2xl shadow-primary/30 ring-1 ring-white/10 overflow-hidden relative">
            {/* Institution Highlight Banner */}
            <div className="absolute top-0 right-0 w-24 h-24 opacity-10 -mr-6 -mt-6 pointer-events-none">
              <Image
                src={selected.institutionLogo}
                alt="Institution"
                fill
                className="object-contain"
              />
            </div>

            <div className="flex items-center gap-4 mb-4 relative">
              <div className="h-16 w-16 relative rounded-full overflow-hidden border-2 border-primary/40 flex-shrink-0 bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.3)]">
                <Image
                  src={selected.activeImage}
                  alt={selected.name}
                  fill
                  className="object-cover object-top scale-[1.5] origin-top translate-y-1"
                />
              </div>
              <div>
                <h3 className="font-display font-bold text-xl text-foreground tracking-tight leading-tight">
                  {selected.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{selected.title}</p>
                  <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                  <p className="text-[10px] font-semibold text-muted-foreground">
                    {selected.affiliation.split('&')[0].trim()}
                  </p>
                </div>
              </div>
            </div>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent mb-5" />

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-primary/5 p-3 border border-primary/10 transition-colors hover:bg-primary/10">
                <p className="text-[9px] text-muted-foreground uppercase mb-1 font-bold tracking-wider">Academic Score</p>
                <div className="flex items-baseline gap-1">
                  <p className="font-display font-black text-2xl text-primary">{selected.hIndex}</p>
                  <span className="text-[10px] font-bold text-primary/60">h-index</span>
                </div>
              </div>
              <div className="rounded-xl bg-primary/5 p-3 border border-primary/10 overflow-hidden">
                <p className="text-[9px] text-muted-foreground uppercase mb-1 font-bold tracking-wider">Center</p>
                <p className="font-bold text-foreground text-xs leading-tight line-clamp-2">{selected.affiliation}</p>
              </div>
              <div className="col-span-2 rounded-xl bg-primary/5 p-4 border border-primary/10">
                <p className="text-[9px] text-muted-foreground uppercase mb-2 font-bold tracking-wider">
                  Expertise / Research Domain
                </p>
                <p className="font-semibold text-foreground text-sm leading-relaxed">{selected.specialty}</p>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedId(null)
              }}
              className="mt-6 w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              System Return
            </button>
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
        @keyframes scanner-line {
          0% { transform: translateY(-100%); opacity: 0; }
          20% { opacity: 0.5; }
          80% { opacity: 0.5; }
          100% { transform: translateY(200%); opacity: 0; }
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
  const currentScale = isHovered ? scale * 1.12 : scale
  const heightPx = (member.height / 186) * 320 * currentScale

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className="relative group focus:outline-none transition-all duration-700 ease-out"
      style={
        {
          '--char-scale': currentScale,
          opacity: isFaded ? 0.3 : 1,
          zIndex: isHovered ? 60 : (isSelected ? 55 : (member.row === 0 ? 40 : 20)),
          filter: isFaded
            ? 'grayscale(0.9) blur(2px)'
            : isHovered
              ? 'brightness(1.1) drop-shadow(0 0 35px rgba(var(--primary), 0.6))'
              : 'drop-shadow(0 0 10px rgba(var(--primary), 0.15))',
          animation: isHovered ? 'none' : `${member.idleAnimation} ${4 + Math.random() * 3}s ease-in-out infinite`,
          transform: isHovered
            ? `translateY(${-40 * scale}px)`
            : `translateX(${member.position * 45 * scale}px)`,
          cursor: 'pointer',
        } as React.CSSProperties
      }
    >
      <div
        style={{ height: `${heightPx}px`, width: `${heightPx * 0.65}px` }}
        className="relative transition-all duration-500"
      >
        {/* Base Pose */}
        <Image
          src={member.image}
          alt={member.name}
          fill
          className={`object-contain object-bottom transition-all duration-500 ${isHovered ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
          sizes="500px"
          priority
        />
        
        {/* Active Pose */}
        <Image
          src={member.activeImage}
          alt={`${member.name} active`}
          fill
          className={`object-contain object-bottom transition-all duration-500 ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          sizes="500px"
          priority={isHovered}
        />

        {/* Hologram Scanner Loop on Hover */}
        {isHovered && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-b-3xl">
            <div
              className="absolute top-0 left-0 w-full h-1 bg-primary/40 shadow-[0_0_15px_rgba(var(--primary),0.8)] z-10"
              style={{ animation: 'scanner-line 2s linear infinite' }}
            />
            <div className="absolute inset-0 bg-primary/5 animate-pulse" />
          </div>
        )}
      </div>

      {/* Radial Base Glow on select/hover */}
      {(isSelected || isHovered) && (
        <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-[120%] h-8 bg-primary/20 blur-xl rounded-[100%] animate-pulse" />
      )}
    </button>
  )
}

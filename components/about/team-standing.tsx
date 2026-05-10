"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

/* ───────────────────── Team Data ───────────────────── */
interface TeamMember {
  id: string;
  name: string;
  title: string;
  affiliation: string;
  baseImage: string;
  activeImage: string;
  hIndex: number;
  logos: { src: string; alt: string }[];
  row: number; // 0=front, 1=middle, 2=back
  offset: number; // horizontal offset
}

const teamMembers: TeamMember[] = [
  {
    id: "jamalirad",
    name: "Hossein Jamalirad",
    title: "PhD Candidate",
    affiliation: "Medical University, Medical Informatics Group",
    baseImage: "/images/team/char_jamalirad.png",
    activeImage: "/images/team/char_jamalirad_active.png",
    hIndex: 4,
    logos: [
      { src: "/images/team/mums_logo.jpeg", alt: "MUMS" },
      { src: "/images/team/medical_informatics_logo.png", alt: "Medical Informatics" },
    ],
    row: 0,
    offset: 0,
  },
  {
    id: "vakili",
    name: "Dr. Hassan Vakili",
    title: "1st Supervisor",
    affiliation: "Medical University, Medical Informatics Group",
    baseImage: "/images/team/char_vakili.png",
    activeImage: "/images/team/char_vakili_active.png",
    hIndex: 12,
    logos: [
      { src: "/images/team/mums_logo.jpeg", alt: "MUMS" },
      { src: "/images/team/medical_informatics_logo.png", alt: "Medical Informatics" },
    ],
    row: 1,
    offset: 140, // right of center
  },
  {
    id: "sabbaghian",
    name: "Dr. Marjan Sabbaghian",
    title: "1st Clinical Supervisor",
    affiliation: "Royan Institute, Male Infertility Referral Center",
    baseImage: "/images/team/char_sabbaghian.png",
    activeImage: "/images/team/char_sabbaghian_active.png",
    hIndex: 30,
    logos: [{ src: "/images/team/royan_logo.png", alt: "Royan Institute" }],
    row: 1,
    offset: -140, // left of center
  },
  {
    id: "eslami",
    name: "Dr. Saeid Eslami",
    title: "2nd Supervisor",
    affiliation: "Medical University, Medical Informatics Group",
    baseImage: "/images/team/char_eslami.png",
    activeImage: "/images/team/char_eslami_active.png",
    hIndex: 55,
    logos: [{ src: "/images/team/medical_informatics_logo.png", alt: "Medical Informatics" }],
    row: 2,
    offset: -260, // far left
  },
  {
    id: "gilani",
    name: "Dr. Mohammad Ali Sadighi Gilani",
    title: "Associate",
    affiliation: "Royan Institute, Male Infertility Referral Center",
    baseImage: "/images/team/char_gilani.png",
    activeImage: "/images/team/char_gilani_active.png",
    hIndex: 30,
    logos: [{ src: "/images/team/royan_logo.png", alt: "Royan Institute" }],
    row: 2,
    offset: 260, // far right
  },
];

/* ───────────────────── Hover Card ───────────────────── */
function HoverCard({
  member,
  show,
  anchorRect,
  containerRect,
}: {
  member: TeamMember;
  show: boolean;
  anchorRect: DOMRect | null;
  containerRect: DOMRect | null;
}) {
  if (!anchorRect || !containerRect) return null;

  const cardW = 280;
  let left = anchorRect.left + anchorRect.width / 2 - containerRect.left - cardW / 2;
  const top = anchorRect.top - containerRect.top - 15;

  if (left < 10) left = 10;
  if (left + cardW > containerRect.width - 10) left = containerRect.width - cardW - 10;

  return (
    <div
      style={{
        position: "absolute",
        left: `${left}px`,
        top: `${top}px`,
        width: `${cardW}px`,
        transform: show ? "translateY(-100%) scale(1)" : "translateY(-90%) scale(0.95)",
        opacity: show ? 1 : 0,
        transition: "all 0.3s cubic-bezier(0.2, 0, 0, 1)",
        zIndex: 100,
        pointerEvents: "none",
      }}
    >
      <div
        className="rounded-2xl p-5 text-center shadow-2xl border"
        style={{
          background: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(20px)",
          borderColor: "rgba(0, 120, 255, 0.15)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)",
        }}
      >
        <h3 className="text-base font-bold text-slate-800 mb-1">{member.name}</h3>
        <p className="text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wider">
          {member.title}
        </p>
        <p className="text-[11px] text-slate-500 leading-tight mb-3 px-2">
          {member.affiliation}
        </p>
        
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="px-2 py-0.5 rounded bg-blue-50 text-[10px] font-bold text-blue-700 border border-blue-100 uppercase tracking-tighter">
            h-index: {member.hIndex}
          </div>
        </div>

        <div className="flex justify-center gap-2.5">
          {member.logos.map((logo) => (
            <div
              key={logo.alt}
              className="w-8 h-8 rounded-full overflow-hidden bg-white shadow-sm border border-slate-100 flex items-center justify-center p-1"
            >
              <Image src={logo.src} alt={logo.alt} width={28} height={28} className="object-contain" />
            </div>
          ))}
        </div>
      </div>
      {/* Small arrow/beak */}
      <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-[rgba(255,255,255,0.85)] rotate-45 border-r border-b" style={{ borderColor: 'rgba(0, 120, 255, 0.15)' }} />
    </div>
  );
}

/* ───────────────────── Main Component ───────────────────── */
export default function TeamStanding() {
  const [loaded, setLoaded] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const charRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);
  const [anchorRects, setAnchorRects] = useState<Record<string, DOMRect>>({});

  useEffect(() => {
    setLoaded(true);
    const handleResize = () => {
      if (containerRef.current) setContainerRect(containerRef.current.getBoundingClientRect());
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const updateRects = (id: string) => {
    if (containerRef.current) setContainerRect(containerRef.current.getBoundingClientRect());
    const el = charRefs.current[id];
    if (el) setAnchorRects((prev) => ({ ...prev, [id]: el.getBoundingClientRect() }));
  };

  return (
    <section
      ref={containerRef}
      className="relative w-full overflow-visible py-12"
      style={{
        minHeight: "650px",
        background: "radial-gradient(circle at center, #ffffff 0%, #f8fafc 100%)",
      }}
    >
      {/* Background decoration: Subtle professional pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='https://i.etsystatic.com/31715137/r/il/318760/3318728368/il_570xN.3318728368_s0u8.jpg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} 
      />

      <div className="relative z-10 text-center mb-16">
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Meet Our Research Team</h2>
        <div className="w-16 h-1 bg-blue-500 mx-auto mt-4 rounded-full opacity-30" />
      </div>

      <div className="relative max-w-5xl mx-auto h-[400px]">
        {/* The Overlapping Standing Team Composition */}
        {teamMembers.map((member, i) => {
          const isFront = member.row === 0;
          const isMiddle = member.row === 1;
          const isHovered = hoveredId === member.id;
          
          // Width/Scale logic
          const baseScale = isFront ? 1.05 : isMiddle ? 0.9 : 0.8;
          const scale = isHovered ? baseScale * 1.05 : baseScale;
          const zIndex = isHovered ? 50 : (isFront ? 40 : isMiddle ? 30 : 20);
          
          // Responsive width for team members
          const charWidth = isFront ? "240px" : isMiddle ? "210px" : "180px";

          return (
            <div
              key={member.id}
              ref={(el) => { charRefs.current[member.id] = el; }}
              className="absolute bottom-0 transition-all duration-500 ease-out cursor-pointer"
              style={{
                left: `calc(50% + ${member.offset}px)`,
                transform: `translateX(-50%)`,
                zIndex,
                width: charWidth,
                opacity: loaded ? 1 : 0,
              }}
              onMouseEnter={() => {
                setHoveredId(member.id);
                updateRects(member.id);
              }}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div 
                className="relative w-full aspect-[2/3] transition-transform duration-300"
                style={{ 
                  transform: `scale(${scale})`,
                  filter: !isHovered && hoveredId !== null ? "grayscale(0.4) opacity(0.7)" : "none",
                  transition: 'all 0.4s ease'
                }}
              >
                {/* Images */}
                <Image
                  src={member.baseImage}
                  alt={member.name}
                  fill
                  className="object-contain object-bottom transition-opacity duration-300"
                  style={{ 
                    opacity: isHovered ? 0 : 1,
                    filter: isFront ? "drop-shadow(0 10px 20px rgba(0,0,0,0.12))" : "drop-shadow(0 5px 10px rgba(0,0,0,0.08))"
                  }}
                  sizes="240px"
                />
                <Image
                  src={member.activeImage}
                  alt={`${member.name} active`}
                  fill
                  className="object-contain object-bottom transition-opacity duration-300"
                  style={{ 
                    opacity: isHovered ? 1 : 0,
                    filter: "drop-shadow(0 15px 30px rgba(0,0,0,0.15))"
                  }}
                  sizes="240px"
                />
              </div>
              
              {/* Subtle name badge below */}
              <div className="text-center mt-3 translate-y-2">
                <span className={`text-[11px] font-bold tracking-tight px-3 py-1 rounded-full border transition-all ${isHovered ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200' : 'bg-white text-slate-500 border-slate-100'}`}>
                  {member.name}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Hover Cards */}
      {teamMembers.map((member) => (
        <HoverCard
          key={`card-${member.id}`}
          member={member}
          show={hoveredId === member.id}
          anchorRect={anchorRects[member.id] ?? null}
          containerRect={containerRect}
        />
      ))}
    </section>
  );
}

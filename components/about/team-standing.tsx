"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

/* ───────────────────── Team Data ───────────────────── */
interface TeamMember {
  id: string;
  name: string;
  title: string;
  hIndex: number;
  affiliation: string;
  baseImage: string;
  activeImage: string;
  logos: { src: string; alt: string }[];
  row: number; // 0=front, 1=middle, 2=back
  col: number; // position in row
}

const teamMembers: TeamMember[] = [
  {
    id: "jamalirad",
    name: "Dr. Hossein Jamalirad",
    title: "PhD Candidate",
    hIndex: 4,
    affiliation: "MUMS",
    baseImage: "/images/team/char_jamalirad.png",
    activeImage: "/images/team/char_jamalirad_active.png",
    logos: [
      { src: "/images/team/mums_logo.jpeg", alt: "MUMS" },
      { src: "/images/team/medical_informatics_logo.png", alt: "Medical Informatics" },
    ],
    row: 0,
    col: 0,
  },
  {
    id: "sabbaghian",
    name: "Dr. Marjan Sabbaghian",
    title: "Principal Investigator",
    hIndex: 30,
    affiliation: "Royan Institute",
    baseImage: "/images/team/char_sabbaghian.png",
    activeImage: "/images/team/char_sabbaghian_active.png",
    logos: [{ src: "/images/team/royan_logo.png", alt: "Royan Institute" }],
    row: 1,
    col: 0,
  },
  {
    id: "vakili",
    name: "Dr. Saeid Vakili",
    title: "Associate Professor",
    hIndex: 12,
    affiliation: "MUMS",
    baseImage: "/images/team/char_vakili.png",
    activeImage: "/images/team/char_vakili_active.png",
    logos: [
      { src: "/images/team/mums_logo.jpeg", alt: "MUMS" },
      { src: "/images/team/medical_informatics_logo.png", alt: "Medical Informatics" },
    ],
    row: 1,
    col: 1,
  },
  {
    id: "eslami",
    name: "Dr. Saeid Eslami",
    title: "Professor",
    hIndex: 55,
    affiliation: "MUMS & University of Amsterdam",
    baseImage: "/images/team/char_eslami.png",
    activeImage: "/images/team/char_eslami_active.png",
    logos: [
      { src: "/images/team/medical_informatics_logo.png", alt: "Medical Informatics" },
    ],
    row: 2,
    col: 0,
  },
  {
    id: "gilani",
    name: "Dr. Mohammad Ali Sadighi Gilani",
    title: "Professor of Urology",
    hIndex: 30,
    affiliation: "Royan Institute",
    baseImage: "/images/team/char_gilani.png",
    activeImage: "/images/team/char_gilani_active.png",
    logos: [{ src: "/images/team/royan_logo.png", alt: "Royan Institute" }],
    row: 2,
    col: 1,
  },
];

interface RobotData {
  id: string;
  image: string;
  position: React.CSSProperties;
  animDelay: number;
}

const robots: RobotData[] = [
  {
    id: "robot1",
    image: "/images/team/robot_male_1.png",
    position: { left: "1%", bottom: "4%" },
    animDelay: 0,
  },
  {
    id: "robot2",
    image: "/images/team/robot_female_1.png",
    position: { left: "16%", bottom: "6%" },
    animDelay: 0.5,
  },
  {
    id: "robot3",
    image: "/images/team/robot_male_2.png",
    position: { right: "14%", bottom: "6%" },
    animDelay: 1.0,
  },
  {
    id: "robot4",
    image: "/images/team/robot_female_2.png",
    position: { right: "-1%", bottom: "2%" },
    animDelay: 1.5,
  },
];

/* ───────────────────── Floating Info Card ───────────────────── */
function FloatingCard({
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

  // Position card above the character, centered, clamped to viewport
  const cardW = 240;
  let left = anchorRect.left + anchorRect.width / 2 - containerRect.left - cardW / 2;
  const top = anchorRect.top - containerRect.top - 12;

  // Clamp horizontally
  if (left < 8) left = 8;
  if (left + cardW > containerRect.width - 8) left = containerRect.width - cardW - 8;

  return (
    <div
      style={{
        position: "absolute",
        left: `${left}px`,
        top: `${top}px`,
        width: `${cardW}px`,
        transform: show ? "translateY(-100%) scale(1)" : "translateY(-85%) scale(0.9)",
        opacity: show ? 1 : 0,
        transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
        zIndex: 50,
        pointerEvents: "none",
      }}
    >
      <div
        className="rounded-xl p-4 text-center relative"
        style={{
          background:
            "linear-gradient(135deg, rgba(0,255,255,0.14) 0%, rgba(0,100,255,0.12) 100%)",
          border: "1px solid rgba(0,255,255,0.35)",
          backdropFilter: "blur(18px)",
          boxShadow:
            "0 0 40px rgba(0,255,255,0.18), inset 0 0 30px rgba(0,255,255,0.06), 0 8px 32px rgba(0,0,0,0.3)",
        }}
      >
        {/* Scanline overlay */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none"
          style={{
            background:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.03) 2px, rgba(0,255,255,0.03) 4px)",
          }}
        />
        <h3
          className="text-sm font-bold mb-1"
          style={{ color: "#00ffff", textShadow: "0 0 10px rgba(0,255,255,0.5)" }}
        >
          {member.name}
        </h3>
        <p className="text-xs text-cyan-200 mb-1">{member.title}</p>
        <p className="text-xs text-cyan-300/70 mb-2">{member.affiliation}</p>
        <div className="flex items-center justify-center gap-1 text-xs" style={{ color: "#7dd3fc" }}>
          <span className="font-mono font-bold text-cyan-400">h-index:</span>
          <span className="font-mono text-white font-bold">{member.hIndex}</span>
        </div>
        <div className="flex justify-center gap-2 mt-2">
          {member.logos.map((logo) => (
            <div
              key={logo.alt}
              className="w-7 h-7 rounded-full overflow-hidden bg-white/10 flex items-center justify-center"
              style={{ border: "1px solid rgba(0,255,255,0.3)" }}
            >
              <Image src={logo.src} alt={logo.alt} width={24} height={24} className="object-contain" />
            </div>
          ))}
        </div>
        {/* Bottom glow */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full"
          style={{
            width: "60%",
            background: "linear-gradient(90deg, transparent, #00ffff, transparent)",
            boxShadow: "0 0 10px rgba(0,255,255,0.5)",
          }}
        />
      </div>
    </div>
  );
}

/* ───────────────────── Character Card ───────────────────── */
function CharacterCard({
  member,
  index,
  isVisible,
  onHover,
  onLeave,
  hovered,
  setRef,
}: {
  member: TeamMember;
  index: number;
  isVisible: boolean;
  onHover: () => void;
  onLeave: () => void;
  hovered: boolean;
  setRef: (el: HTMLDivElement | null) => void;
}) {
  // Breathing / idle sway animation with unique timing
  const breathDuration = 3.5 + index * 0.4;
  const swayDuration = 5 + index * 0.7;
  const isFront = member.row === 0;
  const charHeight = isFront ? "clamp(220px, 38vw, 400px)" : member.row === 1 ? "clamp(180px, 30vw, 340px)" : "clamp(160px, 26vw, 300px)";

  return (
    <div
      ref={setRef}
      className="relative flex flex-col items-center"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(40px)",
        transition: `opacity 0.6s ease ${index * 0.12}s, transform 0.6s ease ${index * 0.12}s`,
        zIndex: hovered ? 20 : (isFront ? 15 : 10),
        animation: isVisible
          ? `charBreathe ${breathDuration}s ease-in-out infinite, charSway ${swayDuration}s ease-in-out infinite`
          : "none",
        animationDelay: `${index * 0.3}s`,
        cursor: "pointer",
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {/* Character Image */}
      <div
        className="relative"
        style={{
          width: isFront ? "clamp(140px, 22vw, 260px)" : member.row === 1 ? "clamp(120px, 18vw, 220px)" : "clamp(100px, 15vw, 190px)",
          height: charHeight,
          transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)",
          transform: hovered ? "translateY(-16px) scale(1.07)" : "translateY(0) scale(1)",
        }}
      >
        <Image
          src={member.baseImage}
          alt={member.name}
          fill
          className="object-contain object-bottom"
          style={{
            opacity: hovered ? 0 : 1,
            transition: "opacity 0.3s ease",
            filter: `drop-shadow(0 0 ${isFront ? '12px' : '8px'} rgba(0,255,255,${isFront ? '0.25' : '0.15'}))`,
          }}
          sizes="(max-width: 768px) 35vw, 20vw"
        />
        <Image
          src={member.activeImage}
          alt={`${member.name} active`}
          fill
          className="object-contain object-bottom"
          style={{
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.3s ease",
            filter: "drop-shadow(0 0 18px rgba(0,255,255,0.35))",
          }}
          sizes="(max-width: 768px) 35vw, 20vw"
        />
      </div>

      {/* Name label */}
      <div className="mt-1 text-center">
        <p
          className="text-xs sm:text-sm font-semibold whitespace-nowrap"
          style={{
            color: hovered ? "#00ffff" : isFront ? "#cbd5e1" : "#94a3b8",
            textShadow: hovered ? "0 0 8px rgba(0,255,255,0.4)" : "none",
            transition: "all 0.3s ease",
          }}
        >
          {member.name}
        </p>
      </div>
    </div>
  );
}

/* ───────────────────── Animated Robot ───────────────────── */
function AnimatedRobot({ robot, loaded }: { robot: RobotData; loaded: boolean }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        ...robot.position,
        height: "48%",
        opacity: loaded ? 0.4 : 0,
        transition: "opacity 1.5s ease",
        zIndex: 1,
        animation: loaded
          ? `robotTyping 1.2s ease-in-out infinite, robotBreathe 4s ease-in-out infinite, robotSway 6s ease-in-out infinite`
          : "none",
        animationDelay: `${robot.animDelay}s, ${robot.animDelay + 0.3}s, ${robot.animDelay + 0.6}s`,
      }}
    >
      <Image
        src={robot.image}
        alt="AI Robot"
        width={200}
        height={300}
        className="object-contain"
        style={{
          filter:
            "brightness(0.55) saturate(0.6) drop-shadow(0 0 12px rgba(0,255,255,0.12))",
          height: "100%",
          width: "auto",
        }}
      />
      {/* Keyboard glow beneath robot */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2"
        style={{
          width: "70%",
          height: "6px",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(0,255,255,0.15), transparent 70%)",
          animation: `kbGlow 1.2s ease-in-out infinite`,
          animationDelay: `${robot.animDelay}s`,
        }}
      />
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
    const timer = setTimeout(() => setLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Update rects on hover
  useEffect(() => {
    if (hoveredId && containerRef.current) {
      setContainerRect(containerRef.current.getBoundingClientRect());
      const el = charRefs.current[hoveredId];
      if (el) {
        setAnchorRects((prev) => ({ ...prev, [hoveredId]: el.getBoundingClientRect() }));
      }
    }
  }, [hoveredId]);

  // Rows for pyramid layout
  const frontRow = teamMembers.filter((m) => m.row === 0);
  const middleRow = teamMembers.filter((m) => m.row === 1);
  const backRow = teamMembers.filter((m) => m.row === 2);

  return (
    <section
      ref={containerRef}
      className="relative w-full overflow-visible"
      style={{
        minHeight: "700px",
        background:
          "linear-gradient(180deg, #020810 0%, #071222 20%, #0c1e38 45%, #0a1a30 70%, #060e1c 100%)",
      }}
    >
      {/* ── Background: Futuristic AI Corporation Steps ── */}
      {/* Subtle perspective grid floor */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(rgba(0,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,255,0.025) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
          maskImage: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.8) 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.8) 100%)",
        }}
      />

      {/* Staircase / platform steps — seamless gradient bands */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Back step */}
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: "0",
            right: "0",
            height: "55%",
            background: "linear-gradient(180deg, rgba(8,20,40,0) 0%, rgba(10,25,50,0.6) 30%, rgba(6,15,35,0.8) 100%)",
          }}
        />
        {/* Middle step highlight */}
        <div
          style={{
            position: "absolute",
            bottom: "18%",
            left: "10%",
            right: "10%",
            height: "3px",
            background: "linear-gradient(90deg, transparent, rgba(0,255,255,0.08), rgba(0,200,255,0.12), rgba(0,255,255,0.08), transparent)",
            borderRadius: "2px",
          }}
        />
        {/* Front step highlight */}
        <div
          style={{
            position: "absolute",
            bottom: "8%",
            left: "15%",
            right: "15%",
            height: "3px",
            background: "linear-gradient(90deg, transparent, rgba(0,255,255,0.1), rgba(0,220,255,0.15), rgba(0,255,255,0.1), transparent)",
            borderRadius: "2px",
          }}
        />
      </div>

      {/* Ambient glow orbs */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "5%", left: "10%", width: "350px", height: "350px",
          background: "radial-gradient(circle, rgba(0,80,200,0.07) 0%, transparent 70%)",
          borderRadius: "50%",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          top: "15%", right: "5%", width: "400px", height: "400px",
          background: "radial-gradient(circle, rgba(0,255,255,0.05) 0%, transparent 70%)",
          borderRadius: "50%",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "20%", left: "50%", transform: "translateX(-50%)", width: "600px", height: "300px",
          background: "radial-gradient(ellipse, rgba(0,180,255,0.04) 0%, transparent 70%)",
        }}
      />

      {/* Holographic monitor panels */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "6%", left: "4%", width: "160px", height: "100px",
          border: "1px solid rgba(0,255,255,0.08)",
          borderRadius: "8px",
          background: "linear-gradient(135deg, rgba(0,255,255,0.02), rgba(0,100,255,0.015))",
          boxShadow: "0 0 15px rgba(0,255,255,0.04)",
          transform: "perspective(800px) rotateY(12deg)",
          animation: "monitorPulse 4s ease-in-out infinite",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          top: "4%", right: "6%", width: "180px", height: "110px",
          border: "1px solid rgba(0,255,255,0.06)",
          borderRadius: "8px",
          background: "linear-gradient(135deg, rgba(0,100,255,0.02), rgba(0,255,255,0.015))",
          boxShadow: "0 0 12px rgba(0,100,255,0.04)",
          transform: "perspective(800px) rotateY(-10deg)",
          animation: "monitorPulse 4.5s ease-in-out infinite 1s",
        }}
      />

      {/* ── Title ── */}
      <div className="relative z-10 text-center pt-8 pb-2">
        <h2
          className="text-2xl sm:text-3xl font-bold mb-1"
          style={{ color: "#e2e8f0", textShadow: "0 0 20px rgba(0,255,255,0.2)" }}
        >
          NOA Research Team
        </h2>
        <div
          className="mx-auto h-[2px] w-32 mt-2"
          style={{
            background: "linear-gradient(90deg, transparent, #00ffff, transparent)",
            boxShadow: "0 0 10px rgba(0,255,255,0.3)",
          }}
        />
        <p className="text-xs sm:text-sm mt-2" style={{ color: "rgba(0,255,255,0.45)" }}>
          AI Corporation Headquarters
        </p>
      </div>

      {/* ── Animated Robots ── */}
      {robots.map((robot) => (
        <AnimatedRobot key={robot.id} robot={robot} loaded={loaded} />
      ))}

      {/* ── Team Pyramid Layout ── */}
      <div className="relative z-10" style={{ maxWidth: "1000px", margin: "0 auto", paddingBottom: "30px" }}>

        {/* Back Row — smallest, furthest back */}
        <div className="flex items-end justify-center gap-1 sm:gap-3 mb-0">
          {backRow.map((member, i) => (
            <CharacterCard
              key={member.id}
              member={member}
              index={i + 3}
              isVisible={loaded}
              hovered={hoveredId === member.id}
              onHover={() => setHoveredId(member.id)}
              onLeave={() => setHoveredId(null)}
              setRef={(el) => { charRefs.current[member.id] = el; }}
            />
          ))}
        </div>

        {/* Middle Row */}
        <div className="flex items-end justify-center gap-1 sm:gap-4 -mt-6 sm:-mt-10">
          {middleRow.map((member, i) => (
            <CharacterCard
              key={member.id}
              member={member}
              index={i + 1}
              isVisible={loaded}
              hovered={hoveredId === member.id}
              onHover={() => setHoveredId(member.id)}
              onLeave={() => setHoveredId(null)}
              setRef={(el) => { charRefs.current[member.id] = el; }}
            />
          ))}
        </div>

        {/* Front Row — Jamalirad, biggest, forward */}
        <div className="flex items-end justify-center -mt-8 sm:-mt-14">
          {frontRow.map((member) => (
            <CharacterCard
              key={member.id}
              member={member}
              index={0}
              isVisible={loaded}
              hovered={hoveredId === member.id}
              onHover={() => setHoveredId(member.id)}
              onLeave={() => setHoveredId(null)}
              setRef={(el) => { charRefs.current[member.id] = el; }}
            />
          ))}
        </div>
      </div>

      {/* ── Floating Hover Cards (rendered at container level to avoid clipping) ── */}
      {teamMembers.map((member) => (
        <FloatingCard
          key={`card-${member.id}`}
          member={member}
          show={hoveredId === member.id}
          anchorRect={anchorRects[member.id] ?? null}
          containerRect={containerRect}
        />
      ))}

      {/* Floor glow */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{
          background: "linear-gradient(0deg, rgba(0,255,255,0.05) 0%, transparent 100%)",
        }}
      />

      {/* Scanning line */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 5 }}>
        <div
          className="absolute w-full h-[1px]"
          style={{
            background: "linear-gradient(90deg, transparent 0%, rgba(0,255,255,0.07) 50%, transparent 100%)",
            animation: "scanline 8s linear infinite",
          }}
        />
      </div>

      {/* ── Keyframe Animations ── */}
      <style jsx>{`
        @keyframes scanline {
          0% { top: -5%; }
          100% { top: 105%; }
        }
        @keyframes charBreathe {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes charSway {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(1.5px) rotate(0.3deg); }
          75% { transform: translateX(-1.5px) rotate(-0.3deg); }
        }
        @keyframes robotTyping {
          0%, 100% { transform: translateY(0); }
          15% { transform: translateY(-2px) rotate(-0.5deg); }
          30% { transform: translateY(0) rotate(0.3deg); }
          45% { transform: translateY(-1.5px) rotate(-0.3deg); }
          60% { transform: translateY(0) rotate(0.2deg); }
          75% { transform: translateY(-2px) rotate(-0.4deg); }
          90% { transform: translateY(0); }
        }
        @keyframes robotBreathe {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.008); }
        }
        @keyframes robotSway {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(2px); }
        }
        @keyframes kbGlow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
        @keyframes monitorPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </section>
  );
}

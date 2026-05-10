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
}

const teamMembers: TeamMember[] = [
  {
    id: "jamalirad",
    name: "Hossein Jamalirad",
    title: "PhD Candidate",
    hIndex: 4,
    affiliation: "MUMS",
    baseImage: "/images/team/char_jamalirad.png",
    activeImage: "/images/team/char_jamalirad_active.png",
    logos: [
      { src: "/images/team/mums_logo.jpeg", alt: "MUMS" },
      { src: "/images/team/medical_informatics_logo.png", alt: "Medical Informatics" },
    ],
  },
  {
    id: "sabbaghian",
    name: "Marjan Sabbaghian",
    title: "Principal Investigator",
    hIndex: 30,
    affiliation: "Royan Institute",
    baseImage: "/images/team/char_sabbaghian.png",
    activeImage: "/images/team/char_sabbaghian_active.png",
    logos: [{ src: "/images/team/royan_logo.png", alt: "Royan Institute" }],
  },
  {
    id: "gilani",
    name: "Mohammad Ali Shah Gilani",
    title: "Professor of Urology",
    hIndex: 30,
    affiliation: "Royan Institute",
    baseImage: "/images/team/char_gilani.png",
    activeImage: "/images/team/char_gilani_active.png",
    logos: [{ src: "/images/team/royan_logo.png", alt: "Royan Institute" }],
  },
  {
    id: "vakili",
    name: "Saeid Vakili",
    title: "Associate Professor",
    hIndex: 12,
    affiliation: "MUMS",
    baseImage: "/images/team/char_vakili.png",
    activeImage: "/images/team/char_vakili_active.png",
    logos: [
      { src: "/images/team/mums_logo.jpeg", alt: "MUMS" },
      { src: "/images/team/medical_informatics_logo.png", alt: "Medical Informatics" },
    ],
  },
  {
    id: "eslami",
    name: "Saeid Eslami",
    title: "Professor",
    hIndex: 55,
    affiliation: "MUMS & University of Amsterdam",
    baseImage: "/images/team/char_eslami.png",
    activeImage: "/images/team/char_eslami_active.png",
    logos: [
      { src: "/images/team/medical_informatics_logo.png", alt: "Medical Informatics" },
    ],
  },
];

interface RobotData {
  id: string;
  image: string;
  style: React.CSSProperties;
}

const robots: RobotData[] = [
  {
    id: "robot1",
    image: "/images/team/robot_male_1.png",
    style: { left: "2%", bottom: "8%", height: "55%", opacity: 0.45, zIndex: 1 },
  },
  {
    id: "robot2",
    image: "/images/team/robot_female_1.png",
    style: { left: "22%", bottom: "10%", height: "50%", opacity: 0.4, zIndex: 1 },
  },
  {
    id: "robot3",
    image: "/images/team/robot_male_2.png",
    style: { right: "20%", bottom: "10%", height: "50%", opacity: 0.4, zIndex: 1 },
  },
  {
    id: "robot4",
    image: "/images/team/robot_female_2.png",
    style: { right: "0%", bottom: "5%", height: "52%", opacity: 0.42, zIndex: 1 },
  },
];

/* ───────────────────── Character Card ───────────────────── */
function CharacterCard({
  member,
  index,
  isVisible,
}: {
  member: TeamMember;
  index: number;
  isVisible: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative flex flex-col items-center"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(40px)",
        transition: `opacity 0.6s ease ${index * 0.15}s, transform 0.6s ease ${index * 0.15}s`,
        zIndex: hovered ? 20 : 10,
        flex: "1 1 0",
        minWidth: 0,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Hologram Info Card — appears on hover */}
      <div
        className="absolute -top-4 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          opacity: hovered ? 1 : 0,
          transform: hovered ? "translateY(-100%) scale(1)" : "translateY(-80%) scale(0.9)",
          transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)",
          zIndex: 30,
          width: "220px",
        }}
      >
        <div
          className="relative rounded-xl p-4 text-center"
          style={{
            background: "linear-gradient(135deg, rgba(0,255,255,0.12) 0%, rgba(0,100,255,0.10) 100%)",
            border: "1px solid rgba(0,255,255,0.3)",
            backdropFilter: "blur(16px)",
            boxShadow: "0 0 30px rgba(0,255,255,0.15), inset 0 0 30px rgba(0,255,255,0.05)",
          }}
        >
          {/* Scanline effect */}
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
          <div
            className="flex items-center justify-center gap-1 text-xs"
            style={{ color: "#7dd3fc" }}
          >
            <span className="font-mono font-bold text-cyan-400">h-index:</span>
            <span className="font-mono text-white font-bold">{member.hIndex}</span>
          </div>
          {/* Logos */}
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
          {/* Bottom glow line */}
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

      {/* Character Image Container */}
      <div
        className="relative w-full"
        style={{
          height: "clamp(200px, 35vw, 380px)",
          transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)",
          transform: hovered ? "translateY(-20px) scale(1.08)" : "translateY(0) scale(1)",
          cursor: "pointer",
        }}
      >
        {/* Base image */}
        <Image
          src={member.baseImage}
          alt={member.name}
          fill
          className="object-contain object-bottom"
          style={{
            opacity: hovered ? 0 : 1,
            transition: "opacity 0.3s ease",
            filter: "drop-shadow(0 0 8px rgba(0,255,255,0.15))",
          }}
          sizes="(max-width: 768px) 40vw, 18vw"
        />
        {/* Active/hovered image (crossed arms) */}
        <Image
          src={member.activeImage}
          alt={`${member.name} - active`}
          fill
          className="object-contain object-bottom"
          style={{
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.3s ease",
            filter: "drop-shadow(0 0 15px rgba(0,255,255,0.3))",
          }}
          sizes="(max-width: 768px) 40vw, 18vw"
        />
      </div>

      {/* Name label below character */}
      <div
        className="mt-1 text-center"
        style={{
          opacity: hovered ? 1 : 0.7,
          transition: "opacity 0.3s ease",
        }}
      >
        <p
          className="text-xs sm:text-sm font-semibold"
          style={{
            color: hovered ? "#00ffff" : "#94a3b8",
            textShadow: hovered ? "0 0 8px rgba(0,255,255,0.4)" : "none",
            transition: "all 0.3s ease",
          }}
        >
          {member.name.split(" ").slice(-1)[0]}
        </p>
      </div>
    </div>
  );
}

/* ───────────────────── Main Component ───────────────────── */
export default function TeamStanding() {
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative w-full overflow-hidden"
      style={{
        minHeight: "600px",
        background:
          "linear-gradient(180deg, #030712 0%, #0a1628 30%, #0d1f3c 60%, #091525 100%)",
      }}
    >
      {/* AI Corporation Background Effects */}
      {/* Grid floor */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          perspective: "500px",
          transformStyle: "preserve-3d",
        }}
      />

      {/* Ambient glow spots */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "10%",
          left: "15%",
          width: "300px",
          height: "300px",
          background: "radial-gradient(circle, rgba(0,100,255,0.08) 0%, transparent 70%)",
          borderRadius: "50%",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          top: "20%",
          right: "10%",
          width: "400px",
          height: "400px",
          background: "radial-gradient(circle, rgba(0,255,255,0.06) 0%, transparent 70%)",
          borderRadius: "50%",
        }}
      />

      {/* Floating holographic monitors in background */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "8%",
          left: "5%",
          width: "180px",
          height: "120px",
          border: "1px solid rgba(0,255,255,0.1)",
          borderRadius: "8px",
          background: "linear-gradient(135deg, rgba(0,255,255,0.03), rgba(0,100,255,0.02))",
          boxShadow: "0 0 20px rgba(0,255,255,0.05)",
          transform: "perspective(800px) rotateY(15deg)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          top: "5%",
          right: "8%",
          width: "200px",
          height: "130px",
          border: "1px solid rgba(0,255,255,0.08)",
          borderRadius: "8px",
          background: "linear-gradient(135deg, rgba(0,100,255,0.03), rgba(0,255,255,0.02))",
          boxShadow: "0 0 15px rgba(0,100,255,0.05)",
          transform: "perspective(800px) rotateY(-10deg)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          top: "15%",
          left: "40%",
          width: "160px",
          height: "100px",
          border: "1px solid rgba(0,255,255,0.06)",
          borderRadius: "8px",
          background: "linear-gradient(135deg, rgba(0,255,255,0.02), rgba(0,100,255,0.01))",
          boxShadow: "0 0 10px rgba(0,255,255,0.03)",
        }}
      />

      {/* Title */}
      <div className="relative z-10 text-center pt-8 pb-4">
        <h2
          className="text-2xl sm:text-3xl font-bold mb-1"
          style={{
            color: "#e2e8f0",
            textShadow: "0 0 20px rgba(0,255,255,0.2)",
          }}
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
        <p
          className="text-xs sm:text-sm mt-2"
          style={{ color: "rgba(0,255,255,0.5)" }}
        >
          AI Corporation Headquarters
        </p>
      </div>

      {/* Robots in background */}
      {robots.map((robot) => (
        <div
          key={robot.id}
          className="absolute pointer-events-none"
          style={{
            ...robot.style,
            position: "absolute",
            opacity: loaded ? (robot.style.opacity as number) : 0,
            transition: "opacity 1.5s ease",
          }}
        >
          <Image
            src={robot.image}
            alt="AI Robot"
            width={200}
            height={300}
            className="object-contain"
            style={{
              filter: "brightness(0.6) saturate(0.7) drop-shadow(0 0 10px rgba(0,255,255,0.1))",
              height: "100%",
              width: "auto",
            }}
          />
        </div>
      ))}

      {/* Team Members Row */}
      <div
        className="relative z-10 flex items-end justify-center gap-2 sm:gap-4 px-4 sm:px-8 mt-4"
        style={{ maxWidth: "1100px", margin: "0 auto", paddingBottom: "40px" }}
      >
        {teamMembers.map((member, i) => (
          <CharacterCard key={member.id} member={member} index={i} isVisible={loaded} />
        ))}
      </div>

      {/* Floor hologram glow */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background:
            "linear-gradient(0deg, rgba(0,255,255,0.06) 0%, transparent 100%)",
        }}
      />

      {/* Animated scanline */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 5 }}
      >
        <div
          className="absolute w-full h-[1px]"
          style={{
            background: "linear-gradient(90deg, transparent 0%, rgba(0,255,255,0.08) 50%, transparent 100%)",
            animation: "scanline 8s linear infinite",
          }}
        />
      </div>

      <style jsx>{`
        @keyframes scanline {
          0% {
            top: -10%;
          }
          100% {
            top: 110%;
          }
        }
      `}</style>
    </section>
  );
}

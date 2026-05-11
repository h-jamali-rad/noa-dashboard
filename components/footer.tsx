import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-border/60 bg-card/40">
      <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-screen-2xl mx-auto space-y-6 text-sm text-muted-foreground">
        {/* Navigation Links */}
        <div className="flex flex-wrap gap-4">
          <Link href="/phase/preprocessing" className="hover:text-primary">Preprocessing</Link>
          <Link href="/phase/training" className="hover:text-primary">Training</Link>
          <Link href="/phase/validation" className="hover:text-primary">Validation</Link>
          <Link href="/phase/xai" className="hover:text-primary">XAI</Link>
          <Link href="/cdss" className="hover:text-primary">CDSS</Link>
          <Link href="/usability-testing" className="hover:text-primary">Usability Testing</Link>
          <Link href="/publications" className="hover:text-primary">Publications</Link>
          <Link href="/references" className="hover:text-primary">References</Link>
        </div>

        {/* Logos */}
        <div className="flex items-center justify-center gap-8 py-4">
          <Image
            src="/logos/mums.jpeg"
            alt="Mashhad University of Medical Sciences"
            width={56}
            height={56}
            className="rounded-lg opacity-80 hover:opacity-100 transition-opacity"
          />
          <Image
            src="/logos/royan.png"
            alt="Royan Institute"
            width={56}
            height={56}
            className="rounded-lg opacity-80 hover:opacity-100 transition-opacity"
          />
          <Image
            src="/logos/medical-informatics.jpeg"
            alt="Medical Informatics Department"
            width={56}
            height={56}
            className="rounded-lg opacity-80 hover:opacity-100 transition-opacity"
          />
        </div>

        {/* Credit */}
        <p className="text-xs text-center">
          Developed by Hossein Jamalirad, PhD Candidate — Department of Medical Informatics, Mashhad University of Medical Sciences (MUMS) · Royan Institute Male Infertility Referral Center, Tehran · 2026
        </p>
      </div>
    </footer>
  )
}

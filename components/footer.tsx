import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-border/60 bg-card/40">
      <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-screen-2xl mx-auto space-y-4 text-sm text-muted-foreground">
        <div className="flex flex-wrap gap-4">
          <Link href="/phase/preprocessing" className="hover:text-primary">Preprocessing</Link>
          <Link href="/phase/training" className="hover:text-primary">Training</Link>
          <Link href="/phase/validation" className="hover:text-primary">Validation</Link>
          <Link href="/phase/xai" className="hover:text-primary">XAI</Link>
          <Link href="/cdss" className="hover:text-primary">CDSS</Link>
          <Link href="/publications" className="hover:text-primary">Publications</Link>
          <Link href="/references" className="hover:text-primary">References</Link>
        </div>
        <p className="text-xs">Developed by Hossein Jamalirad, PhD Candidate of Medical Informatics in Medical University @ MUMS-2026</p>
      </div>
    </footer>
  )
}

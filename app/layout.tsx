import { DM_Sans, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { ChunkLoadErrorHandler } from '@/components/chunk-load-error-handler'
import SiteShell from '@/components/site-shell'
import RoadmapFab from '@/components/roadmap-fab'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans' })
const jakartaSans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-display' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'NOA microTESE Research Dashboard — 6-Agent ML Pipeline',
  description:
    'Interactive PhD dissertation portfolio: end-to-end machine-learning pipeline for predicting sperm retrieval in non-obstructive azoospermia patients undergoing microTESE — from raw data to explainable AI.',
  keywords: [
    'NOA',
    'microTESE',
    'machine learning',
    'XAI',
    'SHAP',
    'LIME',
    'TRIPOD',
    'PhD dissertation',
    'Royan Institute',
    'Mashhad University of Medical Sciences',
  ],
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    title: 'NOA microTESE Research Dashboard',
    description:
      'PhD ML pipeline portfolio: 6 agents, 27 models, 464 visualizations, TRIPOD/PROBAST-compliant.',
    images: ['/og-image.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NOA microTESE Research Dashboard',
    description:
      'Interactive 6-agent NOA microTESE ML pipeline portfolio.',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${jakartaSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <SiteShell>{children}</SiteShell>
          <RoadmapFab />
          <Toaster />
          <ChunkLoadErrorHandler />
        </ThemeProvider>
      </body>
    </html>
  )
}

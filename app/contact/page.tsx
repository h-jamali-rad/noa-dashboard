import Image from 'next/image'
import BreadcrumbNav from '@/components/breadcrumb-nav'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Stethoscope,
  Activity,
  TrendingUp,
  ShieldAlert,
  Database,
  LayoutDashboard,
  Users,
  BookOpen,
  ScanLine,
  Pill,
  BarChart3,
  Sparkles,
  Sparkle,
  ArrowRight,
} from 'lucide-react'

// ─── Inline brand-accurate SVG icons ─────────────────────────────────
function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0Zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3.000-2.211-1.447 1.394c-.16.16-.295.295-.605.295l.21-3.053 5.56-5.022c.242-.213-.054-.334-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.135-.953l11.566-4.458c.538-.196 1.006.128.832.94Z"
      />
    </svg>
  )
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.815 11.815 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24Zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981Zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414Z"
      />
    </svg>
  )
}

function EmailIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M1.5 4.5h21A1.5 1.5 0 0 1 24 6v12a1.5 1.5 0 0 1-1.5 1.5h-21A1.5 1.5 0 0 1 0 18V6a1.5 1.5 0 0 1 1.5-1.5Zm.6 1.74L12 13.122 21.9 6.24H2.1ZM22.5 7.65l-9.954 6.93a1.5 1.5 0 0 1-1.092 0L1.5 7.65V18h21V7.65Z"
      />
    </svg>
  )
}

// ─── Services list ───────────────────────────────────────────────────
type Service = {
  icon: typeof Stethoscope
  title: string
  description: string
}

const SERVICES: Service[] = [
  {
    icon: Stethoscope,
    title: 'Clinical Decision Support Systems',
    description:
      'CDSS for any medical domain — not limited to male infertility. From cardiology to oncology to endocrinology, we build evidence-based decision aids tailored to your workflow.',
  },
  {
    icon: TrendingUp,
    title: 'Supervised Prediction Models',
    description:
      'Surgical outcome prediction, disease diagnosis, and prognostic models built with rigorous ML pipelines, calibration, and decision-curve analysis.',
  },
  {
    icon: Activity,
    title: 'Survival Analysis',
    description:
      'Kaplan–Meier curves, Cox proportional-hazards models, time-to-event analysis, and patient prognosis dashboards — production-ready and reproducible.',
  },
  {
    icon: ShieldAlert,
    title: 'Clinical Risk Scoring Systems',
    description:
      'Custom-derived risk scores with internal/external validation, calibration, and clinical-utility curves — deployable as web tools or embedded in your EMR.',
  },
  {
    icon: Database,
    title: 'Medical Registry Systems',
    description:
      'End-to-end patient data registration & management platforms with role-based access, audit trails, and compliant data handling.',
  },
  {
    icon: LayoutDashboard,
    title: 'Hospital MIS Dashboards',
    description:
      'Management information systems for hospitals & clinics — operational KPIs, bed-occupancy, throughput, finance, and quality indicators in one pane.',
  },
  {
    icon: Users,
    title: 'Patient Management & Follow-up',
    description:
      'Longitudinal patient follow-up systems with automated reminders, outcome tracking, and adherence monitoring.',
  },
  {
    icon: BookOpen,
    title: 'Academic & Research Workflows',
    description:
      'Article management, systematic reviews, citation graphs, publication pipelines, and team collaboration tooling for research groups.',
  },
  {
    icon: ScanLine,
    title: 'Diagnostic Image Analysis',
    description:
      'Medical-imaging AI: classification, segmentation, and detection across modalities (X-ray, CT, MRI, histopathology, ultrasound).',
  },
  {
    icon: Pill,
    title: 'Drug Response & Pharmacogenomics',
    description:
      'Predicting drug response, adverse events, and dose optimisation using clinical, genomic, and pharmacogenomic data.',
  },
  {
    icon: BarChart3,
    title: 'Biostatistical Analysis Platform',
    description:
      'Hosted analytical platforms for any medical statistical question — from descriptive epidemiology to advanced causal inference.',
  },
  {
    icon: Sparkles,
    title: 'Custom Healthcare Solutions',
    description:
      'Anything in medical informatics. Bring us your problem — from data extraction to deployed product — and we will design the right pipeline.',
  },
]

// ─── Contact constants ──────────────────────────────────────────────
const TELEGRAM_HANDLE = '@hradit'
const TELEGRAM_URL = 'https://t.me/hradit'
const EMAIL = 'h.rad.it@gmail.com'
const EMAIL_URL = `mailto:${EMAIL}`
const WHATSAPP_DISPLAY = '+98 912 22 44 227'
const WHATSAPP_URL = 'https://wa.me/989122244227'

export default function ContactPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-screen-2xl mx-auto space-y-12">
      <BreadcrumbNav items={[{ label: 'Contact & Beyond' }]} />

      {/* ─── CONTACT HERO SECTION ─────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-card hero-pattern">
        <div className="absolute inset-0 gradient-brand-soft opacity-60 pointer-events-none" />
        <div className="relative grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 md:gap-10 items-center p-6 sm:p-10">
          {/* Portrait */}
          <div className="mx-auto md:mx-0">
            <div className="relative h-44 w-44 sm:h-52 sm:w-52 md:h-60 md:w-60 rounded-full overflow-hidden ring-4 ring-primary/20 ring-offset-4 ring-offset-card shadow-[var(--shadow-lg)]">
              <Image
                src="/images/hossein-portrait.png"
                alt="Hossein Jamalirad — PhD Candidate of Medical Informatics, MUMS"
                fill
                sizes="(max-width: 768px) 11rem, 15rem"
                className="object-cover"
                priority
              />
            </div>
          </div>

          {/* Identity & contacts */}
          <div className="text-center md:text-left space-y-5">
            <div className="space-y-2">
              <h1 className="font-display font-bold text-3xl sm:text-4xl tracking-tight">
                Hossein Jamalirad
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
                PhD Candidate of Medical Informatics, Mashhad University of Medical Sciences (MUMS)
              </p>
            </div>

            <ul className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-4">
              <li>
                <a
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2.5 rounded-full border border-border/60 bg-background/70 backdrop-blur-sm px-4 py-2 text-sm font-medium text-foreground/90 hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-colors"
                >
                  <TelegramIcon className="h-4 w-4 text-[#229ED9] group-hover:scale-110 transition-transform" />
                  <span>{TELEGRAM_HANDLE}</span>
                </a>
              </li>
              <li>
                <a
                  href={EMAIL_URL}
                  className="group inline-flex items-center gap-2.5 rounded-full border border-border/60 bg-background/70 backdrop-blur-sm px-4 py-2 text-sm font-medium text-foreground/90 hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-colors"
                >
                  <EmailIcon className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                  <span>{EMAIL}</span>
                </a>
              </li>
              <li>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2.5 rounded-full border border-border/60 bg-background/70 backdrop-blur-sm px-4 py-2 text-sm font-medium text-foreground/90 hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-colors"
                >
                  <WhatsAppIcon className="h-4 w-4 text-[#25D366] group-hover:scale-110 transition-transform" />
                  <span>{WHATSAPP_DISPLAY}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ─── BEYOND NOA SECTION ────────────────────────────────────────── */}
      <section className="space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
            <Sparkle className="h-3 w-3" />
            Beyond NOA
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight">
            <span className="text-gradient-brand">Beyond NOA</span> — What We Can Build For You
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            We are <strong className="text-foreground">not</strong> limited to the NOA Dashboard. With full-stack
            Medical Informatics expertise and AI-powered analytics, we can build solutions for{' '}
            <strong className="text-foreground">any</strong> medical domain — from clinical decision support and
            survival analysis to hospital MIS dashboards and diagnostic imaging.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {SERVICES.map((service) => {
            const Icon = service.icon
            return (
              <Card
                key={service.title}
                variant="interactive"
                className="group h-full"
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-display font-semibold text-base leading-snug tracking-tight">
                      {service.title}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {service.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* ─── CLOSING CTA ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-card">
        <div className="absolute inset-0 gradient-brand-vibrant opacity-95" />
        <div className="relative px-6 sm:px-10 py-10 sm:py-14 text-center space-y-6">
          <div className="space-y-3 max-w-3xl mx-auto">
            <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-white">
              We go beyond NOA
            </h2>
            <p className="text-sm sm:text-base text-white/90 leading-relaxed">
              With full-stack expertise in Medical Informatics, we are ready to collaborate on any medical project.
              Do not hesitate to contact us!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
            <Button
              asChild
              variant="glass-light"
              size="lg"
              className="w-full sm:w-auto"
            >
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                <TelegramIcon className="h-4 w-4" />
                <span>Telegram</span>
                <ArrowRight className="h-4 w-4 opacity-70" />
              </a>
            </Button>
            <Button
              asChild
              variant="glass-light"
              size="lg"
              className="w-full sm:w-auto"
            >
              <a
                href={EMAIL_URL}
                className="inline-flex items-center gap-2"
              >
                <EmailIcon className="h-4 w-4" />
                <span>Email</span>
                <ArrowRight className="h-4 w-4 opacity-70" />
              </a>
            </Button>
            <Button
              asChild
              variant="glass-light"
              size="lg"
              className="w-full sm:w-auto"
            >
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                <WhatsAppIcon className="h-4 w-4" />
                <span>WhatsApp</span>
                <ArrowRight className="h-4 w-4 opacity-70" />
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

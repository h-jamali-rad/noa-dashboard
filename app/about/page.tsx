import BreadcrumbNav from '@/components/breadcrumb-nav'
import TeamStanding from '@/components/about/team-standing'
import Image from 'next/image'
import { GraduationCap, Stethoscope, Brain, Building2, Microscope, Users } from 'lucide-react'

const TEAM = [
  {
    name: 'Hossein Jamalirad',
    role: 'PhD Candidate & Principal Investigator',
    title: 'Department of Medical Informatics',
    affiliation: 'Mashhad University of Medical Sciences (MUMS)',
    description: 'Designed and implemented the full multi-agent AI architecture, trained 16 ML models, built the v2 pathology-integrated pipeline, and developed this research dashboard. Responsible for data preprocessing, model selection, SHAP explainability, calibration analysis, and the NOA CDSS design.',
    icon: GraduationCap,
    color: '#0e7490',
    logo: '/logos/mums.jpeg',
  },
  {
    name: 'Dr. Hassan Vakili Arki',
    role: '1st Supervisor',
    title: 'Department of Medical Informatics',
    affiliation: 'Mashhad University of Medical Sciences (MUMS)',
    description: 'Supervised the methodological rigor of the ML pipeline, nested cross-validation design, and the statistical framework. Guided the audit that identified 9 critical defects in the v1 pipeline and oversaw the v2 reconstruction.',
    icon: Brain,
    color: '#4f46e5',
    logo: '/logos/medical-informatics.jpeg',
  },
  {
    name: 'Dr. Saeid Eslami',
    role: '2nd Supervisor',
    title: 'Department of Medical Informatics',
    affiliation: 'Mashhad University of Medical Sciences (MUMS)',
    description: 'Provided expertise in clinical decision support system architecture, health informatics standards, and deployment strategy. Contributed to the CDSS validation framework and usability evaluation protocol.',
    icon: Building2,
    color: '#7c3aed',
    logo: '/logos/medical-informatics.jpeg',
  },
  {
    name: 'Dr. Marjan Sabbaghian',
    role: '1st Clinical Supervisor',
    title: 'Department of Andrology, Reproductive Biomedicine Research Center',
    affiliation: 'Royan Institute Male Infertility Referral Center, Tehran',
    description: 'Provided clinical oversight of the NOA patient cohort from Royan Institute (n=2,413). Supervised the pathology data extraction, clinical scenario validation, and ensured the CDSS inputs align with real-world micro-TESE preoperative workflows.',
    icon: Microscope,
    color: '#059669',
    logo: '/logos/royan.png',
  },
  {
    name: 'Dr. Muhammad Ali Sadighi Gilani',
    role: 'Associate Clinical Professor & 2nd Clinical Supervisor',
    title: 'Department of Andrology, Reproductive Biomedicine Research Center',
    affiliation: 'Royan Institute Male Infertility Referral Center, Tehran',
    description: 'As one of Iran\'s leading micro-TESE surgeons, provided the clinical domain expertise that shaped the feature engineering strategy. Validated the clinical relevance of SHAP-identified predictors and confirmed pathology dominance in the model.',
    icon: Stethoscope,
    color: '#dc2626',
    logo: '/logos/royan.png',
  },
]

export default function AboutPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-screen-2xl mx-auto space-y-8">
      <BreadcrumbNav items={[{ label: 'About' }]} />

      <div className="text-center space-y-2">
        <h1 className="font-display font-bold text-3xl tracking-tight">Research Team</h1>
        <p className="text-sm text-muted-foreground">
          Click on a team member to view their profile \u2014 hover for a quick preview
        </p>
      </div>

      {/* Interactive team standing picture */}
      <div className="rounded-xl border bg-gradient-to-b from-card via-card to-background p-4 sm:p-8 overflow-hidden">
        <TeamStanding />
      </div>

      {/* About the Collaboration */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-display font-semibold text-xl text-foreground flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          About This Research
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This dashboard presents the outcomes of a collaborative research investigation between the{' '}
          <strong>Department of Medical Informatics at Mashhad University of Medical Sciences (MUMS)</strong>{' '}
          and{' '}
          <strong>Royan Institute Male Infertility Referral Center</strong> in Tehran \u2014 one of the most prominent
          referral centers for male infertility in Iran.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The research is conducted by <strong>Hossein Jamalirad</strong>, PhD Candidate in Medical Informatics at MUMS,
          under the academic supervision of <strong>Dr. Hassan Vakili Arki</strong> and <strong>Dr. Saeid Eslami</strong>{' '}
          from the Medical Informatics group, and under clinical supervision of <strong>Dr. Marjan Sabbaghian</strong> and{' '}
          Associate Clinical Professor <strong>Dr. Muhammad Ali Sadighi Gilani</strong> from Royan Institute.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The study focuses on preoperative prediction of sperm retrieval success in patients with non-obstructive
          azoospermia (NOA) undergoing microdissection testicular sperm extraction (micro-TESE). The pipeline
          evaluates 16 ML models and finalizes 5 in the v2 pathology-integrated pipeline, achieving a best CatBoost
          AUC of 0.8306 (95% CI: 0.823\u20130.845), supported by calibration, decision-curve analysis, SHAP
          explainability, and a deployable Clinical Decision Support System.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          All pipeline outputs, visualizations, articles, podcasts, and agent interactions shown in this dashboard
          were produced by AI agents designed, trained, and orchestrated as part of Hossein Jamalirad\u2019s agentic
          AI architecture.
        </p>
      </div>

      {/* Team Role Cards */}
      <div className="space-y-4">
        <h2 className="font-display font-semibold text-xl text-foreground">Team Members & Roles</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {TEAM.map((member) => {
            const Icon = member.icon
            return (
              <div key={member.name} className="rounded-xl border bg-card p-5 space-y-3 hover:border-primary/30 transition-colors">
                <div className="flex items-start gap-3">
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center text-white shrink-0 shadow-md"
                    style={{ backgroundColor: member.color }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{member.name}</h3>
                    <p className="text-xs font-medium" style={{ color: member.color }}>{member.role}</p>
                  </div>
                  <Image
                    src={member.logo}
                    alt=""
                    width={32}
                    height={32}
                    className="rounded-md opacity-70 shrink-0"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] text-muted-foreground">{member.title}</p>
                  <p className="text-[11px] text-muted-foreground">{member.affiliation}</p>
                </div>
                <p className="text-xs text-foreground/70 leading-relaxed">
                  {member.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Institutional Logos */}
      <div className="flex items-center justify-center gap-10 py-6">
        <div className="text-center space-y-2">
          <Image src="/logos/mums.jpeg" alt="MUMS" width={64} height={64} className="rounded-lg mx-auto" />
          <p className="text-[10px] text-muted-foreground">MUMS</p>
        </div>
        <div className="text-center space-y-2">
          <Image src="/logos/royan.png" alt="Royan Institute" width={64} height={64} className="rounded-lg mx-auto" />
          <p className="text-[10px] text-muted-foreground">Royan Institute</p>
        </div>
        <div className="text-center space-y-2">
          <Image src="/logos/medical-informatics.jpeg" alt="Medical Informatics" width={64} height={64} className="rounded-lg mx-auto" />
          <p className="text-[10px] text-muted-foreground">Medical Informatics</p>
        </div>
      </div>
    </div>
  )
}
